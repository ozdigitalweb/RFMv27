import React, { useState, useEffect } from 'react';
import { Bell, Clock, Check, X, Volume2, AlertCircle } from 'lucide-react';
import { RadioAlarm } from '../types';

interface AlarmClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarm: RadioAlarm;
  onSaveAlarm: (alarm: RadioAlarm) => void;
  onTriggerPlay: () => void;
}

export const AlarmClockModal: React.FC<AlarmClockModalProps> = ({
  isOpen,
  onClose,
  alarm,
  onSaveAlarm,
  onTriggerPlay,
}) => {
  const [enabled, setEnabled] = useState(alarm.enabled);
  const [time, setTime] = useState(alarm.time);
  const [label, setLabel] = useState(alarm.label);
  const [saved, setSaved] = useState(false);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAlarm({
      enabled,
      time,
      days: [0, 1, 2, 3, 4, 5, 6],
      label: label.trim() || 'Despertar com a Rádio',
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

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
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Despertador Musical</h2>
            <p className="text-xs text-zinc-400">Acorde ou programe o início do áudio ao vivo</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white">Ativar Despertador</span>
              <p className="text-xs text-zinc-400">Liga a rádio no horário configurado</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-black peer-checked:after:border-black"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Horário do Alarme (24h)
            </label>
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl mono-input text-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Etiqueta / Nome do Alarme
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Hora de Acordar"
              className="w-full px-3.5 py-2.5 rounded-xl mono-input text-xs"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <span>
              Para o despertador tocar, mantenha esta aba da rádio aberta no seu navegador ou celular.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition border border-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Salvo!</span>
                </>
              ) : (
                <span>Salvar Alarme</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
