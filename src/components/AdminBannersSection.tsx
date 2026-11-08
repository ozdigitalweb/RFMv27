import React, { useState, useRef } from 'react';
import {
  Gift,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  Flame,
  Tag,
  ToggleLeft,
  ToggleRight,
  Eye,
  Calendar,
  Image as ImageIcon,
  MessageCircle,
  Check,
  X,
  AlertCircle,
  Upload,
  Loader2
} from 'lucide-react';
import { PromoBanner, ProgramItem } from '../types';
import { DbScheduleItem } from '../utils/api';

export const STOCK_PROMO_BANNERS = [
  { label: 'Sorteio Kit Camiseta + Boné', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Ingressos Show & Festival VIP', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Fones Bluetooth & Brindes', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Parcerias & Comércio Local', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Estúdio Neon & Promoção Ao Vivo', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Violão & Clássicos Acústicos', url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&auto=format&fit=crop&q=80' },
];

interface AdminBannersSectionProps {
  banners: PromoBanner[];
  scheduleList: DbScheduleItem[];
  onSaveBanners: (updatedBanners: PromoBanner[]) => void;
  showToast: (msg: string) => void;
  onPreviewBanner?: (banner: PromoBanner) => void;
}

export const AdminBannersSection: React.FC<AdminBannersSectionProps> = ({
  banners,
  scheduleList,
  onSaveBanners,
  showToast,
  onPreviewBanner,
}) => {
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formBadge, setFormBadge] = useState('PROMOÇÃO DA HORA');
  const [formProgramId, setFormProgramId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formScheduleSync, setFormScheduleSync] = useState(false);
  const [formActionText, setFormActionText] = useState('Participar no WhatsApp');
  const [formActionUrl, setFormActionUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Upload & Drag-and-drop state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processamento e compressão de imagem para banner (Canvas)
  const processImageFile = (file: File, maxDimension = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadBannerFile = async (file: File) => {
    setIsUploading(true);
    try {
      const dataUrl = await processImageFile(file, 1200, 0.85);
      setFormBannerUrl(dataUrl);
      showToast('Imagem do banner carregada e otimizada com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadBannerFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadBannerFile(file);
    }
  };

  // Helper para verificar status em tempo real
  const getBannerLiveStatus = (b: PromoBanner) => {
    if (!b.isActive) return 'inactive';
    const now = new Date();
    const nowIso = now.toISOString();

    if (b.startDate && b.endDate) {
      if (nowIso < b.startDate) return 'scheduled';
      if (nowIso > b.endDate) return 'inactive';
    }
    return 'live';
  };

  const handleOpenCreate = () => {
    const now = new Date();
    const startStr = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endStr = end.toISOString().slice(0, 16);

    setEditingBanner(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormBannerUrl(STOCK_PROMO_BANNERS[0].url);
    setFormBadge('PROMOÇÃO DA HORA');
    setFormProgramId('');
    setFormStartDate(startStr);
    setFormEndDate(endStr);
    setFormScheduleSync(true);
    setFormActionText('Participar no WhatsApp');
    setFormActionUrl('');
    setFormIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setFormTitle(banner.title);
    setFormSubtitle(banner.subtitle || '');
    setFormDescription(banner.description);
    setFormBannerUrl(banner.bannerUrl);
    setFormBadge(banner.badge || 'PROMOÇÃO DA HORA');
    setFormProgramId(banner.programId ? String(banner.programId) : '');
    setFormStartDate(banner.startDate || '');
    setFormEndDate(banner.endDate || '');
    setFormScheduleSync(banner.scheduleSync ?? true);
    setFormActionText(banner.actionText || 'Participar no WhatsApp');
    setFormActionUrl(banner.actionUrl || '');
    setFormIsActive(banner.isActive);
    setIsFormOpen(true);
  };

  const handleToggleBanner = (id: string, currentStatus: boolean) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, isActive: !currentStatus } : b));
    onSaveBanners(updated);
    showToast(!currentStatus ? 'Banner promocional ATIVADO!' : 'Banner promocional DESATIVADO!');
  };

  const handleDeleteBanner = (id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    onSaveBanners(updated);
    showToast('Banner promocional excluído.');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBannerUrl.trim()) {
      showToast('Preencha o título e a imagem do banner!');
      return;
    }

    const selectedProg = scheduleList.find((p) => String(p.id) === formProgramId);

    const bannerData: PromoBanner = {
      id: editingBanner ? editingBanner.id : `promo-${Date.now()}`,
      programId: formProgramId || undefined,
      programTitle: selectedProg ? selectedProg.title : undefined,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim() || undefined,
      description: formDescription.trim(),
      bannerUrl: formBannerUrl.trim(),
      badge: formBadge.trim() || 'PROMOÇÃO DA HORA',
      actionText: formActionText.trim() || 'Participar no WhatsApp',
      actionUrl: formActionUrl.trim() || undefined,
      startDate: formStartDate,
      endDate: formEndDate,
      scheduleSync: formScheduleSync,
      programTimeWindow: selectedProg
        ? {
            startTime: selectedProg.startTime,
            endTime: selectedProg.endTime,
            daysLabel: selectedProg.daysLabel || undefined,
          }
        : undefined,
      isActive: formIsActive,
      createdAt: editingBanner ? editingBanner.createdAt : Date.now(),
    };

    let updated: PromoBanner[];
    if (editingBanner) {
      updated = banners.map((b) => (b.id === editingBanner.id ? bannerData : b));
      showToast('Banner promocional atualizado com sucesso!');
    } else {
      updated = [bannerData, ...banners];
      showToast('Novo banner promocional criado e publicado!');
    }

    onSaveBanners(updated);
    setIsFormOpen(false);
  };

  const filteredBanners = banners.filter((b) => {
    const status = getBannerLiveStatus(b);
    if (filter === 'live' && status !== 'live') return false;
    if (filter === 'scheduled' && status !== 'scheduled') return false;
    if (filter === 'inactive' && status !== 'inactive') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchDesc = b.description.toLowerCase().includes(q);
      const matchProg = b.programTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchProg) return false;
    }
    return true;
  });

  const liveCount = banners.filter((b) => getBannerLiveStatus(b) === 'live').length;
  const scheduledCount = banners.filter((b) => getBannerLiveStatus(b) === 'scheduled').length;
  const inactiveCount = banners.filter((b) => getBannerLiveStatus(b) === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Header & Ação de Criação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Promoção da Hora & Hotsite
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            Gestão de Banners Promocionais & Sorteios
          </h3>
          <p className="text-xs text-zinc-400">
            Cadastre banners vinculados ao horário do programa ou gerais para aparecer na Home do app e no gestor de Hotsite.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Banner Promocional</span>
        </button>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total de Banners</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{banners.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            No Ar Agora
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{liveCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Agendados</div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">{scheduledCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Desativados</div>
          <div className="text-2xl font-black text-zinc-400 font-mono mt-1">{inactiveCount}</div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === 'all'
                ? 'bg-amber-500 text-black font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Todos ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('live')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'live'
                ? 'bg-emerald-500 text-black font-black'
                : 'bg-zinc-900 text-emerald-400 hover:text-emerald-300 border border-zinc-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>No Ar ({liveCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === 'scheduled'
                ? 'bg-amber-500 text-black font-black'
                : 'bg-zinc-900 text-amber-300 hover:text-white border border-zinc-800'
            }`}
          >
            Agendados ({scheduledCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === 'inactive'
                ? 'bg-zinc-700 text-white font-black'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
            }`}
          >
            Desativados ({inactiveCount})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por promoção..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Lista de Banners */}
      {filteredBanners.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
          <Gift className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">Nenhum banner promocional encontrado</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Cadastre seu primeiro banner promocional vinculado a um horário de programa ou campanha especial.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Banner Agora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanners.map((banner) => {
            const status = getBannerLiveStatus(banner);

            return (
              <div
                key={banner.id}
                className={`rounded-3xl border transition overflow-hidden bg-zinc-950 flex flex-col justify-between ${
                  status === 'live'
                    ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'border-zinc-800/80 opacity-90'
                }`}
              >
                {/* Imagem do Banner com Overlay */}
                <div className="relative aspect-[16/10] sm:aspect-[21/9] md:aspect-[2.4/1] max-h-60 sm:max-h-52 bg-zinc-900 overflow-hidden">
                  <img
                    src={banner.bannerUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {status === 'live' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                        No Ar Agora
                      </span>
                    )}
                    {status === 'scheduled' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black shadow-md">
                        Agendado
                      </span>
                    )}
                    {status === 'inactive' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Inativo / Pausado
                      </span>
                    )}

                    {banner.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-300/30">
                        {banner.badge}
                      </span>
                    )}
                  </div>

                  {/* Toggle Rápido Ativar / Desativar */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                      className={`p-1.5 rounded-xl backdrop-blur-md border transition flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                        banner.isActive
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                      }`}
                      title={banner.isActive ? 'Clique para desativar banner' : 'Clique para ativar banner'}
                    >
                      {banner.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-zinc-500" />
                          <span>Pausado</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Título sobre a imagem */}
                  <div className="absolute bottom-3 left-4 right-4">
                    {banner.programTitle && (
                      <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        📻 Vinculado: {banner.programTitle}
                      </p>
                    )}
                    <h4 className="text-base font-black text-white drop-shadow truncate">
                      {banner.title}
                    </h4>
                  </div>
                </div>

                {/* Detalhes do Banner */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {banner.description}
                    </p>

                    {/* Datas e Horários */}
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Período Programado:</span>
                        </span>
                        <span className="font-mono text-zinc-200">
                          {banner.startDate ? banner.startDate.replace('T', ' ') : 'Imediato'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Término:</span>
                        </span>
                        <span className="font-mono text-zinc-200">
                          {banner.endDate ? banner.endDate.replace('T', ' ') : 'Indeterminado'}
                        </span>
                      </div>
                      {banner.scheduleSync && (
                        <div className="text-[10px] text-amber-300/90 font-mono pt-0.5">
                          ✓ Sincronizado ao vivo com o horário do programa
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de Ações */}
                  <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(banner)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar</span>
                      </button>

                      {onPreviewBanner && (
                        <button
                          type="button"
                          onClick={() => onPreviewBanner(banner)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Pré-visualizar na Home"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Prévia</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                      title="Excluir banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL / FORMULÁRIO DE CADASTRO E EDIÇÃO DE BANNER PROMOCIONAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5" />
                <h3 className="text-base sm:text-lg font-black font-display">
                  {editingBanner ? 'Editar Banner Promocional' : 'Cadastrar Banner Promocional'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-5">
              {/* Vínculo de Programa */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Vincular ao Horário de um Programa da Grade (Opcional)
                </label>
                <select
                  value={formProgramId}
                  onChange={(e) => setFormProgramId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="">Promoção Geral da Emissora (Sem programa fixo)</option>
                  {scheduleList.map((prog) => (
                    <option key={prog.id} value={String(prog.id)}>
                      {prog.title} ({prog.startTime} às {prog.endTime} - {prog.host})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">
                  Se vinculado, o banner pode ser sincronizado automaticamente para aparecer no ar durante a transmissão deste programa.
                </p>
              </div>

              {/* Título & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Título da Promoção / Sorteio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Sorteio Kit Camiseta + Boné Rebeldia FM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Etiqueta / Badge
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="PROMOÇÃO DA HORA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Subtítulo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Subtítulo / Chamada Rápida (Opcional)
                </label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Ex: Participe mandando um salve durante a transmissão ao vivo!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Upload e Gestão da Imagem do Banner Promocional */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Upload da Imagem do Banner Promocional *</span>
                  </label>
                  {formBannerUrl && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Trocar Imagem</span>
                    </button>
                  )}
                </div>

                {/* Input de Arquivo Oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* Área de Drag and Drop e Upload */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 ${
                    isDragging
                      ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                      : formBannerUrl
                      ? 'border-zinc-700/80 bg-zinc-950/60 hover:border-zinc-600'
                      : 'border-zinc-700 bg-zinc-950/80 hover:border-amber-500/60 hover:bg-zinc-900/90'
                  }`}
                >
                  {isUploading ? (
                    <div className="py-6 flex flex-col items-center gap-2 text-amber-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p className="text-xs font-bold">Processando e otimizando imagem...</p>
                    </div>
                  ) : formBannerUrl ? (
                    <div className="w-full space-y-2">
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-zinc-700/80 bg-black group">
                        <img
                          src={formBannerUrl}
                          alt="Prévia do Banner"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow">
                            {formBadge || 'PROMOÇÃO DA HORA'}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white">
                          <span className="font-semibold truncate drop-shadow">{formTitle || 'Prévia do Banner'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-zinc-300">
                            Pronto para exibição
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Imagem carregada. Clique ou arraste nova foto para substituir.</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormBannerUrl('');
                          }}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                        <Upload className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Arraste a imagem do banner aqui ou <span className="text-amber-400 underline">clique para selecionar</span>
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Suporta JPG, PNG, WEBP ou GIF (otimização e redimensionamento automático)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-1 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Selecionar Imagem do Computador / Celular</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Ou digite a URL direta */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Ou informe a URL direta da imagem:
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={formBannerUrl}
                    onChange={(e) => setFormBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou dados base64"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {/* Sugestões Rápidas de Banners */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Sugestões de Banners de Rádio & Promoções:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STOCK_PROMO_BANNERS.map((stock, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormBannerUrl(stock.url)}
                        className={`p-1.5 rounded-xl border flex items-center gap-2 transition overflow-hidden text-left ${
                          formBannerUrl === stock.url
                            ? 'bg-amber-500/20 border-amber-500'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img src={stock.url} alt={stock.label} className="w-10 h-7 rounded-lg object-cover" />
                        <span className="text-[10px] text-zinc-300 font-medium truncate">{stock.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Descrição e Regulamento */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Descrição Completa, Prêmios e Regulamento *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explique como o ouvinte participa, qual o prêmio, a data do sorteio e as regras..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-y"
                />
              </div>

              {/* Agendamento: Data/Hora Início e Término */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Data e Hora de Início
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Data e Hora de Término
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="scheduleSync"
                    checked={formScheduleSync}
                    onChange={(e) => setFormScheduleSync(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700"
                  />
                  <label htmlFor="scheduleSync" className="text-xs text-zinc-300 cursor-pointer">
                    Sincronizar exibição com o horário ao vivo do programa na grade
                  </label>
                </div>
              </div>

              {/* Ação e WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Texto do Botão de Ação
                  </label>
                  <input
                    type="text"
                    value={formActionText}
                    onChange={(e) => setFormActionText(e.target.value)}
                    placeholder="Participar no WhatsApp"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Link de Inscrição / WhatsApp Customizado
                  </label>
                  <input
                    type="url"
                    value={formActionUrl}
                    onChange={(e) => setFormActionUrl(e.target.value)}
                    placeholder="Deixe em branco para usar o WhatsApp da rádio"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Status Ativar / Desativar */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Status do Banner</span>
                  <span className="text-[11px] text-zinc-400">
                    {formIsActive ? 'Banner ativo e visível aos ouvintes' : 'Banner pausado (não aparece no app)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    formIsActive
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {formIsActive ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Banner Ativado</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>Banner Desativado</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {editingBanner ? 'Salvar Alterações' : 'Publicar Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
