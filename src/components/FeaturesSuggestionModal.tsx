import React from 'react';
import { Sparkles, Radio, Smartphone, Music2, Calendar, Sliders, Clock, Bell, Share2, MessageSquare, CheckCircle, Zap, TrendingUp, Award, PlayCircle, Download, FileText } from 'lucide-react';
import { APP_FEATURES_PROPOSAL } from '../data/initialData';
import { downloadBrandManifestoFile } from '../utils/downloadManifesto';

interface FeaturesSuggestionModalProps {
  onNavigateTab: (tab: any) => void;
}

const ICON_MAP: Record<string, any> = {
  Radio,
  Smartphone,
  Music2,
  Calendar,
  Sliders,
  Clock,
  Bell,
  Share2,
  MessageSquare,
  Sparkles,
};

export const FeaturesSuggestionModal: React.FC<FeaturesSuggestionModalProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner com Imagem de Fundo de Estúdio de Rádio */}
      <div className="mono-card p-6 rounded-2xl relative overflow-hidden border border-white/10 shadow-2xl">
        {/* Imagem de Fundo de Estúdio de Rádio com Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none filter brightness-[0.38] saturate-[0.85] scale-105"
          style={{ backgroundImage: `url('/header-box-bg.jpg')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/65 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Painel de Recursos da Plataforma</span>
            </div>
            <h2 className="text-2xl font-black text-white font-display tracking-tight">
              Recursos & Módulos do Aplicativo
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Arquitetura de funcionalidades da rádio web para engajamento de ouvintes, reprodução em alta fidelidade e compatibilidade PWA Android.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadBrandManifestoFile}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
            title="Baixar Kit de Mídia Oficial da Rebeldia FM (PDF)"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Kit de Mídia (PDF)</span>
          </button>
        </div>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {APP_FEATURES_PROPOSAL.map((feat) => {
          const Icon = ICON_MAP[feat.icon] || Sparkles;
          const isIntegrated = feat.status === 'Integrado';

          return (
            <div
              key={feat.id}
              className="mono-card mono-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isIntegrated
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {feat.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base font-display">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>

              {isIntegrated && (
                <div className="pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>Módulo Ativo e Funcional</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
