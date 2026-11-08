import React from 'react';
import { Gift, ArrowRight, MessageCircle, Sparkles, Tag, X } from 'lucide-react';
import { PromoBanner, RadioStationConfig } from '../types';

interface PromoBannerCardProps {
  banner: PromoBanner;
  onOpenPromoModal: () => void;
  stationConfig: RadioStationConfig;
  onDismiss?: () => void;
}

export const PromoBannerCard: React.FC<PromoBannerCardProps> = ({
  banner,
  onOpenPromoModal,
  stationConfig,
  onDismiss,
}) => {
  const getWhatsAppActionUrl = () => {
    if (banner.actionUrl && banner.actionUrl.startsWith('http')) {
      return banner.actionUrl;
    }
    const cleanNumber = stationConfig.whatsappNumber.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá Rebeldia FM! Quero participar da Promoção da Hora: *${banner.title}*!`
    );
    return `https://wa.me/${cleanNumber}?text=${msg}`;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-900/90 shadow-2xl group transition hover:border-amber-500/60">
      {/* Background Image com Overlay Escuro */}
      <div className="absolute inset-0 z-0">
        <img
          src={banner.bannerUrl}
          alt={banner.title}
          className="w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      </div>

      {/* Conteúdo do Card Promocional */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black flex items-center gap-1 shadow-sm animate-pulse">
              <Gift className="w-3 h-3 text-black" />
              {banner.badge || 'PROMOÇÃO DA HORA'}
            </span>
            {banner.programTitle && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800/90 text-zinc-300 border border-zinc-700">
                📻 {banner.programTitle}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-white font-display tracking-tight group-hover:text-amber-300 transition">
            {banner.title}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {banner.description}
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={onOpenPromoModal}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ver Detalhes</span>
          </button>

          <a
            href={getWhatsAppActionUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Participar</span>
            <span className="sm:hidden">Participar</span>
          </a>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 transition hover:bg-zinc-800"
              title="Fechar banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
