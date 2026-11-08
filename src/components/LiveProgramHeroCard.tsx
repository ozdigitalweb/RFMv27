import React from 'react';
import { Radio, MessageCircle } from 'lucide-react';
import { ProgramItem, RadioStationConfig, PromoBanner } from '../types';
import { formatMainSchedule } from '../utils/scheduleFormatter';

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
  const isReprise = program.badge === 'Reprise';
  const backgroundImageUrl = program.bannerUrl || program.avatarUrl || '/reb_mascot.jpg';

  const getWhatsAppProgramUrl = () => {
    const rawNumber = program.whatsappNumber || stationConfig.whatsappNumber || '5548991984678';
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${program.host}! Estou sintonizado no programa *${program.title}* na Rebeldia FM!`
    );
    return `https://wa.me/${cleanNumber}?text=${msg}`;
  };

  const scheduleLabel = formatMainSchedule(program);

  return (
    <div
      onClick={onOpenHotsite}
      className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-900/90 shadow-2xl group transition hover:border-amber-500/60 cursor-pointer"
    >
      {/* Background Image com Overlay Escuro - Réplica exata do card de promoção */}
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImageUrl}
          alt={program.title}
          className="w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition duration-700"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/reb_mascot.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      </div>

      {/* Conteúdo do Card - Réplica idêntica de dimensões, tipografia e badges */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black flex items-center gap-1 shadow-sm animate-pulse">
              <Radio className="w-3 h-3 text-black" />
              {isReprise ? 'REPRISE NO AR' : 'PROGRAMA NO AR'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800/90 text-zinc-300 border border-zinc-700">
              🎙️ {program.host}
            </span>
            {scheduleLabel && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800/90 text-zinc-400 border border-zinc-700/80 font-mono">
                🕒 {scheduleLabel}
              </span>
            )}
            {program.genre && (
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800/90 text-amber-300/90 border border-amber-500/20 font-mono">
                {program.genre}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-white font-display tracking-tight group-hover:text-amber-300 transition">
            {program.title}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {program.description || `Acompanhe ao vivo com ${program.host} na programação da Rebeldia FM.`}
          </p>
        </div>

        {/* Botões de Ação - Réplica exata dos botões do card existente */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHotsite();
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ver Detalhes</span>
          </button>

          <a
            href={getWhatsAppProgramUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Participar</span>
            <span className="sm:hidden">Participar</span>
          </a>
        </div>
      </div>
    </div>
  );
};
