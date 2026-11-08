import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Share2,
  X,
  ShieldCheck,
  Copy,
  Check,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { RebeldiaLogo } from './RebeldiaLogo';
import { AndroidIcon } from './AndroidIcon';
import { AppleIcon } from './AppleIcon';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallClick: () => void;
  isInstalled: boolean;
  initialPlatform?: 'android' | 'ios';
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallClick,
  isInstalled,
  initialPlatform = 'android',
}) => {
  const [platform, setPlatform] = useState<'android' | 'ios'>(initialPlatform);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sincroniza a plataforma inicial quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setPlatform(initialPlatform);
    }
  }, [isOpen, initialPlatform]);

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

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-white/15 rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative overflow-hidden text-zinc-200 max-h-[calc(100vh-20px)] sm:max-h-[calc(100vh-60px)] overflow-y-auto"
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

        {/* Cabeçalho do Modal */}
        <div className="flex items-center gap-3.5 mb-5 relative z-10">
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center relative shrink-0">
            <RebeldiaLogo variant="icon" size="sm" className="w-9 h-9" />
            <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-zinc-950 border border-white/20 shadow">
              {platform === 'ios' ? (
                <AppleIcon className="w-4 h-4 text-white" />
              ) : (
                <AndroidIcon className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
              {platform === 'ios' ? 'Instalar no iPhone / Apple' : 'Instalar no Android'}
              {platform === 'ios' ? (
                <AppleIcon className="w-5 h-5 text-white shrink-0" />
              ) : (
                <AndroidIcon className="w-5 h-5 shrink-0" />
              )}
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              {platform === 'ios'
                ? 'Criar Atalho no iPhone (PWA) • Tela Cheia'
                : 'Aplicativo Leve (PWA) • Ícone na tela inicial'}
            </p>
          </div>
        </div>

        {/* Seletor de Plataforma: Android vs Apple (iPhone) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/90 rounded-xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setPlatform('android')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              platform === 'android'
                ? 'bg-emerald-500 text-black shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <AndroidIcon className="w-4 h-4" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform('ios')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              platform === 'ios'
                ? 'bg-white text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <AppleIcon className="w-4 h-4" />
            <span>Apple (iPhone)</span>
          </button>
        </div>

        {isInstalled && (
          <div className="p-4 bg-zinc-900 border border-white/20 rounded-2xl mb-5 flex items-center gap-3 text-zinc-200 text-sm shadow-md">
            <CheckCircle className="w-6 h-6 shrink-0 text-white" />
            <span>O aplicativo já está instalado no seu dispositivo! Você pode abrir direto pela sua tela inicial.</span>
          </div>
        )}

        {/* Conteúdo específico para Android */}
        {platform === 'android' && (
          <>
            {!isInstalled && deferredPrompt && (
              <div className="mb-6 relative z-10">
                <button
                  onClick={onInstallClick}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition transform active:scale-98 text-sm cursor-pointer"
                >
                  <AndroidIcon className="w-5 h-5" />
                  <span>Instalar Agora no Android (1 Clique)</span>
                </button>
                <p className="text-xs text-center text-zinc-400 mt-2">Instalação direta e segura aprovada pelo Google Chrome.</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Instalação Passo a Passo no Android:
              </h3>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <strong className="text-white">Abra no Google Chrome ou Edge</strong>
                    <p className="text-zinc-400">Acesse o endereço da rádio pelo navegador no seu smartphone.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <strong className="text-white">Toque nos 3 Pontos (Menu)</strong>
                    <p className="text-zinc-400">No canto superior direito do seu navegador.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <strong className="text-white">Toque em "Instalar Aplicativo" ou "Adicionar à tela inicial"</strong>
                    <p className="text-zinc-400">O ícone oficial da Rebeldia FM será colocado na sua tela inicial.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Conteúdo específico para Apple / iPhone */}
        {platform === 'ios' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-start gap-3 text-xs text-zinc-300">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Atalho Oficial na Tela do iPhone:</strong>
                <p className="text-zinc-400 mt-0.5">
                  No iPhone, você instala o app em menos de 10 segundos através do Safari. Ele abre em tela cheia, sem barra de navegação e com reprodução em segundo plano.
                </p>
              </div>
            </div>

            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Passo a Passo no iPhone (Safari):
            </h3>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  1
                </div>
                <div className="text-xs flex-1">
                  <strong className="text-white">Abra a Rádio no Safari</strong>
                  <p className="text-zinc-400">
                    O recurso de adicionar à tela inicial da Apple funciona através do navegador <strong>Safari</strong> no iPhone.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  2
                </div>
                <div className="text-xs flex-1">
                  <strong className="text-white">Toque no Botão Compartilhar</strong>
                  <p className="text-zinc-400">
                    Na barra inferior do Safari, toque no ícone de compartilhamento (um quadrado com uma seta apontando para cima).
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white font-semibold text-[11px]">
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Compartilhar</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  3
                </div>
                <div className="text-xs flex-1">
                  <strong className="text-white">Toque em "Adicionar à Tela de Início"</strong>
                  <p className="text-zinc-400">
                    Role a lista de opções para baixo e selecione a opção com o sinal de mais (+).
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white font-semibold text-[11px]">
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Adicionar à Tela de Início</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  4
                </div>
                <div className="text-xs flex-1">
                  <strong className="text-white">Toque em "Adicionar" no topo</strong>
                  <p className="text-zinc-400">
                    No canto superior direito da tela, confirme tocando em <strong>Adicionar</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Atalho para Copiar Link caso esteja em outro navegador */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 flex items-center justify-between gap-2">
              <div className="text-xs text-zinc-400">
                <span>Abriu em outro app? Copie o link e cole no Safari:</span>
              </div>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Benefícios universais */}
        <div className="mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-2.5 text-xs text-zinc-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Não ocupa memória do aparelho, não requer permissões invasivas e atualiza instantaneamente.</span>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
