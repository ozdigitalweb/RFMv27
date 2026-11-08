import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link2, Trash2, Check, RefreshCw, Image as ImageIcon, Sparkles } from 'lucide-react';
import { getCustomLogo, saveCustomLogo } from '../utils/logo';
import { RebeldiaLogo } from './RebeldiaLogo';

interface LogoUploaderProps {
  onLogoChange?: (newLogo: string | null) => void;
  className?: string;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ onLogoChange, className = '' }) => {
  const [currentLogo, setCurrentLogo] = useState<string | null>(getCustomLogo);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      setCurrentLogo(customEvent.detail ?? getCustomLogo());
    };

    window.addEventListener('rebeldia_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('rebeldia_logo_updated', handleLogoUpdate);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('Por favor selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showFeedback('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        saveCustomLogo(dataUrl);
        setCurrentLogo(dataUrl);
        onLogoChange?.(dataUrl);
        showFeedback('Novo logotipo carregado com sucesso!');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      showFeedback('Erro ao ler arquivo de imagem.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    saveCustomLogo(urlInput.trim());
    setCurrentLogo(urlInput.trim());
    onLogoChange?.(urlInput.trim());
    setUrlInput('');
    showFeedback('Logotipo atualizado via link com sucesso!');
  };

  const handleResetToDefault = () => {
    saveCustomLogo(null);
    setCurrentLogo(null);
    onLogoChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showFeedback('Logotipo restaurado para o padrão original da Rebeldia FM.');
  };

  return (
    <div className={`p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Logotipo da Emissora
            </h3>
            <p className="text-[11px] text-zinc-400">
              Personalize o logo exibido em todo o aplicativo (cabeçalho, player, modais e institucional).
            </p>
          </div>
        </div>

        {currentLogo && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
            Logo Customizado Ativo
          </span>
        )}
      </div>

      {/* Preview Comparison & Live Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
        <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80 min-h-[90px]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-2">
            Visualização Atual no Site
          </span>
          <RebeldiaLogo size="md" showSlogan />
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80 min-h-[90px]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-2">
            Visualização Compacta (Ícone/Player)
          </span>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center p-1.5 shadow-md">
              <RebeldiaLogo variant="icon" size="xs" />
            </div>
            <span className="text-xs text-zinc-400 font-mono">Mini Player Bar</span>
          </div>
        </div>
      </div>

      {/* Upload Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Manual File Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
            id="logo-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-full min-h-[46px] px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-300" />
            ) : (
              <Upload className="w-4 h-4 text-zinc-300" />
            )}
            <span>{isUploading ? 'Carregando Imagem...' : 'Upload Manual do Logotipo'}</span>
          </button>
          <span className="block text-[10px] text-zinc-500 mt-1 text-center">
            Formatos: PNG transparente, SVG, JPG, WebP (máx. 5MB)
          </span>
        </div>

        {/* Restore default button */}
        <div>
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={!currentLogo}
            className="w-full h-full min-h-[46px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 text-zinc-400" />
            <span>Restaurar Logo Padrão Original</span>
          </button>
          <span className="block text-[10px] text-zinc-500 mt-1 text-center">
            Retorna para a tipografia vetorial padrão Rebeldia FM
          </span>
        </div>
      </div>

      {/* Direct URL Form */}
      <form onSubmit={handleApplyUrl} className="pt-2 border-t border-zinc-800">
        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Ou insira a URL direta da imagem do logotipo:</span>
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://exemplo.com/meu-logotipo.png"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 cursor-pointer disabled:opacity-40"
          >
            Aplicar URL
          </button>
        </div>
      </form>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}
    </div>
  );
};
