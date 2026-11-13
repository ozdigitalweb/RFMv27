import React, { useState } from 'react';
import {
  Clock,
  Radio,
  Repeat,
  Sparkles,
  Check,
  Bell,
  MessageCircle,
  Instagram,
} from 'lucide-react';
import { ProgramItem, RadioStationConfig, PromoBanner } from '../types';
import {
  formatMainSchedule,
  formatRepriseSchedule,
} from '../utils/scheduleFormatter';

interface LiveProgramHeroCardProps {
  program: ProgramItem;
  onOpenHotsite: () => void;
  stationConfig: RadioStationConfig;
  promoBanner?: PromoBanner | null;
  onOpenPromoModal?: () => void;
}

export const LiveProgramHeroCard: React.FC<LiveProgramHeroCardProps> = ({
  program,
  onOpenHotsite,
  stationConfig,
}) => {
  const isRepriseSlot = program.badge === 'Reprise';

  const [hasReminder, setHasReminder] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_reminders');
      if (saved) {
        const list = JSON.parse(saved);
        return Array.isArray(list) && list.includes(program.id);
      }
      return false;
    } catch {
      return false;
    }
  });

  const handleToggleReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = localStorage.getItem('rebeldia_reminders');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];

      let next: string[];
      if (list.includes(program.id)) {
        next = list.filter((id) => id !== program.id);
        setHasReminder(false);
      } else {
        next = [...list, program.id];
        setHasReminder(true);
        if ('Notification' in window) {
          Notification.requestPermission();
        }
      }
      localStorage.setItem('rebeldia_reminders', JSON.stringify(next));
    } catch {
      setHasReminder(!hasReminder);
    }
  };

  const getWhatsAppProgramUrl = () => {
    const rawNumber =
      program.whatsappNumber || stationConfig.whatsappNumber || '5548991984678';
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${program.host}! Estou sintonizado no programa *${program.title}* na Rebeldia FM!`
    );
    return `https://wa.me/${cleanNumber}?text=${msg}`;
  };

  return (
    <div
      onClick={onOpenHotsite}
      className="group relative rounded-3xl overflow-hidden bg-zinc-950 border border-amber-500 shadow-amber-500/10 shadow-2xl transition-all duration-300 cursor-pointer hover:shadow-amber-500/20 hover:-translate-y-1 w-full"
    >
      {/* Box Top Banner Cover */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-zinc-900">
        {program.bannerUrl ? (
          <img
            src={program.bannerUrl}
            alt={program.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                program.avatarUrl || '/reb_mascot.jpg';
            }}
          />
        ) : program.avatarUrl ? (
          <img
            src={program.avatarUrl}
            alt={program.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/reb_mascot.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
            <Radio className="w-12 h-12 text-zinc-700" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          {/* Bloco de Horário com AO VIVO abaixo da hora */}
          <div className="flex flex-col items-start gap-1.5">
            {/* Tag Hora do Programa */}
            <span className="px-2.5 py-1 rounded-xl bg-zinc-950/90 backdrop-blur-md text-[11px] font-bold text-white border border-white/15 flex items-center gap-1.5 font-mono shadow-md">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {isRepriseSlot &&
              program.repriseStartTime &&
              program.repriseEndTime
                ? `${program.repriseStartTime} - ${program.repriseEndTime}`
                : `${program.startTime} - ${program.endTime}`}
            </span>

            {/* Tag AO VIVO posicionada abaixo da tag hora do programa */}
            <span className="px-2.5 py-1 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Ao Vivo
            </span>

            {/* Palavra Reprise embaixo do horário */}
            {isRepriseSlot && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md font-mono">
                <Repeat className="w-3 h-3 text-amber-400" />
                Reprise
              </span>
            )}

            {/* Indicador de Modo Coringa Ativo */}
            {program.isCoringaActive && (
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg font-mono">
                <Sparkles className="w-3 h-3 text-black" />
                Coringa Ao Vivo
              </span>
            )}
          </div>

          {/* Logo Oficial do Programa ampliado no canto superior direito */}
          {program.logoUrl && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/50 backdrop-blur-md p-[3px] shadow-2xl flex items-center justify-center overflow-hidden shrink-0 transition">
              <img
                src={program.logoUrl}
                alt={`Logo ${program.title}`}
                className="w-full h-full object-contain filter drop-shadow-md rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Genre Floating Badge */}
        {program.genre && (
          <div className="absolute bottom-3 left-4">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider font-mono">
              {program.genre}
            </span>
          </div>
        )}
      </div>

      {/* Box Content Body */}
      <div className="p-5 flex flex-col space-y-4">
        <div className="space-y-3">
          {/* Host Info Section inside Vertical Box */}
          <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-800/80">
            <div className="relative shrink-0">
              {program.avatarUrl ? (
                <img
                  src={program.avatarUrl}
                  alt={program.host}
                  className="w-12 h-12 rounded-2xl object-cover border border-amber-400/40 group-hover:border-amber-400 transition"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/reb_mascot.jpg';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold font-display">
                  {program.host.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                {program.hostRole || 'Produtor e Apresentador'}
              </span>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                {program.host}
              </h4>
              {program.isSubstituted && program.originalHost && program.id !== 'coringa-live-session' ? (
                <p className="text-[11px] text-amber-300/90 line-clamp-1">
                  {program.isCoringaActive ? 'Modo Coringa • ' : 'Substituindo '}
                  {program.originalHost}
                </p>
              ) : (
                program.hostBio && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1">
                    {program.hostBio}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Program Title & Synopsis */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white font-display group-hover:text-amber-300 transition leading-tight">
              {program.title}
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {program.description ||
                'Programação musical de alto nível com os maiores clássicos do rock e novidades.'}
            </p>
          </div>

          {/* Program Schedule Details with Reprise Box */}
          {program.hasReprise && (
            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Principal:
                </span>
                <span className="font-mono text-zinc-200 text-[11px] font-bold">
                  {formatMainSchedule(program)}
                </span>
              </div>
              <div className="flex items-center justify-between text-amber-400 pt-1 border-t border-zinc-800/80">
                <span className="flex items-center gap-1.5 text-[11px] font-bold">
                  <Repeat className="w-3 h-3 text-amber-400" />
                  Reprise:
                </span>
                <span className="font-mono text-amber-300 text-[11px] font-bold">
                  {formatRepriseSchedule(program)}
                </span>
              </div>
            </div>
          )}

          {/* Additional Host Highlights / Contacts if available */}
          {(program.whatsappNumber || program.instagramHandle) && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {program.whatsappNumber && (
                <a
                  href={getWhatsAppProgramUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                  title="Mandar mensagem no WhatsApp do programa"
                >
                  <MessageCircle className="w-3 h-3 text-amber-400" />
                  WhatsApp no Ar
                </a>
              )}
              {program.instagramHandle && (
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                  <Instagram className="w-3 h-3 text-amber-400" />
                  @{program.instagramHandle.replace('@', '')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Box Action Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHotsite();
            }}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Ver Hotsite do Programa</span>
          </button>

          <button
            type="button"
            onClick={handleToggleReminder}
            className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${
              hasReminder
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
            }`}
            title={hasReminder ? 'Lembrete ativado' : 'Ativar lembrete deste programa'}
          >
            {hasReminder ? (
              <Check className="w-4 h-4 text-black" />
            ) : (
              <Bell className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
