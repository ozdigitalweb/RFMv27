import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  Share2,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
  ExternalLink,
  Code,
  Tag,
  Info,
} from 'lucide-react';
import { api, PageSeoData } from '../utils/api';
import { applyClientSeo } from '../utils/seo';

const STANDARD_PAGES = [
  { path: '/', label: 'Página Inicial (Rádio Ao Vivo)' },
  { path: '/programas', label: 'Programação (Grade Oficial)' },
  { path: '/mural', label: 'Mural de Recados da Comunidade' },
  { path: '/pedidos', label: 'Pedir Música & Top Votação' },
  { path: '/rebeldia', label: 'Manifesto & Sobre a Rádio' },
];

export const AdminSeoSection: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('/');
  const [pagesList, setPagesList] = useState<PageSeoData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<PageSeoData>({
    path: '/',
    title: '',
    description: '',
    keywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    geoRegion: 'BR-RS',
    geoPlacename: 'Canoas, Rio Grande do Sul, Brasil',
    geoPosition: '-29.9189;-51.1794',
    icbm: '-29.9189, -51.1794',
    schemaType: 'RadioStation',
    jsonLdCustom: null,
  });

  // Preview Mode
  const [snippetDevice, setSnippetDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [socialTab, setSocialTab] = useState<'google' | 'social' | 'geo' | 'schema'>('google');

  // Load pages SEO from server
  const loadSeoData = async (targetPath = selectedPath) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const list = await api.getPageSeoList();
      setPagesList(list);

      const found = list.find((p) => p.path === targetPath) || (await api.getPageSeo(targetPath));
      if (found) {
        setFormState(found);
      } else {
        setFormState((prev) => ({
          ...prev,
          path: targetPath,
          title: 'Rebeldia FM - Rádio Web Livre',
          description: 'Ouça a rádio livre e independente 24 horas no ar.',
          canonicalUrl: `https://rebeldiafm.com.br${targetPath}`,
        }));
      }
    } catch {
      setErrorMessage('Falha ao carregar metadados de SEO do servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSeoData(selectedPath);
  }, [selectedPath]);

  // Handle Form Change
  const handleChange = (field: keyof PageSeoData, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  // Yoast-Style SEO Analysis
  const seoAnalysis = useMemo(() => {
    const titleLen = formState.title.trim().length;
    const descLen = formState.description.trim().length;
    const hasKeywords = Boolean(formState.keywords?.trim());
    const hasOgImage = Boolean(formState.ogImage?.trim());
    const hasGeo = Boolean(formState.geoRegion && formState.geoPosition);

    // Title score (30 - 60 optimal)
    const titleStatus: 'good' | 'ok' | 'bad' =
      titleLen === 0 || titleLen < 25 ? 'bad' : titleLen > 65 ? 'ok' : 'good';

    // Description score (120 - 160 optimal)
    const descStatus: 'good' | 'ok' | 'bad' =
      descLen === 0 || descLen < 70 ? 'bad' : descLen > 165 ? 'ok' : 'good';

    // Overall Score
    let overall: 'good' | 'ok' | 'bad' = 'good';
    if (titleStatus === 'bad' || descStatus === 'bad') {
      overall = 'bad';
    } else if (titleStatus === 'ok' || descStatus === 'ok' || !hasKeywords) {
      overall = 'ok';
    }

    return {
      titleLen,
      titleStatus,
      descLen,
      descStatus,
      hasKeywords,
      hasOgImage,
      hasGeo,
      overall,
    };
  }, [formState]);

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await api.savePageSeo(formState);
      if (res.success && res.data) {
        setSaveSuccess(true);
        applyClientSeo(res.data);
        await loadSeoData(formState.path);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(res.error || 'Erro ao salvar configurações de SEO.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPresetGeo = (city: 'canoas' | 'portoalegre' | 'brasil') => {
    if (city === 'canoas') {
      handleChange('geoRegion', 'BR-RS');
      handleChange('geoPlacename', 'Canoas, Rio Grande do Sul, Brasil');
      handleChange('geoPosition', '-29.9189;-51.1794');
      handleChange('icbm', '-29.9189, -51.1794');
    } else if (city === 'portoalegre') {
      handleChange('geoRegion', 'BR-RS');
      handleChange('geoPlacename', 'Porto Alegre, Rio Grande do Sul, Brasil');
      handleChange('geoPosition', '-30.0346;-51.2177');
      handleChange('icbm', '-30.0346, -51.2177');
    } else {
      handleChange('geoRegion', 'BR');
      handleChange('geoPlacename', 'Brasil');
      handleChange('geoPosition', '-14.2350;-51.9253');
      handleChange('icbm', '-14.2350, -51.9253');
    }
  };

  return (
    <div className="space-y-6 text-zinc-200">
      {/* Header & Page Selector */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Gerenciador de SEO & GEO (Padrão Yoast)
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    Item 4.1 & 5.2
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Configure títulos, snippets do Google, OpenGraph (WhatsApp/Redes) e indexação geográfica por página.
                </p>
              </div>
            </div>
          </div>

          {/* Yoast SEO Health Badge */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-zinc-950/80 px-3.5 py-2 rounded-xl border border-zinc-800">
            <span className="text-xs font-bold text-zinc-400">Pontuação Yoast:</span>
            {seoAnalysis.overall === 'good' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Excelente (Verde)
              </span>
            )}
            {seoAnalysis.overall === 'ok' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Aceitável (Amarelo)
              </span>
            )}
            {seoAnalysis.overall === 'bad' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/50 px-2 py-1 rounded-lg border border-rose-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Ajustar (Vermelho)
              </span>
            )}
          </div>
        </div>

        {/* Page Selector Tabs */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Selecionar Página para Otimizar:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_PAGES.map((pg) => {
                const isSelected = selectedPath === pg.path;
                return (
                  <button
                    key={pg.path}
                    onClick={() => setSelectedPath(pg.path)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                        : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60'
                    }`}
                  >
                    <span>{pg.label}</span>
                    <span className="text-[10px] opacity-70">({pg.path})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => loadSeoData(selectedPath)}
              disabled={isLoading}
              title="Recarregar dados do banco"
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for SEO Sections */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setSocialTab('google')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            socialTab === 'google'
              ? 'bg-amber-500 text-black font-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Snippets do Google (Search)</span>
        </button>

        <button
          onClick={() => setSocialTab('social')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            socialTab === 'social'
              ? 'bg-amber-500 text-black font-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Redes Sociais & WhatsApp (OpenGraph)</span>
        </button>

        <button
          onClick={() => setSocialTab('geo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            socialTab === 'geo'
              ? 'bg-amber-500 text-black font-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Indexação Geográfica (GEO Tags)</span>
        </button>

        <button
          onClick={() => setSocialTab('schema')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            socialTab === 'schema'
              ? 'bg-amber-500 text-black font-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Schema.org (JSON-LD)</span>
        </button>
      </div>

      {/* TAB 1: GOOGLE SEARCH SNIPPET */}
      {socialTab === 'google' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Fields (Left) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Title */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  Título da Página (&lt;title&gt;)
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-mono font-bold ${
                      seoAnalysis.titleStatus === 'good'
                        ? 'text-emerald-400'
                        : seoAnalysis.titleStatus === 'ok'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {seoAnalysis.titleLen} / 60 caracteres
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={formState.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Rebeldia FM - Rádio Web Livre | Rock e Cultura"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
              <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    seoAnalysis.titleStatus === 'good'
                      ? 'bg-emerald-500'
                      : seoAnalysis.titleStatus === 'ok'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (seoAnalysis.titleLen / 60) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Tamanho ideal: entre 30 e 60 caracteres para não ser truncado no Google.
              </p>
            </div>

            {/* Description */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Meta Description
                </label>
                <span
                  className={`text-xs font-mono font-bold ${
                    seoAnalysis.descStatus === 'good'
                      ? 'text-emerald-400'
                      : seoAnalysis.descStatus === 'ok'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {seoAnalysis.descLen} / 160 caracteres
                </span>
              </div>
              <textarea
                rows={3}
                value={formState.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Resumo envolvente sobre o conteúdo desta página para atrair ouvintes no Google..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition resize-none"
              />
              <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    seoAnalysis.descStatus === 'good'
                      ? 'bg-emerald-500'
                      : seoAnalysis.descStatus === 'ok'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (seoAnalysis.descLen / 160) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Tamanho ideal: entre 120 e 160 caracteres com chamada para ação clara.
              </p>
            </div>

            {/* Keywords & Canonical */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Palavras-chave (Keywords)
                </label>
                <input
                  type="text"
                  value={formState.keywords || ''}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  placeholder="radio livre, rebeldia, canoas, rock"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">Separadas por vírgula</span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  URL Canônica
                </label>
                <input
                  type="text"
                  value={formState.canonicalUrl || ''}
                  onChange={(e) => handleChange('canonicalUrl', e.target.value)}
                  placeholder="https://rebeldiafm.com.br/..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">Evita conteúdo duplicado</span>
              </div>
            </div>
          </div>

          {/* Real-time Google Snippet Simulator (Right) */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-amber-400" />
                  Simulador de Busca Google
                </span>
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setSnippetDevice('mobile')}
                    className={`p-1.5 rounded-md text-xs font-bold transition ${
                      snippetDevice === 'mobile' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Visualização Mobile"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSnippetDevice('desktop')}
                    className={`p-1.5 rounded-md text-xs font-bold transition ${
                      snippetDevice === 'desktop' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Visualização Desktop"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Google Card Box */}
              <div className="bg-[#202124] text-white p-4 rounded-xl border border-zinc-700/60 shadow-inner font-sans">
                {/* Header (Favicon + URL) */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src="/reb_mascot.jpg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs leading-tight overflow-hidden">
                    <span className="text-[#dadce0] font-medium block truncate">Rebeldia FM</span>
                    <span className="text-[#bdc1c6] text-[11px] block truncate">
                      {formState.canonicalUrl || `https://rebeldiafm.com.br${formState.path}`}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-[#8ab4f8] hover:underline font-normal text-base sm:text-lg leading-snug cursor-pointer mb-1.5 break-words">
                  {formState.title || 'Rebeldia FM - Rádio Web Livre'}
                </h4>

                {/* Description */}
                <p className="text-[#bdc1c6] text-xs sm:text-sm leading-relaxed break-words">
                  {formState.description || 'Ouça a rádio livre e independente 24 horas no ar com programação autoral.'}
                </p>
              </div>

              {/* Tips */}
              <div className="mt-4 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  {seoAnalysis.titleStatus === 'good' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                  <span>
                    Título: <b>{seoAnalysis.titleLen} caracteres</b> (recomendado 30–60).
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {seoAnalysis.descStatus === 'good' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                  <span>
                    Descrição: <b>{seoAnalysis.descLen} caracteres</b> (recomendado 120–160).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPENGRAPH & SOCIAL MEDIA (WHATSAPP, FACEBOOK, TWITTER) */}
      {socialTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {/* OG Title & Description */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Título para Redes Sociais (og:title / twitter:title)
                </label>
                <input
                  type="text"
                  value={formState.ogTitle || formState.title}
                  onChange={(e) => handleChange('ogTitle', e.target.value)}
                  placeholder="Deixe em branco para usar o mesmo título da página"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Descrição para Redes Sociais (og:description)
                </label>
                <textarea
                  rows={2}
                  value={formState.ogDescription || formState.description}
                  onChange={(e) => handleChange('ogDescription', e.target.value)}
                  placeholder="Deixe em branco para usar a mesma meta description"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>
            </div>

            {/* OG Image & Card Type */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Imagem de Compartilhamento (og:image / 1200x630px ideal)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formState.ogImage || ''}
                    onChange={(e) => handleChange('ogImage', e.target.value)}
                    placeholder="/reb_mascot.jpg ou https://..."
                    className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    onClick={() => handleChange('ogImage', '/reb_mascot.jpg')}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
                  >
                    Usar Mascote
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Tipo de Card (Twitter / X)
                  </label>
                  <select
                    value={formState.twitterCard || 'summary_large_image'}
                    onChange={(e) => handleChange('twitterCard', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="summary_large_image">Imagem Grande (summary_large_image)</option>
                    <option value="summary">Card Pequeno (summary)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Tipo OpenGraph (og:type)
                  </label>
                  <select
                    value={formState.ogType || 'website'}
                    onChange={(e) => handleChange('ogType', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="website">Website Comum</option>
                    <option value="music.radio_station">Estação de Rádio (music.radio_station)</option>
                    <option value="article">Artigo / Notícia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Social Share Card Preview (Right) */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sticky top-24">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                Prévia do Compartilhamento (WhatsApp / Facebook / X)
              </span>

              {/* Social Card */}
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="w-full h-44 bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={formState.ogImage || '/reb_mascot.jpg'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/reb_mascot.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-2 left-3 text-[10px] bg-black/80 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-white/10">
                    rebeldiafm.com.br
                  </span>
                </div>

                <div className="p-4 space-y-1.5 bg-zinc-900/90 border-t border-zinc-800">
                  <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                    REBELDIA FM • RÁDIO LIVRE
                  </p>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {formState.ogTitle || formState.title || 'Rebeldia FM - Rádio Web'}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {formState.ogDescription || formState.description || 'Ouça a rádio livre e independente 24h no ar.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GEO TAGS & GEOTARGETING */}
      {socialTab === 'geo' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                Indexação Geográfica & Localização da Estação (GEO Tags)
              </h4>
              <p className="text-xs text-zinc-400">
                Permite que buscadores (Google Local, Bing, Apple Maps) associem esta página à cidade de transmissão.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500 font-bold mr-1">Presets:</span>
              <button
                onClick={() => handleApplyPresetGeo('canoas')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition"
              >
                Canoas / RS
              </button>
              <button
                onClick={() => handleApplyPresetGeo('portoalegre')}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Porto Alegre / RS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                Região Geográfica (geo.region)
              </label>
              <input
                type="text"
                value={formState.geoRegion || 'BR-RS'}
                onChange={(e) => handleChange('geoRegion', e.target.value)}
                placeholder="Ex: BR-RS"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">Código ISO 3166-2 do estado (ex: BR-RS)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                Nome do Local (geo.placename)
              </label>
              <input
                type="text"
                value={formState.geoPlacename || 'Canoas, Rio Grande do Sul, Brasil'}
                onChange={(e) => handleChange('geoPlacename', e.target.value)}
                placeholder="Ex: Canoas, Rio Grande do Sul, Brasil"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">Cidade e país de origem da transmissão</span>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                Coordenadas (geo.position - Latitude;Longitude)
              </label>
              <input
                type="text"
                value={formState.geoPosition || '-29.9189;-51.1794'}
                onChange={(e) => handleChange('geoPosition', e.target.value)}
                placeholder="-29.9189;-51.1794"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">Formato: latitude;longitude com ponto e vírgula</span>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                Padrão ICBM (Latitude, Longitude)
              </label>
              <input
                type="text"
                value={formState.icbm || '-29.9189, -51.1794'}
                onChange={(e) => handleChange('icbm', e.target.value)}
                placeholder="-29.9189, -51.1794"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">Formato: latitude, longitude separado por vírgula</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEMA.ORG JSON-LD */}
      {socialTab === 'schema' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-400" />
                Dados Estruturados Schema.org (JSON-LD)
              </h4>
              <p className="text-xs text-zinc-400">
                Gera rich snippets no Google, painel de conhecimento e suporte a assistentes de voz.
              </p>
            </div>
            <div>
              <select
                value={formState.schemaType || 'RadioStation'}
                onChange={(e) => handleChange('schemaType', e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="RadioStation">RadioStation (Estação de Rádio)</option>
                <option value="BroadcastService">BroadcastService (Transmissão de Áudio)</option>
                <option value="WebPage">WebPage (Página Web Genérica)</option>
                <option value="AboutPage">AboutPage (Página Sobre/Institucional)</option>
                <option value="MusicEvent">MusicEvent (Evento Musical/Show)</option>
              </select>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
            <pre>
              {JSON.stringify(
                {
                  '@context': 'https://schema.org',
                  '@type': formState.schemaType || 'RadioStation',
                  name: formState.title || 'Rebeldia FM - Rádio Web',
                  description: formState.description || 'Rádio Web Livre 24 horas no ar.',
                  url: formState.canonicalUrl || `https://rebeldiafm.com.br${formState.path}`,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Canoas',
                    addressRegion: 'RS',
                    addressCountry: 'BR',
                  },
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: formState.geoPosition?.split(';')[0] || '-29.9189',
                    longitude: formState.geoPosition?.split(';')[1] || '-51.1794',
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Save Action Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="text-xs">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              Metadados de SEO & GEO salvos com sucesso no banco de dados!
            </span>
          )}
          {errorMessage && (
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <XCircle className="w-4 h-4" />
              {errorMessage}
            </span>
          )}
          {!saveSuccess && !errorMessage && (
            <span className="text-zinc-400">
              Salvamento persistente em PostgreSQL e cache em memória (Regras 4.1 e 4.2).
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Salvando...' : 'Salvar Alterações de SEO'}</span>
        </button>
      </div>
    </div>
  );
};
