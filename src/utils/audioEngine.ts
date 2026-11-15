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

export interface AudioBandRange {
  startBin: number;
  endBin: number;
}

export interface AudioBeatMetrics {
  freqData: Uint8Array;
  timeData: Uint8Array;
  levels: { left: number; right: number; peak: number };
  bands: {
    subBass: number;
    bass: number;
    mid: number;
    highMid: number;
    high: number;
  };
  bandRanges: [AudioBandRange, AudioBandRange, AudioBandRange, AudioBandRange, AudioBandRange];
  beatPulse: number;
  tempoPhase: number;
  hasLiveSpectrum: boolean;
  isAudible: boolean;
}

const DEFAULT_BAND_RANGES: [AudioBandRange, AudioBandRange, AudioBandRange, AudioBandRange, AudioBandRange] = [
  { startBin: 1, endBin: 3 },
  { startBin: 3, endBin: 7 },
  { startBin: 7, endBin: 32 },
  { startBin: 32, endBin: 96 },
  { startBin: 96, endBin: 240 },
];

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
  private isUnlocked = false;

  // Synthesizer test beat generator for zero-latency local audio
  private synthInterval: number | null = null;
  private isSynthPlaying = false;

  // Internal VU physics & spectral-flux beat detector state
  private tempoPhase = 0;
  private syntheticClockSec = 0;
  private lastMetricsTime = 0;
  private hasReceivedLiveAudio = false;
  private prevKickEnergy = 0;
  private prevSnareEnergy = 0;
  private slowKickAvg = 0.2;
  private smoothBands = { subBass: 0, bass: 0, mid: 0, highMid: 0, high: 0 };
  private beatPulseState = 0;
  private rawFreqBuffer: Uint8Array<ArrayBuffer> | null = null;
  private rawTimeBuffer: Uint8Array<ArrayBuffer> | null = null;
  private cachedMetrics: AudioBeatMetrics = {
    freqData: new Uint8Array(256),
    timeData: new Uint8Array(256).fill(128),
    levels: { left: 0, right: 0, peak: 0 },
    bands: { subBass: 0, bass: 0, mid: 0, highMid: 0, high: 0 },
    bandRanges: DEFAULT_BAND_RANGES,
    beatPulse: 0,
    tempoPhase: 0,
    hasLiveSpectrum: false,
    isAudible: false,
  };

  private currentVolume = 0.85;
  private isMutedState = false;
  private currentEqualizer: 'flat' | 'bass' | 'rock' | 'pop' | 'vocal' | 'electronic' = 'rock';

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

  public ensureCorsEnabled(): void {
    if (this.audio) {
      try {
        if (this.audio.crossOrigin !== 'anonymous') {
          this.audio.crossOrigin = 'anonymous';
        }
      } catch {}
    }
  }

  public resetLiveAudioLatch(): void {
    this.hasReceivedLiveAudio = false;
    this.prevKickEnergy = 0;
    this.prevSnareEnergy = 0;
    this.slowKickAvg = 0.15;
    this.smoothBands = { subBass: 0, bass: 0, mid: 0, highMid: 0, high: 0 };
    this.beatPulseState = 0;
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

      if (!this.isUnlocked && this.audioContext) {
        try {
          const silentBuffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
          const silentSrc = this.audioContext.createBufferSource();
          silentSrc.buffer = silentBuffer;
          silentSrc.connect(this.audioContext.destination);
          silentSrc.start(0);
          this.isUnlocked = true;
        } catch {}
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
        // 1024-point FFT (~46.8 Hz/bin at 48kHz) + broadcast-safe dB range (-85 to -10 dB)
        // prevents compressed radio loudness from saturating bins at 255.
        this.analyserNode.fftSize = 1024;
        this.analyserNode.smoothingTimeConstant = 0.42;
        this.analyserNode.minDecibels = -85;
        this.analyserNode.maxDecibels = -10;
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

  private getEqWeights(): { bass: number; mid: number; high: number } {
    switch (this.currentEqualizer) {
      case 'bass':
        return { bass: 1.45, mid: 1.0, high: 0.9 };
      case 'rock':
        return { bass: 1.25, mid: 0.95, high: 1.28 };
      case 'pop':
        return { bass: 1.1, mid: 1.32, high: 1.2 };
      case 'electronic':
        return { bass: 1.48, mid: 1.0, high: 1.38 };
      case 'vocal':
        return { bass: 0.82, mid: 1.48, high: 1.15 };
      case 'flat':
      default:
        return { bass: 1.0, mid: 1.0, high: 1.0 };
    }
  }

  private computeHzBandRanges(sampleRate: number, fftSize: number, maxBinCount: number): [
    AudioBandRange,
    AudioBandRange,
    AudioBandRange,
    AudioBandRange,
    AudioBandRange,
  ] {
    const hzPerBin = Math.max(10, sampleRate / fftSize);
    const clampBin = (hz: number, minBin: number) =>
      Math.min(maxBinCount - 1, Math.max(minBin, Math.round(hz / hzPerBin)));

    const b0Start = 1;
    const b0End = clampBin(110, b0Start + 1);
    const b1End = clampBin(280, b0End + 1);
    const b2End = clampBin(1500, b1End + 2);
    const b3End = clampBin(4500, b2End + 3);
    const b4End = clampBin(12000, b3End + 4);

    return [
      { startBin: b0Start, endBin: b0End },
      { startBin: b0End, endBin: b1End },
      { startBin: b1End, endBin: b2End },
      { startBin: b2End, endBin: b3End },
      { startBin: b3End, endBin: b4End },
    ];
  }

  private measureBandEnergy(freqData: Uint8Array, range: AudioBandRange, tiltGain: number): number {
    const start = Math.max(0, Math.min(freqData.length - 1, range.startBin));
    const end = Math.max(start + 1, Math.min(freqData.length, range.endBin));
    let sum = 0;
    let peak = 0;
    let count = 0;
    for (let i = start; i < end; i++) {
      const v = freqData[i] / 255;
      sum += v;
      if (v > peak) peak = v;
      count++;
    }
    const avg = count > 0 ? sum / count : 0;
    // Blend average and peak energy so wide mid/high bands don't wash out narrow harmonic peaks
    const combined = (avg * 0.55 + peak * 0.45) * tiltGain;
    return Math.min(1, Math.max(0, combined));
  }

  /**
   * Computes synchronized audio spectrum, Hz-accurate band energies, and spectral-flux beat pulse
   * once per animation frame using elapsed wall-clock time (dt).
   */
  public getBeatMetrics(): AudioBeatMetrics {
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this.lastMetricsTime > 0 && nowMs - this.lastMetricsTime < 6) {
      return this.cachedMetrics;
    }

    const dt =
      this.lastMetricsTime > 0
        ? Math.min(0.1, Math.max(0.001, (nowMs - this.lastMetricsTime) / 1000))
        : 0.016;
    this.lastMetricsTime = nowMs;

    const isAudioActuallyPlaying =
      (this.audio &&
        !this.audio.paused &&
        !this.audio.ended &&
        (this.audio.currentTime > 0 || this.audio.readyState >= 2)) ||
      this.isSynthPlaying;

    const isAudible = Boolean(isAudioActuallyPlaying && !this.isMutedState && this.currentVolume > 0);
    const binCount = 256;

    if (!isAudible) {
      this.hasReceivedLiveAudio = false;
      this.beatPulseState *= Math.exp(-dt * 14);
      if (this.beatPulseState < 0.005) this.beatPulseState = 0;
      const decay = Math.exp(-dt * 12);
      this.smoothBands.subBass *= decay;
      this.smoothBands.bass *= decay;
      this.smoothBands.mid *= decay;
      this.smoothBands.highMid *= decay;
      this.smoothBands.high *= decay;
      this.tempoPhase += dt * 1.4;

      const idleFreq = new Uint8Array(binCount);
      const idleTime = new Uint8Array(binCount).fill(128);

      this.cachedMetrics = {
        freqData: idleFreq,
        timeData: idleTime,
        levels: { left: 0, right: 0, peak: 0 },
        bands: { ...this.smoothBands },
        bandRanges: DEFAULT_BAND_RANGES,
        beatPulse: this.beatPulseState,
        tempoPhase: this.tempoPhase,
        hasLiveSpectrum: false,
        isAudible: false,
      };
      return this.cachedMetrics;
    }

    let hasLiveSpectrum = false;
    const freqData = new Uint8Array(binCount);
    const timeData = new Uint8Array(binCount).fill(128);
    let bandRanges = DEFAULT_BAND_RANGES;

    if (this.analyserNode && this.isConnectedToWebAudio) {
      try {
        const analyserBins = this.analyserNode.frequencyBinCount;
        if (!this.rawFreqBuffer || this.rawFreqBuffer.length !== analyserBins) {
          this.rawFreqBuffer = new Uint8Array(analyserBins);
        }
        if (!this.rawTimeBuffer || this.rawTimeBuffer.length !== analyserBins) {
          this.rawTimeBuffer = new Uint8Array(analyserBins);
        }

        this.analyserNode.getByteFrequencyData(this.rawFreqBuffer);
        this.analyserNode.getByteTimeDomainData(this.rawTimeBuffer);

        const hasNonZeroFreq = this.rawFreqBuffer.some((v) => v > 1);
        const hasNonZeroTime = this.rawTimeBuffer.some((v) => Math.abs(v - 128) > 1);

        if (hasNonZeroFreq || hasNonZeroTime) {
          this.hasReceivedLiveAudio = true;
        }

        const corsSafe = !this.audio || this.audio.crossOrigin === 'anonymous' || this.isSynthPlaying;
        if (this.hasReceivedLiveAudio && corsSafe) {
          hasLiveSpectrum = true;
          const usableBins = Math.min(binCount, analyserBins);
          for (let i = 0; i < usableBins; i++) {
            freqData[i] = this.rawFreqBuffer[i] || 0;
          }
          for (let i = 0; i < binCount; i++) {
            const timeIdx = Math.min(analyserBins - 1, Math.floor((i / binCount) * analyserBins));
            timeData[i] = this.rawTimeBuffer[timeIdx] ?? 128;
          }

          const sampleRate = this.audioContext?.sampleRate || 48000;
          bandRanges = this.computeHzBandRanges(sampleRate, this.analyserNode.fftSize, usableBins);
        }
      } catch {}
    }

    let subBass = 0;
    let bass = 0;
    let mid = 0;
    let highMid = 0;
    let high = 0;

    if (hasLiveSpectrum) {
      const rawSub = this.measureBandEnergy(freqData, bandRanges[0], 1.0);
      const rawBass = this.measureBandEnergy(freqData, bandRanges[1], 1.08);
      const rawMid = this.measureBandEnergy(freqData, bandRanges[2], 1.18);
      const rawHighMid = this.measureBandEnergy(freqData, bandRanges[3], 1.32);
      const rawHigh = this.measureBandEnergy(freqData, bandRanges[4], 1.48);

      const smoothStep = (prev: number, target: number) => {
        const rate = target > prev ? 42 : 12;
        const alpha = 1 - Math.exp(-dt * rate);
        return prev + (target - prev) * alpha;
      };

      subBass = this.smoothBands.subBass = smoothStep(this.smoothBands.subBass, rawSub);
      bass = this.smoothBands.bass = smoothStep(this.smoothBands.bass, rawBass);
      mid = this.smoothBands.mid = smoothStep(this.smoothBands.mid, rawMid);
      highMid = this.smoothBands.highMid = smoothStep(this.smoothBands.highMid, rawHighMid);
      high = this.smoothBands.high = smoothStep(this.smoothBands.high, rawHigh);

      // Spectral-flux onset detector directly locked to real kick (30-280Hz) & snare (1.5-4.5kHz) hits
      const kickNow = rawSub * 0.72 + rawBass * 0.28;
      const snareNow = rawHighMid * 0.65 + rawMid * 0.35;

      const kickFlux = Math.max(0, kickNow - this.prevKickEnergy);
      const snareFlux = Math.max(0, snareNow - this.prevSnareEnergy);
      this.prevKickEnergy = kickNow;
      this.prevSnareEnergy = snareNow;

      const slowAlpha = 1 - Math.exp(-dt * 1.6);
      this.slowKickAvg = this.slowKickAvg * (1 - slowAlpha) + kickNow * slowAlpha;

      const punchAboveAvg = Math.max(0, kickNow - this.slowKickAvg * 1.02);
      const transientHit = Math.min(1, punchAboveAvg * 3.6 + kickFlux * 2.8 + snareFlux * 1.4);
      const baseBassCarry = Math.max(0, kickNow - 0.12) * 0.38;
      const targetBeat = kickNow < 0.04 && snareNow < 0.04 ? 0 : Math.min(1, Math.max(transientHit, baseBassCarry));

      if (targetBeat > this.beatPulseState) {
        const attackAlpha = 1 - Math.exp(-dt * 48);
        this.beatPulseState += (targetBeat - this.beatPulseState) * attackAlpha;
      } else {
        this.beatPulseState *= Math.exp(-dt * 10.5);
      }

      // Advance phase proportional to real mid/bass energy so silence pauses wave motion
      const audioActivity = Math.min(1, subBass * 0.4 + mid * 0.4 + highMid * 0.2);
      this.tempoPhase += dt * (audioActivity * 3.8 + this.beatPulseState * 2.2);
    } else {
      // Fallback only when browser/CORS blocks Web Audio FFT bytes on mobile
      this.syntheticClockSec += dt;
      const t = this.syntheticClockSec;
      const beatIndex = Math.floor(t * 2.0) % 4;
      const beatFrac = (t * 2.0) % 1;
      const eighthFrac = (t * 4.0) % 1;

      const kickAttack =
        beatIndex === 0 || beatIndex === 2
          ? Math.exp(-beatFrac * 7.2)
          : Math.exp(-beatFrac * 10.5) * 0.32;
      const snareAttack =
        beatIndex === 1 || beatIndex === 3
          ? Math.exp(-beatFrac * 8.5)
          : Math.exp(-beatFrac * 12.0) * 0.14;
      const hiHat = Math.exp(-eighthFrac * 12.5) * 0.72;
      const melodicSwell = 0.42 + 0.24 * (Math.sin(t * Math.PI * 0.5) * 0.5 + 0.5);

      const volFactor = Math.max(0.15, this.currentVolume);
      const eq = this.getEqWeights();

      subBass = Math.min(1, (0.18 + kickAttack * 0.78) * volFactor * eq.bass);
      bass = Math.min(1, (0.22 + kickAttack * 0.55 + snareAttack * 0.20) * volFactor * eq.bass);
      mid = Math.min(1, (melodicSwell * 0.65 + snareAttack * 0.38) * volFactor * eq.mid);
      highMid = Math.min(1, (0.18 + snareAttack * 0.68 + hiHat * 0.25) * volFactor * eq.mid);
      high = Math.min(1, (0.14 + hiHat * 0.62 + snareAttack * 0.25) * volFactor * eq.high);

      const targetBeat = Math.min(1, (kickAttack * 0.85 + snareAttack * 0.45) * Math.max(0.4, volFactor));
      if (targetBeat > this.beatPulseState) {
        const attackAlpha = 1 - Math.exp(-dt * 42);
        this.beatPulseState += (targetBeat - this.beatPulseState) * attackAlpha;
      } else {
        this.beatPulseState *= Math.exp(-dt * 9.5);
      }

      this.tempoPhase = t * Math.PI * 2;

      for (let i = 0; i < binCount; i++) {
        const r = i / binCount;
        const shape = 0.85 + 0.15 * Math.cos(i * 0.45 + this.tempoPhase * 0.5);
        let energy = subBass;
        if (i < bandRanges[0].endBin) energy = subBass;
        else if (i < bandRanges[1].endBin) energy = bass;
        else if (i < bandRanges[2].endBin) energy = mid;
        else if (i < bandRanges[3].endBin) energy = highMid;
        else energy = high * (1 - Math.max(0, r - 0.4) * 0.35);
        freqData[i] = Math.min(255, Math.max(0, Math.floor(energy * shape * 255)));
      }

      for (let i = 0; i < binCount; i++) {
        const x = (i / binCount) * Math.PI * 2;
        const wave =
          Math.sin(x * 2 + this.tempoPhase * 2) * (0.35 + subBass * 0.45) +
          Math.sin(x * 4 - this.tempoPhase * 1.5) * (0.20 + mid * 0.30) +
          Math.cos(x * 7 + this.tempoPhase * 3) * (0.10 + high * 0.20);
        timeData[i] = Math.min(255, Math.max(0, Math.floor(128 + wave * 56 * volFactor)));
      }
    }

    let sumSq = 0;
    let maxVal = 0;
    for (let i = 0; i < binCount; i++) {
      const val = freqData[i] / 255;
      sumSq += val * val;
      if (val > maxVal) maxVal = val;
    }
    const rms = Math.sqrt(sumSq / binCount);
    const left = Math.min(1, rms * 1.15 + subBass * 0.22);
    const right = Math.min(1, rms * 1.15 + highMid * 0.22);

    this.cachedMetrics = {
      freqData,
      timeData,
      levels: { left, right, peak: maxVal },
      bands: { subBass, bass, mid, highMid, high },
      bandRanges,
      beatPulse: this.beatPulseState,
      tempoPhase: this.tempoPhase,
      hasLiveSpectrum,
      isAudible: true,
    };

    return this.cachedMetrics;
  }

  /**
   * Returns real-time frequency spectrum (256 bins).
   */
  public getFrequencyData(): Uint8Array {
    return this.getBeatMetrics().freqData;
  }

  /**
   * Returns real-time oscilloscope time domain data (256 samples).
   */
  public getTimeDomainData(): Uint8Array {
    return this.getBeatMetrics().timeData;
  }

  /**
   * Calculates instantaneous RMS and Peak stereo levels (0 to 1) for VU meters
   */
  public getAudioLevels(): { left: number; right: number; peak: number } {
    return this.getBeatMetrics().levels;
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


