import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Activity, Gauge } from 'lucide-react';
import { radioAudio } from '../utils/audioEngine';

export type VisualizerMode = 'bars' | 'wave' | 'vu';

interface VisualizerBackgroundProps {
  isPlaying: boolean;
  isBuffering: boolean;
  mode: VisualizerMode;
  volume?: number;
  isMuted?: boolean;
  className?: string;
}

/**
 * Full-background transparent VU visualizer canvas.
 * Spans the entire area of the main player card with dynamic audio reactivity.
 */
export const CardBackgroundVisualizer: React.FC<VisualizerBackgroundProps> = ({
  isPlaying,
  isBuffering,
  mode,
  volume = 0.85,
  isMuted = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const peaksRef = useRef<number[]>([]);
  const peakHoldTimeRef = useRef<number[]>([]);

  // Resize canvas to match the parent container dimensions precisely
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const newWidth = Math.floor(rect.width * dpr);
        const newHeight = Math.floor(rect.height * dpr);
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
        }
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const isMobile = (width / dpr) < 640;

      const metrics = radioAudio.getBeatMetrics();
      const { freqData, timeData, levels, bands, bandRanges, beatPulse, tempoPhase: phase, hasLiveSpectrum } = metrics;

      const isAudible = isPlaying && !isBuffering && !isMuted && volume > 0;
      const hasRealAudio = isAudible && (hasLiveSpectrum || metrics.isAudible);

      // -------------------------------------------------------------
      // MODE 1: BARRAS EM TODA A EXTENSÃO DO FUNDO (Spanning entire width)
      // -------------------------------------------------------------
      if (mode === 'bars') {
        const barCount = isMobile
          ? Math.min(32, Math.max(20, Math.floor(width / (12 * dpr))))
          : Math.min(64, Math.max(32, Math.floor(width / (16 * dpr))));
        const spacing = (isMobile ? 3 : 4) * dpr;
        const totalSpacing = spacing * (barCount - 1);
        const barWidth = Math.max(2, (width - totalSpacing) / barCount);

        if (peaksRef.current.length !== barCount) {
          peaksRef.current = new Array(barCount).fill(0);
          peakHoldTimeRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          let barHeight = 6 * dpr;

          if (isAudible) {
            if (hasRealAudio && freqData) {
              const dataIndex = Math.min(
                freqData.length - 1,
                Math.floor((i / barCount) * (freqData.length * 0.85))
              );
              const val = freqData[dataIndex] || 0;
              const eqFactor = 1 + (i / barCount) * 0.35;
              barHeight = Math.max(
                8 * dpr,
                ((val / 255) * (height * (isMobile ? 0.65 : 0.72))) * eqFactor
              );
            } else {
              const bufferWave = Math.sin(phase * 2.0 + i * 0.3);
              barHeight = Math.max(8 * dpr, ((bufferWave + 1) / 2) * (height * 0.45) * (0.45 + beatPulse * 0.55));
            }
          } else if (isBuffering) {
            const bufferWave = Math.sin(phase * 3.0 + i * 0.35);
            barHeight = Math.max(
              6 * dpr,
              ((bufferWave + 1) / 2) * (height * 0.3)
            );
          }

          barHeight = Math.min(height * 0.88, Math.max(4 * dpr, barHeight));

          // Peak physics
          if (barHeight > peaksRef.current[i]) {
            peaksRef.current[i] = barHeight;
            peakHoldTimeRef.current[i] = 14;
          } else {
            if (peakHoldTimeRef.current[i] > 0) {
              peakHoldTimeRef.current[i] -= 1;
            } else {
              peaksRef.current[i] = Math.max(4, peaksRef.current[i] - 1.8 * dpr);
            }
          }

          const x = i * (barWidth + spacing);
          const y = height - barHeight;

          // Transparent Ambient Gradient
          const gradient = ctx.createLinearGradient(0, height, 0, height * 0.2);
          if (isBuffering) {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.14)');
          } else if (isAudible) {
            gradient.addColorStop(0, 'rgba(251, 191, 36, 0.04)');
            gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.14)');
            gradient.addColorStop(0.85, 'rgba(251, 191, 36, 0.35)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.55)');
          } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
          }

          ctx.fillStyle = gradient;

          // Top rounded bars
          const radius = Math.min(barWidth / 2, 4 * dpr);
          ctx.beginPath();
          ctx.moveTo(x, height);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.lineTo(x + barWidth - radius, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
          ctx.lineTo(x + barWidth, height);
          ctx.closePath();
          ctx.fill();

          // Peak Cap Marker in transparent background
          if (isAudible && peaksRef.current[i] > 12) {
            const peakY = height - peaksRef.current[i];
            ctx.fillStyle = isBuffering ? 'rgba(255, 255, 255, 0.4)' : 'rgba(251, 191, 36, 0.75)';
            ctx.fillRect(
              x,
              Math.max(2, peakY - 3),
              barWidth,
              2.5 * dpr
            );
          }
        }
      }

      // -------------------------------------------------------------
      // MODE 2: ONDA MULTI-CORDAS OSCILOSCÓPIO COLORIDAS (5 CORDAS HARMÔNICAS)
      // -------------------------------------------------------------
      else if (mode === 'wave') {
        // In responsive mode (mobile card is tall and disc is near upper-center),
        // place centerY at 38% so wave lines pass harmoniously across the disc and pulse ring!
        const centerY = isMobile ? height * 0.38 : height * 0.50;
        const segmentCount = isMobile ? 80 : 120;

        const {
          subBass: subBassEnergy,
          bass: bassEnergy,
          mid: midEnergy,
          highMid: highMidEnergy,
          high: highEnergy,
        } = bands;

        // 5 Cordas Coloridas Harmônicas do VU em Onda (cada uma isolada em sua faixa real de Hz):
        // 1. Ciano Elétrico Neon (Sub-bass / Kick: 30-110 Hz)
        // 2. Verde Esmeralda Neon (Grave / Bassline: 110-280 Hz)
        // 3. Âmbar Dourado (Médios / Vocais e Guitarras: 280-1500 Hz)
        // 4. Rosa Choque / Magenta (Médios-Agudos / Caixa e Presença: 1500-4500 Hz)
        // 5. Roxo Ultravioleta (Agudos / Pratos e Ar: 4500-12000 Hz)
        const waveStrings = [
          {
            id: 'subbass',
            name: 'Ciano Neon',
            color: 'rgba(6, 182, 212, 0.95)',
            glowColor: 'rgba(6, 182, 212, 0.85)',
            lineWidth: 2.8,
            shadowBlur: 11,
            energy: subBassEnergy,
            range: bandRanges[0],
            harmonic: 1.8,
            phaseShift: 0,
            yWeight: 1.15,
            timeRate: 0.9,
            pcmWeight: 0.36,
          },
          {
            id: 'bass',
            name: 'Verde Esmeralda',
            color: 'rgba(16, 185, 129, 0.95)',
            glowColor: 'rgba(16, 185, 129, 0.85)',
            lineWidth: 2.5,
            shadowBlur: 10,
            energy: bassEnergy,
            range: bandRanges[1],
            harmonic: 2.6,
            phaseShift: Math.PI * 0.4,
            yWeight: -0.95,
            timeRate: 1.15,
            pcmWeight: 0.32,
          },
          {
            id: 'mid',
            name: 'Âmbar Dourado',
            color: 'rgba(245, 158, 11, 0.98)',
            glowColor: 'rgba(251, 191, 36, 0.9)',
            lineWidth: 2.8,
            shadowBlur: 12,
            energy: midEnergy,
            range: bandRanges[2],
            harmonic: 3.4,
            phaseShift: Math.PI * 0.8,
            yWeight: 0.9,
            timeRate: 1.35,
            pcmWeight: 0.42,
          },
          {
            id: 'highmid',
            name: 'Rosa Choque Neon',
            color: 'rgba(244, 63, 94, 0.95)',
            glowColor: 'rgba(244, 63, 94, 0.85)',
            lineWidth: 2.4,
            shadowBlur: 9,
            energy: highMidEnergy,
            range: bandRanges[3],
            harmonic: 4.6,
            phaseShift: Math.PI * 1.2,
            yWeight: -0.82,
            timeRate: 1.6,
            pcmWeight: 0.28,
          },
          {
            id: 'high',
            name: 'Roxo Ultravioleta',
            color: 'rgba(168, 85, 247, 0.95)',
            glowColor: 'rgba(168, 85, 247, 0.85)',
            lineWidth: 2.2,
            shadowBlur: 9,
            energy: highEnergy,
            range: bandRanges[4],
            harmonic: 6.0,
            phaseShift: Math.PI * 1.6,
            yWeight: 0.72,
            timeRate: 1.9,
            pcmWeight: 0.22,
          },
        ];

        // Base responsive amplitude
        const baseWaveHeight = isMobile
          ? Math.min(height * 0.24, width * 0.26)
          : height * 0.28;

        // Compute points for each colored wave string strictly from its own isolated frequency band
        const computedStrings: { cfg: typeof waveStrings[0]; points: { x: number; y: number }[] }[] = [];

        for (const strCfg of waveStrings) {
          const points: { x: number; y: number }[] = [];
          const bandStart = Math.max(0, Math.min(freqData.length - 1, strCfg.range.startBin));
          const bandEnd = Math.max(bandStart + 1, Math.min(freqData.length, strCfg.range.endBin));
          const bandSpan = Math.max(1, bandEnd - bandStart);

          for (let i = 0; i <= segmentCount; i++) {
            const x = (i / segmentCount) * width;
            const normalizedI = i / segmentCount;
            const edgeEnvelope = Math.sin(normalizedI * Math.PI);

            let y = centerY;

            if (isAudible && timeData && freqData) {
              const dataIdx = Math.min(
                timeData.length - 1,
                Math.floor(normalizedI * timeData.length)
              );
              const pcmVal = (timeData[dataIdx] - 128) / 128;

              // Map horizontally across THIS string's own isolated FFT bin range (symmetric from center)
              const centerDist = Math.abs(normalizedI * 2 - 1);
              const exactBin = bandStart + centerDist * (bandSpan - 1);
              const binLo = Math.min(freqData.length - 1, Math.floor(exactBin));
              const binHi = Math.min(freqData.length - 1, binLo + 1);
              const frac = exactBin - binLo;
              const localBinVal = (((freqData[binLo] || 0) * (1 - frac) + (freqData[binHi] || 0) * frac) / 255);

              // Drive deflection strictly by THIS band's real spectral energy + local bin shape (0 in silence)
              const bandDrive = strCfg.energy * 0.65 + Math.min(1, localBinVal * 1.15) * 0.35;
              const harmonicOsc = Math.sin(
                normalizedI * Math.PI * strCfg.harmonic +
                phase * strCfg.timeRate +
                strCfg.phaseShift
              );

              const stringDeflection = harmonicOsc * (baseWaveHeight * 1.18 * bandDrive) * strCfg.yWeight;
              const pcmDeflection = hasLiveSpectrum
                ? pcmVal * (baseWaveHeight * strCfg.pcmWeight * (0.22 + strCfg.energy * 0.95))
                : pcmVal * (baseWaveHeight * 0.14 * strCfg.energy);

              y = centerY + (stringDeflection + pcmDeflection) * edgeEnvelope;
            } else if (isBuffering) {
              const buffWave = Math.sin(
                phase * (2.4 + strCfg.timeRate * 0.4) +
                normalizedI * Math.PI * strCfg.harmonic +
                strCfg.phaseShift
              ) * (baseWaveHeight * 0.25) * edgeEnvelope;
              y = centerY + buffWave * strCfg.yWeight;
            } else {
              // Quiet idle rest line when paused or muted
              y = centerY;
            }

            points.push({ x, y });
          }

          computedStrings.push({ cfg: strCfg, points });
        }

        // Ambient multi-color atmospheric glow underneath the waves
        const waveGrad = ctx.createLinearGradient(0, centerY - baseWaveHeight, 0, height);
        const glowOpacity = isAudible ? Math.min(0.32, 0.08 + beatPulse * 0.22) : 0.04;
        waveGrad.addColorStop(0, `rgba(245, 158, 11, ${glowOpacity})`);
        waveGrad.addColorStop(0.35, `rgba(6, 182, 212, ${glowOpacity * 0.8})`);
        waveGrad.addColorStop(0.7, `rgba(168, 85, 247, ${glowOpacity * 0.6})`);
        waveGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        const midPoints = computedStrings[2].points;
        ctx.fillStyle = waveGrad;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(midPoints[0].x, midPoints[0].y);
        for (let i = 1; i < midPoints.length; i++) {
          const xc = (midPoints[i].x + midPoints[i - 1].x) / 2;
          const yc = (midPoints[i].y + midPoints[i - 1].y) / 2;
          ctx.quadraticCurveTo(midPoints[i - 1].x, midPoints[i - 1].y, xc, yc);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Render all 5 colorful wave strings with responsive line thickness & radiant beat glow
        for (const { cfg, points } of computedStrings) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            const xc = (points[i].x + points[i - 1].x) / 2;
            const yc = (points[i].y + points[i - 1].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
          }

          const effectiveLineWidth = isMobile
            ? Math.max(1.6, cfg.lineWidth * 0.75) * dpr
            : cfg.lineWidth * dpr;

          const effectiveGlow = (isAudible
            ? cfg.shadowBlur * (1 + beatPulse * 0.6)
            : cfg.shadowBlur * 0.5
          ) * dpr;

          ctx.shadowColor = cfg.glowColor;
          ctx.shadowBlur = effectiveGlow;
          ctx.strokeStyle = isAudible ? cfg.color : 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = effectiveLineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          ctx.restore();
        }

        // Central luminous bright white core filament pulsing with beat transients
        if (isAudible) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(midPoints[0].x, midPoints[0].y);
          for (let i = 1; i < midPoints.length; i++) {
            const xc = (midPoints[i].x + midPoints[i - 1].x) / 2;
            const yc = (midPoints[i].y + midPoints[i - 1].y) / 2;
            ctx.quadraticCurveTo(midPoints[i - 1].x, midPoints[i - 1].y, xc, yc);
          }
          ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          ctx.shadowBlur = (4 + beatPulse * 12) * dpr;
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.95, 0.45 + beatPulse * 0.5)})`;
          ctx.lineWidth = (isMobile ? 1.4 : 1.8) * dpr;
          ctx.stroke();
          ctx.restore();
        }
      }

      // -------------------------------------------------------------
      // MODE 3: STEREO VU METERS TRANSPARENTES (Side & Bottom Grids)
      // -------------------------------------------------------------
      else if (mode === 'vu') {
        const leftLevel = isAudible ? levels.left : 0;
        const rightLevel = isAudible ? levels.right : 0;

        const segmentCount = isMobile ? 24 : 36;
        const segmentGap = (isMobile ? 3 : 4) * dpr;
        const barHeight = (isMobile ? 14 : 18) * dpr;
        const margin = (isMobile ? 14 : 24) * dpr;
        const barWidth = (width - margin * 2 - (segmentCount - 1) * segmentGap) / segmentCount;

        const drawVuBar = (label: string, level: number, yPos: number) => {
          // Channel Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = `bold ${Math.floor((isMobile ? 10 : 12) * dpr)}px monospace`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, margin - (isMobile ? 14 : 18) * dpr, yPos + barHeight / 2);

          const activeSegs = Math.round(level * segmentCount);

          for (let s = 0; s < segmentCount; s++) {
            const segX = margin + s * (barWidth + segmentGap);
            const isActive = s < activeSegs;

            let segColor = 'rgba(255, 255, 255, 0.03)';
            if (isActive) {
              if (s < segmentCount * 0.65) {
                segColor = 'rgba(16, 185, 129, 0.45)';
              } else if (s < segmentCount * 0.88) {
                segColor = 'rgba(245, 158, 11, 0.65)';
              } else {
                segColor = 'rgba(239, 68, 68, 0.75)';
              }
            }

            ctx.fillStyle = segColor;
            ctx.fillRect(segX, yPos, barWidth, barHeight);
          }
        };

        // Channel L
        drawVuBar('L', leftLevel, height - (isMobile ? 48 : 60) * dpr);

        // Decibel Scale Markings
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = `${Math.floor((isMobile ? 9 : 10) * dpr)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const marks = [
          { label: '-24dB', ratio: 0.15 },
          { label: '-12dB', ratio: 0.5 },
          { label: '-6dB', ratio: 0.72 },
          { label: '0dB', ratio: 0.88 },
          { label: '+3dB', ratio: 0.98 },
        ];
        marks.forEach((m) => {
          const markX = margin + m.ratio * (width - margin * 2);
          ctx.fillText(m.label, markX, height - (isMobile ? 28 : 35) * dpr);
        });

        // Channel R
        drawVuBar('R', rightLevel, height - (isMobile ? 16 : 22) * dpr);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isBuffering, mode, volume, isMuted]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 ${
        className.includes('rounded-') ? '' : 'rounded-3xl'
      } ${className}`}
    >
      {/* Subtle radial ambient grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover relative z-0"
      />
    </div>
  );
};

interface VisualizerControlsProps {
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  className?: string;
}

/**
 * Modern floating pill controls to toggle between Barras, Onda, and Stereo VU.
 */
export const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  mode,
  onModeChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-2 flex-wrap relative z-10 ${className}`}>
      {/* Visualizer Mode Switcher */}
      <div className="inline-flex p-1 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10 shadow-lg gap-1">
        <button
          type="button"
          onClick={() => onModeChange('bars')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            mode === 'bars'
              ? 'bg-white text-black shadow-md font-black'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Fundo VU com Barras de Frequência"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Barras</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('wave')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            mode === 'wave'
              ? 'bg-white text-black shadow-md font-black'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Fundo VU com Onda Osciloscópio Fluida"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Onda</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('vu')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            mode === 'vu'
              ? 'bg-white text-black shadow-md font-black'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Fundo VU com Medidor Estéreo L/R"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Stereo VU</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Compact Stereo VU Meter Bar showing real-time L/R channels with dB scale
 */
export const StereoVuMeterBar: React.FC<{ isPlaying: boolean; isBuffering?: boolean }> = ({
  isPlaying,
  isBuffering = false,
}) => {
  const [levels, setLevels] = useState({ left: 0, right: 0, peak: 0 });

  useEffect(() => {
    let animId: number;
    const update = () => {
      if (isPlaying && !isBuffering) {
        const lvl = radioAudio.getAudioLevels();
        setLevels(lvl);
      } else {
        setLevels({ left: 0, right: 0, peak: 0 });
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isBuffering]);

  const segCount = 18;
  const activeL = Math.round(levels.left * segCount);
  const activeR = Math.round(levels.right * segCount);

  return (
    <div className="w-full max-w-sm px-4 py-2.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-inner flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1">
        <span className="flex items-center gap-1 font-bold text-zinc-300">
          <Gauge className="w-3 h-3 text-amber-400" />
          <span>VU ESTÉREO HD</span>
        </span>
        <div className="flex items-center gap-2 text-zinc-500 text-[9px]">
          <span>-24</span>
          <span>-12</span>
          <span>-6</span>
          <span className="text-amber-400 font-bold">0dB</span>
          <span className="text-red-400 font-bold">+3dB</span>
        </div>
      </div>

      {/* L Channel */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-black text-zinc-400 w-3">L</span>
        <div className="flex-1 flex items-center gap-0.5 h-2.5 bg-zinc-900 rounded p-0.5 border border-zinc-800">
          {Array.from({ length: segCount }).map((_, i) => {
            const isActive = i < activeL;
            let color = 'bg-zinc-800/50';
            if (isActive) {
              if (i < segCount * 0.65) color = 'bg-emerald-500';
              else if (i < segCount * 0.88) color = 'bg-amber-400 shadow-sm shadow-amber-400/50';
              else color = 'bg-red-500 shadow-sm shadow-red-500/50';
            }
            return <div key={i} className={`flex-1 h-full rounded-xs transition-colors duration-75 ${color}`} />;
          })}
        </div>
      </div>

      {/* R Channel */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-black text-zinc-400 w-3">R</span>
        <div className="flex-1 flex items-center gap-0.5 h-2.5 bg-zinc-900 rounded p-0.5 border border-zinc-800">
          {Array.from({ length: segCount }).map((_, i) => {
            const isActive = i < activeR;
            let color = 'bg-zinc-800/50';
            if (isActive) {
              if (i < segCount * 0.65) color = 'bg-emerald-500';
              else if (i < segCount * 0.88) color = 'bg-amber-400 shadow-sm shadow-amber-400/50';
              else color = 'bg-red-500 shadow-sm shadow-red-500/50';
            }
            return <div key={i} className={`flex-1 h-full rounded-xs transition-colors duration-75 ${color}`} />;
          })}
        </div>
      </div>
    </div>
  );
};



