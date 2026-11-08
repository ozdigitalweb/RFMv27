import React, { useEffect } from 'react';
import { Moon, Clock, X, Check, PowerOff } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timerMinutesRemaining: number | null;
  onSetTimer: (minutes: number | null) => void;
}

const TIMER_OPTIONS = [15, 30, 45, 60, 90, 120];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  timerMinutesRemaining,
  onSetTimer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-white/15 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden text-zinc-200 max-h-[calc(100vh-20px)] sm:max-h-[calc(100vh-60px)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-40 p-2.5 text-zinc-300 hover:text-white rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/20 transition cursor-pointer shadow-lg active:scale-95"
          aria-label="Fechar"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-white/10 text-white border border-white/10 flex items-center justify-center">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Temporizador Sleep Timer</h2>
            <p className="text-xs text-zinc-400">Desligue o áudio automaticamente após o tempo escolhido</p>
          </div>
        </div>

        {timerMinutesRemaining !== null && (
          <div className="mb-5 p-4 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-white animate-spin" />
              <div>
                <p className="text-xs text-zinc-400">Tempo restante:</p>
                <p className="text-base font-bold text-white font-mono">
                  {Math.floor(timerMinutesRemaining / 60)}m {timerMinutesRemaining % 60}s
                </p>
              </div>
            </div>
            <button
              onClick={() => onSetTimer(null)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Selecione o Tempo Desejado:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {TIMER_OPTIONS.map((min) => (
              <button
                key={min}
                onClick={() => {
                  onSetTimer(min);
                  onClose();
                }}
                className="py-3 px-2 rounded-2xl bg-zinc-900 hover:bg-white hover:text-black border border-white/10 hover:border-white font-bold text-sm text-white transition flex flex-col items-center justify-center gap-0.5 shadow-sm"
              >
                <span>{min}</span>
                <span className="text-[10px] uppercase font-normal opacity-80">minutos</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
