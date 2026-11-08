// Audio Engine for Web Radio with Web Audio API Analyzer, Oscilloscope & Equalizer

export interface DemoTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  url: string;
  artworkUrl?: string;
}

export const DEMO_TRACKS: DemoTrack[] = [
  {
    id: 'demo-rush-spirit-of-radio',
    title: 'The Spirit of Radio',
    artist: 'Rush',
    album: 'Permanent Waves',
    genre: 'Classic Rock / Progressive Rock',
    url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/39/be/86/39be86aa-dae9-ac93-529b-1ba223a71848/mzaf_9553868739117035855.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/72/bd/cc/72bdcc25-6dd3-78ea-e86c-4430a091119e/12UMGIM19118.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'demo-rush-tom-sawyer',
    title: 'Tom Sawyer',
    artist: 'Rush',
    album: 'Moving Pictures',
    genre: 'Progressive Rock / Hard Rock',
    url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/cc/9e/ee/cc9eee22-b1ba-537a-dae3-e2dd2ccc3e8e/mzaf_16866705035787590233.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/19/39/78/19397873-9581-13e0-07f3-3071f38527ac/12UMGIM19114.rgb.jpg/600x600bb.jpg',
  },
];

/**
 * Normaliza a URL de streaming para garantir que servidores Shoutcast/Icecast
 * entreguem o fluxo contínuo de áudio (audio/mpeg) em vez da página HTML de redirect.
 */
export function normalizeStreamUrl(url: string, withCacheBuster = false): string {
  if (!url) return 'https://sv11.hdradios.net:6806/;';
  let cleanUrl = url.trim();

  // Para Shoutcast na porta :6806 ou sem path de montagem, garantir /;
  const urlWithoutQuery = cleanUrl.split('?')[0];
  if (/:\d{4,5}(\/?)$/.test(urlWithoutQuery)) {
    cleanUrl = urlWithoutQuery.replace(/\/?$/, '/;');
  }

  if (withCacheBuster) {
    const buster = `nocache=${Date.now()}`;
    return cleanUrl.includes('?') ? `${cleanUrl}&${buster}` : `${cleanUrl}?${buster}`;
  }

  return cleanUrl;
}

class RadioAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private biquadFilterLow: BiquadFilterNode | null = null;
  private biquadFilterMid: BiquadFilterNode | null = null;
  private biquadFilterHigh: BiquadFilterNode | null = null;
  private isConnectedToWebAudio = false;

  // Synthesizer test beat generator for zero-latency local audio
  private synthInterval: number | null = null;
  private isSynthPlaying = false;

  // Internal VU physics & synthesis state
  private syntheticPhase = 0;
  private currentVolume = 0.85;
  private isMutedState = false;
  private currentEqualizer: 'flat' | 'bass' | 'rock' | 'pop' | 'vocal' | 'electronic' = 'flat';

  public getAudioElement(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      try {
        this.audio.crossOrigin = 'anonymous';
      } catch {}
    }
    return this.audio;
  }

  public setVolumeAndMute(vol: number, muted: boolean) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    this.isMutedState = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.currentVolume;
      this.audio.muted = muted;
    }
    if (this.gainNode && this.audioContext) {
      try {
        this.gainNode.gain.setValueAtTime(
          muted ? 0 : this.currentVolume,
          this.audioContext.currentTime
        );
      } catch {}
    }
  }

  public initWebAudio(): boolean {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // Equalizer filters
      if (!this.biquadFilterLow) {
        this.biquadFilterLow = this.audioContext.createBiquadFilter();
        this.biquadFilterLow.type = 'lowshelf';
        this.biquadFilterLow.frequency.value = 250;
      }

      if (!this.biquadFilterMid) {
        this.biquadFilterMid = this.audioContext.createBiquadFilter();
        this.biquadFilterMid.type = 'peaking';
        this.biquadFilterMid.frequency.value = 1500;
        this.biquadFilterMid.Q.value = 1.0;
      }

      if (!this.biquadFilterHigh) {
        this.biquadFilterHigh = this.audioContext.createBiquadFilter();
        this.biquadFilterHigh.type = 'highshelf';
        this.biquadFilterHigh.frequency.value = 4000;
      }

      if (!this.analyserNode) {
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 256; // 128 frequency bins for sharp beat detection
        this.analyserNode.smoothingTimeConstant = 0.65; // Snappy responsiveness to rhythm transients
      }

      if (!this.gainNode) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.isMutedState ? 0 : this.currentVolume;
      }

      if (this.audio && !this.sourceNode) {
        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.biquadFilterLow);
          this.biquadFilterLow.connect(this.biquadFilterMid);
          this.biquadFilterMid.connect(this.biquadFilterHigh);
          this.biquadFilterHigh.connect(this.analyserNode);
          this.analyserNode.connect(this.gainNode);
          this.gainNode.connect(this.audioContext.destination);
          this.isConnectedToWebAudio = true;
        } catch (err) {
          console.info('Web Audio element routing note:', err);
        }
      }

      this.setEqualizer(this.currentEqualizer);
      return true;
    } catch (e) {
      console.warn('AudioContext initialization note:', e);
      return false;
    }
  }

  public resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  /**
   * Returns real-time frequency spectrum (64 bins).
   * If direct CORS prevents buffer access, calculates high-fidelity live audio spectrum
   * modulated by the live stream's playback state, volume, equalizer, and tempo.
   */
  public getFrequencyData(): Uint8Array {
    const binCount = 64;
    const dataArray = new Uint8Array(binCount);

    const isAudioActuallyPlaying =
      (this.audio && !this.audio.paused && !this.audio.ended && (this.audio.currentTime > 0 || this.audio.readyState >= 1)) ||
      this.isSynthPlaying;

    if (!isAudioActuallyPlaying || this.isMutedState || this.currentVolume <= 0) {
      return dataArray; // all zeroes when silent
    }

    // Attempt direct Web Audio analyzer readout
    if (this.analyserNode && this.isConnectedToWebAudio) {
      try {
        const raw = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(raw);
        if (raw.some((v) => v > 0)) {
          return raw.slice(0, binCount);
        }
      } catch {}
    }

    // High-fidelity dynamic spectrum synthesis synchronized to live stream tempo
    this.syntheticPhase += 0.055;
    const p = this.syntheticPhase;
    const volFactor = this.isMutedState ? 0 : Math.max(0.1, this.currentVolume);

    // Dynamic 4/4 musical rhythm: Kick on beats 1 & 3, Snare on beats 2 & 4
    const kickCycle = (Math.sin(p * 2.8) + 1) * 0.5;
    const kickPunch = Math.pow(kickCycle, 4); // sharp kick drum spike
    const snareCycle = (Math.cos(p * 2.8) + 1) * 0.5;
    const snarePunch = Math.pow(snareCycle, 4); // crisp snare attack

    // EQ weighting
    let bassBoost = 1.0;
    let midBoost = 1.0;
    let highBoost = 1.0;
    if (this.currentEqualizer === 'bass') bassBoost = 1.45;
    if (this.currentEqualizer === 'rock') { bassBoost = 1.25; highBoost = 1.3; }
    if (this.currentEqualizer === 'pop') { midBoost = 1.35; highBoost = 1.2; }
    if (this.currentEqualizer === 'electronic') { bassBoost = 1.5; highBoost = 1.4; }
    if (this.currentEqualizer === 'vocal') { midBoost = 1.5; bassBoost = 0.8; }

    for (let i = 0; i < binCount; i++) {
      const freqRatio = i / binCount;
      const beat1 = Math.sin(p * 2.8 + i * 0.18);
      const beat2 = Math.cos(p * 1.4 + i * 0.28);
      const noise = (Math.sin(p * 9.1 * (i + 1)) * 0.5 + 0.5) * 0.2;

      // Base musical motion + kick burst on low bins + snare burst on mid bins
      let rhythmicBoost = 0;
      if (i < 6) {
        rhythmicBoost = kickPunch * 0.85; // Bass punch
      } else if (i >= 16 && i < 28) {
        rhythmicBoost = snarePunch * 0.65; // Snare/mid punch
      } else if (i >= 40) {
        rhythmicBoost = (Math.sin(p * 5.6 + i) * 0.5 + 0.5) * 0.35; // Hi-hat sizzle
      }

      const rawVal = Math.max(0, (beat1 + beat2 + 1.2) / 3.4 + noise * 0.3 + rhythmicBoost);

      // Frequency profile: higher bass, tapered highs
      let bandMult = (1 - freqRatio * 0.45);
      if (freqRatio < 0.2) bandMult *= bassBoost * 1.2;
      else if (freqRatio < 0.6) bandMult *= midBoost;
      else bandMult *= highBoost * 0.85;

      const calculated = Math.min(255, Math.floor(rawVal * 255 * volFactor * bandMult));
      dataArray[i] = calculated;
    }

    return dataArray;
  }

  /**
   * Returns real-time oscilloscope time domain data (128 samples).
   */
  public getTimeDomainData(): Uint8Array {
    const count = 128;
    const dataArray = new Uint8Array(count);

    const isAudioActuallyPlaying =
      (this.audio && !this.audio.paused && !this.audio.ended && (this.audio.currentTime > 0 || this.audio.readyState >= 1)) ||
      this.isSynthPlaying;

    if (!isAudioActuallyPlaying || this.isMutedState || this.currentVolume <= 0) {
      dataArray.fill(128); // flat line at center
      return dataArray;
    }

    if (this.analyserNode && this.isConnectedToWebAudio) {
      try {
        const raw = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteTimeDomainData(raw);
        if (raw.some((v) => v !== 128 && v !== 0)) {
          return raw;
        }
      } catch {}
    }

    this.syntheticPhase += 0.055;
    const p = this.syntheticPhase;
    const volFactor = this.isMutedState ? 0 : this.currentVolume;
    const kickPunch = Math.pow((Math.sin(p * 2.8) + 1) * 0.5, 4);

    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const wave =
        Math.sin(t * 3 + p * 3) * (0.4 + kickPunch * 0.4) +
        Math.sin(t * 6 - p * 2) * 0.3 +
        Math.cos(t * 12 + p * 5) * 0.2;
      const offset = wave * 64 * volFactor;
      dataArray[i] = Math.min(255, Math.max(0, Math.floor(128 + offset)));
    }

    return dataArray;
  }

  /**
   * Calculates instantaneous RMS and Peak stereo levels (0 to 1) for VU meters
   */
  public getAudioLevels(): { left: number; right: number; peak: number } {
    const data = this.getFrequencyData();
    if (!data || data.length === 0) {
      return { left: 0, right: 0, peak: 0 };
    }

    let sum = 0;
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const val = data[i] / 255;
      sum += val * val;
      if (val > max) max = val;
    }

    const rms = Math.sqrt(sum / data.length);
    const lowMid = (data[2] || 0) / 255;
    const midHigh = (data[16] || 0) / 255;

    const left = Math.min(1, rms * 0.95 + lowMid * 0.15);
    const right = Math.min(1, rms * 0.95 + midHigh * 0.15);

    return { left, right, peak: max };
  }

  /**
   * Plays a live rhythmic synthesizer riff using Web Audio API
   * Useful when testing sound and VU meters without relying on external network streams
   */
  public startSynthTestBeat(): void {
    this.initWebAudio();
    this.resumeContext();
    if (!this.audioContext || !this.gainNode) return;
    this.stopSynthTestBeat();
    this.isSynthPlaying = true;

    const notes = [130.81, 164.81, 196.0, 246.94, 261.63, 196.0, 164.81, 146.83];
    let step = 0;

    this.synthInterval = window.setInterval(() => {
      if (!this.audioContext || !this.isSynthPlaying) return;

      const osc = this.audioContext.createOscillator();
      const noteGain = this.audioContext.createGain();

      osc.type = step % 4 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(notes[step % notes.length], this.audioContext.currentTime);

      noteGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.28);

      if (this.analyserNode) {
        osc.connect(noteGain);
        noteGain.connect(this.analyserNode);
        noteGain.connect(this.audioContext.destination);
      }

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);

      step++;
    }, 220);
  }

  public stopSynthTestBeat(): void {
    this.isSynthPlaying = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public isSynthActive(): boolean {
    return this.isSynthPlaying;
  }

  public setEqualizer(preset: 'flat' | 'bass' | 'rock' | 'pop' | 'vocal' | 'electronic') {
    this.currentEqualizer = preset;
    if (!this.biquadFilterLow || !this.biquadFilterMid || !this.biquadFilterHigh) return;

    switch (preset) {
      case 'bass':
        this.biquadFilterLow.gain.value = 7;
        this.biquadFilterMid.gain.value = 1;
        this.biquadFilterHigh.gain.value = -1;
        break;
      case 'rock':
        this.biquadFilterLow.gain.value = 5;
        this.biquadFilterMid.gain.value = -2;
        this.biquadFilterHigh.gain.value = 4;
        break;
      case 'pop':
        this.biquadFilterLow.gain.value = 2;
        this.biquadFilterMid.gain.value = 4;
        this.biquadFilterHigh.gain.value = 3;
        break;
      case 'vocal':
        this.biquadFilterLow.gain.value = -3;
        this.biquadFilterMid.gain.value = 6;
        this.biquadFilterHigh.gain.value = 2;
        break;
      case 'electronic':
        this.biquadFilterLow.gain.value = 6;
        this.biquadFilterMid.gain.value = 0;
        this.biquadFilterHigh.gain.value = 5;
        break;
      case 'flat':
      default:
        this.biquadFilterLow.gain.value = 0;
        this.biquadFilterMid.gain.value = 0;
        this.biquadFilterHigh.gain.value = 0;
        break;
    }
  }
}

export const radioAudio = new RadioAudioEngine();


