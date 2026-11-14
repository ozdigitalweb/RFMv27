import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  Mic,
  Phone,
  PowerOff,
  Save,
  Sparkles,
  User,
} from 'lucide-react';
import { HostAccount, LiveTakeover, ProgramItem } from '../types';
import { api } from '../utils/api';
import { formatPhoneDisplay, isValidCellPhone, resolveHostWhatsapp } from '../utils/hostPhone';

interface AdminHostCoringaSectionProps {
  activeHost: HostAccount;
  currentLiveProgram?: ProgramItem | null;
  liveTakeover?: LiveTakeover | null;
  onStartTakeover?: (takeover: LiveTakeover) => Promise<void> | void;
  onStopTakeover?: () => Promise<void> | void;
  stationWhatsapp?: string;
  showToast: (msg: string) => void;
}

export const AdminHostCoringaSection: React.FC<AdminHostCoringaSectionProps> = ({
  activeHost,
  currentLiveProgram,
  liveTakeover,
  onStartTakeover,
  onStopTakeover,
  stationWhatsapp,
  showToast,
}) => {
  const hostPhone = resolveHostWhatsapp(activeHost, stationWhatsapp);
  const [coverCurrentSlot, setCoverCurrentSlot] = useState(true);
  const [coringaTitle, setCoringaTitle] = useState('Plantão Coringa ao Vivo');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isMyCoringaLive = Boolean(
    liveTakeover?.isActive &&
      liveTakeover?.isCoringa &&
      (liveTakeover.substituteHostId === activeHost.id ||
        liveTakeover.substituteHost.toLowerCase() === activeHost.name.toLowerCase())
  );

  const handleAssumeCoringa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onStartTakeover) return;
    setIsSaving(true);
    try {
      const payload: LiveTakeover = {
        isActive: true,
        substituteHost: activeHost.name,
        substituteHostId: activeHost.id,
        substituteHostRole: activeHost.role || 'Locutor em Modo Coringa',
        substituteAvatarUrl: activeHost.avatarUrl || '/reb_mascot.jpg',
        substituteWhatsapp: hostPhone,
        substituteBio: activeHost.bio,
        targetProgramId: coverCurrentSlot ? currentLiveProgram?.id : undefined,
        originProgramTitle: coverCurrentSlot ? currentLiveProgram?.title : undefined,
        takeoverType: 'coringa',
        isCoringa: true,
        coverScheduleProgram: coverCurrentSlot,
        coringaProgramTitle: !coverCurrentSlot ? coringaTitle.trim() || 'Plantão Coringa' : undefined,
        notes: notes.trim() || undefined,
        startedAt: Date.now(),
      };
      await onStartTakeover(payload);
      showToast(`Você assumiu o ar como Coringa com seu celular (${formatPhoneDisplay(hostPhone)})!`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStop = async () => {
    if (!onStopTakeover) return;
    setIsSaving(true);
    try {
      await onStopTakeover();
      showToast('Modo Coringa encerrado. Grade titular restaurada.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Assumir Coringa ao Vivo</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Entre no ar imediatamente usando sua identidade e o seu número de celular para atender os ouvintes, cobrindo um horário ou em plantão avulso.
          </p>
        </div>

        {liveTakeover?.isActive && (
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-red-600 text-white flex items-center gap-1.5 self-start">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {isMyCoringaLive ? 'Você está no ar como Coringa' : `No ar: ${liveTakeover.substituteHost}`}
          </span>
        )}
      </div>

      {/* Host Identity Card */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
        <img
          src={activeHost.avatarUrl || '/reb_mascot.jpg'}
          alt={activeHost.name}
          className="w-14 h-14 rounded-2xl object-cover border border-amber-500/40 shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="text-sm font-black text-white truncate">{activeHost.name}</div>
          <div className="text-xs text-zinc-400">{activeHost.role || 'Locutor Rebeldia FM'}</div>
          <div className="text-xs text-emerald-400 font-mono tabular-nums flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span>Celular carregado no ar: {formatPhoneDisplay(hostPhone)}</span>
          </div>
        </div>
      </div>

      {liveTakeover?.isActive && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-red-100 space-y-0.5">
            <div className="font-black uppercase tracking-wider text-red-300">Transmissão Coringa / Plantão Ativa</div>
            <div>
              Apresentando agora: <strong>{liveTakeover.substituteHost}</strong>
              {liveTakeover.coringaProgramTitle ? ` • ${liveTakeover.coringaProgramTitle}` : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={handleStop}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <PowerOff className="w-4 h-4" />
            <span>Encerrar Coringa / Restaurar Grade</span>
          </button>
        </div>
      )}

      <form onSubmit={handleAssumeCoringa} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCoverCurrentSlot(true)}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              coverCurrentSlot
                ? 'bg-amber-500/15 border-amber-400 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-black">Cobrir Horário Atual da Grade</div>
            <div className="text-[11px] opacity-80 mt-0.5 truncate">
              Mantém "{currentLiveProgram?.title || 'Programa Atual'}" e assume apresentação + seu celular
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCoverCurrentSlot(false)}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              !coverCurrentSlot
                ? 'bg-amber-500/15 border-amber-400 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-black">Plantão Livre Coringa</div>
            <div className="text-[11px] opacity-80 mt-0.5">
              Entrada especial avulsa sem vincular a programa da grade
            </div>
          </button>
        </div>

        {!coverCurrentSlot && (
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Título da Transmissão Coringa
            </label>
            <input
              type="text"
              value={coringaTitle}
              onChange={(e) => setCoringaTitle(e.target.value)}
              placeholder="Ex: Plantão Coringa Especial"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Recado no Ar para os Ouvintes (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Assumindo o comando ao vivo agora! Mande seu alô no WhatsApp!"
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Mic className="w-4 h-4" />
          <span>{isSaving ? 'Ativando Coringa...' : 'Assumir Coringa no Ar Agora'}</span>
        </button>
      </form>
    </div>
  );
};

interface AdminHostMyProfileSectionProps {
  activeHost: HostAccount;
  hostToken: string | null;
  onProfileUpdated: (updatedHost: HostAccount) => void;
  showToast: (msg: string) => void;
}

export const AdminHostMyProfileSection: React.FC<AdminHostMyProfileSectionProps> = ({
  activeHost,
  hostToken,
  onProfileUpdated,
  showToast,
}) => {
  const [name, setName] = useState(activeHost.name || '');
  const [role, setRole] = useState(activeHost.role || '');
  const [bio, setBio] = useState(activeHost.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(activeHost.avatarUrl || '');
  const [whatsapp, setWhatsapp] = useState(activeHost.whatsapp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Nome artístico é obrigatório.');
      return;
    }
    if (!isValidCellPhone(whatsapp)) {
      setError('Informe um número de celular válido com DDD.');
      return;
    }
    if (newPassword && newPassword.length < 4) {
      setError('A nova senha pessoal deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }
    if (!hostToken) {
      setError('Sessão de locutor expirada. Faça login novamente com seu celular.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateMyHostProfile(
        {
          name: name.trim(),
          role: role.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          whatsapp: whatsapp.trim(),
          ...(newPassword ? { newPassword: newPassword.trim() } : {}),
        },
        hostToken
      );

      if (!res.success || !res.host) {
        setError(res.error || 'Erro ao atualizar perfil.');
        return;
      }

      onProfileUpdated(res.host);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Perfil, celular e senha pessoal atualizados com sucesso!');
      showToast('Dados pessoais salvos com sucesso!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
        <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          <span>Meu Perfil, Celular & Senha Pessoal</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Seu celular é seu login exclusivo e o número carregado para os ouvintes em todos os seus programas e plantões Coringa.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Nome Artístico *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
              Celular (Login Exclusivo & WhatsApp no Ar) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-zinc-900 border border-emerald-500/40 focus:border-emerald-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono tabular-nums outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Função / Cargo na Rádio
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              URL da Foto do Perfil
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Biografia
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-400 rounded-xl p-3 text-xs text-white outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Alterar Senha Pessoal do Locutor (Opcional)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Nova Senha Pessoal</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Perfil & Senha'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
