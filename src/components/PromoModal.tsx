import React, { useState } from 'react';
import {
  Gift,
  X,
  Share2,
  ExternalLink,
  Clock,
  Radio,
  Calendar,
  CheckCircle2,
  Flame,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Tag
} from 'lucide-react';
import { PromoBanner, RadioStationConfig, ProgramItem } from '../types';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  banners: PromoBanner[];
  currentLiveProgram?: ProgramItem | null;
  stationConfig: RadioStationConfig;
  onSelectBanner?: (banner: PromoBanner) => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({
  isOpen,
  onClose,
  banners,
  currentLiveProgram,
  stationConfig,
}) => {
  const activeBanners = banners.filter((b) => b.isActive);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentBanner = activeBanners[selectedIndex] || activeBanners[0];

  const handleShare = () => {
    if (!currentBanner) return;
    const text = `Confira a Promoção da Hora na Rebeldia FM: ${currentBanner.title}! Participe pelo app.`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: currentBanner.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getWhatsAppActionUrl = (banner: PromoBanner) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-h-[calc(100vh-20px)] sm:max-h-[calc(100vh-60px)] flex flex-col">
        {/* Header com Gradiente */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <Gift className="w-6 h-6 text-amber-300 animate-bounce" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 text-amber-300 border border-amber-300/30">
                  {currentBanner?.badge || 'PROMOÇÃO DA HORA'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight mt-1">
                  Promoções & Sorteios
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/20 text-white transition cursor-pointer"
                title="Compartilhar promoção"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/20 text-white transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {copied && (
            <div className="mt-2 text-xs bg-black/60 px-3 py-1 rounded-lg text-amber-200 inline-block">
              Link da promoção copiado para a área de transferência!
            </div>
          )}
        </div>

        {/* Carousel / Seletor de Banners Ativos */}
        {activeBanners.length > 1 && (
          <div className="flex items-center gap-2 p-3 bg-zinc-900 border-b border-zinc-800 overflow-x-auto scrollbar-none">
            {activeBanners.map((banner, index) => (
              <button
                key={banner.id}
                onClick={() => setSelectedIndex(index)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  selectedIndex === index
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px] sm:max-w-xs">{banner.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo da Promoção */}
        {currentBanner ? (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Imagem do Banner - Vertical aumentada em ~50% no mobile (aspect-[4/5] / h-72 / max-h-80) e compacto no desktop */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[4/5] xs:aspect-[1/1] sm:aspect-[21/9] md:aspect-[2.5/1] max-h-80 sm:max-h-52 md:max-h-48 bg-zinc-900 group">
              <img
                src={currentBanner.bannerUrl}
                alt={currentBanner.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
              
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1.5 shadow-lg animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  NO AR
                </span>
                {currentBanner.programTitle && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-black/70 backdrop-blur-md text-zinc-200 border border-white/20">
                    📻 {currentBanner.programTitle}
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                {currentBanner.subtitle && (
                  <p className="text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider drop-shadow line-clamp-1">
                    {currentBanner.subtitle}
                  </p>
                )}
                <h3 className="text-base sm:text-lg md:text-xl font-black text-white drop-shadow-md leading-tight">
                  {currentBanner.title}
                </h3>
              </div>
            </div>

            {/* Informações e Detalhes - Compactos em grid no mobile */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col justify-center">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 mx-auto mb-0.5" />
                <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                  Duração
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white truncate">
                  {currentBanner.scheduleSync
                    ? 'No Ar'
                    : 'Limitada'}
                </span>
              </div>

              <div className="p-2 sm:p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col justify-center">
                <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 mx-auto mb-0.5" />
                <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                  Sorteio
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white truncate">Ao Vivo</span>
              </div>

              <div className="p-2 sm:p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col justify-center">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 mx-auto mb-0.5" />
                <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                  Inscrição
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white truncate">Gratuita</span>
              </div>
            </div>

            {/* Descrição e Regras */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
              <h4 className="text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Como Participar & Regulamento
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {currentBanner.description}
              </p>
            </div>

            {/* Botão de Ação / Participar no WhatsApp - Diagramação refinada e compacta */}
            <div className="pt-1">
              <a
                href={getWhatsAppActionUrl(currentBanner)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs sm:text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] group cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-black/20 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{currentBanner.actionText || 'Participar no WhatsApp'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
              </a>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 text-center mt-1.5">
                Você será direcionado diretamente ao WhatsApp do estúdio da Rebeldia FM.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Gift className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">Nenhuma Promoção Ativa no Momento</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Fique ligado na programação da Rebeldia FM! Em breve novos sorteios e brindes exclusivos para os ouvintes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
