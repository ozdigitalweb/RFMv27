import React, { useState, useMemo } from 'react';
import {
  Mic,
  Radio,
  User,
  X,
  Check,
  AlertCircle,
  MessageCircle,
  Clock,
  Sparkles,
  Phone,
  PowerOff,
  Flame,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Bot,
} from 'lucide-react';
import { ProgramItem, LiveTakeover, RadioStationConfig } from '../types';

export interface AvailableHostItem {
  host: string;
  hostRole?: string;
  avatarUrl?: string;
  whatsappNumber?: string;
  originProgram: string;
  isRobot?: boolean;
  programs: Array<{ id: string; title: string; startTime?: string; endTime?: string; isRebDefault?: boolean }>;
}

interface LiveTakeoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScheduledProgram: ProgramItem | null;
  programs: ProgramItem[];
  liveTakeover: LiveTakeover | null;
  onStartTakeover: (takeover: LiveTakeover) => void;
  onStopTakeover: () => void;
  stationConfig: RadioStationConfig;
}

export const LiveTakeoverModal: React.FC<LiveTakeoverModalProps> = ({
  isOpen,
  onClose,
  currentScheduledProgram,
  programs,
  liveTakeover,
  onStartTakeover,
  onStopTakeover,
  stationConfig,
}) => {
  // Extract unique hosts from registered programs (INCLUDING REB as official 24h robot / curator)
  const availableHosts = useMemo<AvailableHostItem[]>(() => {
    const map = new Map<string, AvailableHostItem>();

    // 1. REB Programs (Default 2 fixed programs + any assigned to REB in the schedule)
    const rebPrograms: Array<{ id: string; title: string; startTime?: string; endTime?: string; isRebDefault?: boolean }> = [];
    
    programs.forEach((p) => {
      const isReb =
        (p.host && p.host.toUpperCase() === 'REB') ||
        p.isRebDefault ||
        (p.host && p.host.toLowerCase().includes('autodj')) ||
        p.id === 'reb-default-auto' ||
        p.id === 'prog-1';
      
      if (isReb) {
        if (!rebPrograms.some((rp) => String(rp.id) === String(p.id) || rp.title === p.title)) {
          rebPrograms.push({
            id: String(p.id),
            title: p.title,
            startTime: p.startTime,
            endTime: p.endTime,
            isRebDefault: p.isRebDefault,
          });
        }
      }
    });

    // Ensure REB has his two fixed core programs: inLINE - madrugadão Rebeldia & REB - 24hs NOAR
    if (!rebPrograms.some((rp) => rp.title.toLowerCase().includes('madrugad') || rp.title.toLowerCase().includes('inline'))) {
      rebPrograms.unshift({
        id: 'prog-1',
        title: 'inLINE - madrugadão Rebeldia',
        startTime: '00:00',
        endTime: '06:00',
      });
    }
    if (!rebPrograms.some((rp) => rp.title.toLowerCase().includes('24hs noar') || rp.title.toLowerCase().includes('curadoria') || rp.title.toLowerCase().includes('reb - 24hs'))) {
      rebPrograms.push({
        id: 'reb-default-auto',
        title: 'REB - 24hs NOAR',
        startTime: '24h',
        endTime: 'AutoDJ',
        isRebDefault: true,
      });
    }

    // Register REB as the official 24h AutoDJ host
    map.set('REB', {
      host: 'REB',
      hostRole: 'Robô AutoDJ • Programação Contínua 24h',
      avatarUrl: '/reb_mascot.jpg',
      whatsappNumber: stationConfig.whatsappNumber || '5548991984678',
      originProgram: rebPrograms[0]?.title || 'REB - 24hs NOAR',
      isRobot: true,
      programs: rebPrograms,
    });

    // 2. Add all other hosts from programs
    programs.forEach((p) => {
      if (p.host && p.host.toUpperCase() !== 'REB' && !p.host.toLowerCase().includes('autodj')) {
        const key = p.host;
        const progInfo = {
          id: String(p.id),
          title: p.title,
          startTime: p.startTime,
          endTime: p.endTime,
        };

        if (!map.has(key)) {
          map.set(key, {
            host: p.host,
            hostRole: p.hostRole || 'Locutor da Grade',
            avatarUrl: p.avatarUrl,
            whatsappNumber: p.whatsappNumber || stationConfig.whatsappNumber,
            originProgram: p.title,
            isRobot: false,
            programs: [progInfo],
          });
        } else {
          const entry = map.get(key)!;
          if (!entry.programs.some((ep) => String(ep.id) === String(p.id))) {
            entry.programs.push(progInfo);
          }
        }
      }
    });

    return Array.from(map.values());
  }, [programs, stationConfig.whatsappNumber]);

  // Form state
  const [selectedHostPreset, setSelectedHostPreset] = useState<string>(() => {
    if (currentScheduledProgram?.host && currentScheduledProgram.host.toUpperCase() === 'REB') {
      return 'REB';
    }
    return availableHosts[0]?.host || 'REB';
  });

  const selectedHostData = useMemo(() => {
    return availableHosts.find((h) => h.host === selectedHostPreset) || availableHosts[0] || null;
  }, [availableHosts, selectedHostPreset]);

  const [selectedProgramTitle, setSelectedProgramTitle] = useState<string>(() => {
    if (currentScheduledProgram?.title) return currentScheduledProgram.title;
    return availableHosts[0]?.programs[0]?.title || 'REB - 24hs NOAR';
  });

  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    if (currentScheduledProgram?.id) return String(currentScheduledProgram.id);
    return availableHosts[0]?.programs[0]?.id || 'reb-default-auto';
  });

  const [customHostName, setCustomHostName] = useState('');
  const [customHostRole, setCustomHostRole] = useState('Locutor Online • Apresentação Especial');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [customWhatsapp, setCustomWhatsapp] = useState(stationConfig.whatsappNumber || '5548991984678');
  const [takeoverNotes, setTakeoverNotes] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Handle Preset Host Selection
  const handleSelectHostPreset = (hostName: string) => {
    setSelectedHostPreset(hostName);
    setIsCustomMode(false);
    const found = availableHosts.find((h) => h.host === hostName);
    if (found) {
      setCustomHostName(found.host);
      setCustomHostRole(found.hostRole || 'Locutor Online • Apresentação Especial');
      setCustomAvatarUrl(found.avatarUrl || '');
      setCustomWhatsapp(found.whatsappNumber || stationConfig.whatsappNumber || '5548991984678');
      if (found.programs.length > 0) {
        const match = found.programs.find(
          (pr) => currentScheduledProgram && (String(pr.id) === String(currentScheduledProgram.id) || pr.title === currentScheduledProgram.title)
        );
        const chosen = match || found.programs[0];
        setSelectedProgramTitle(chosen.title);
        setSelectedProgramId(chosen.id);
      }
    }
  };

  if (!isOpen) return null;

  const activeSubstitute = liveTakeover?.isActive ? liveTakeover : null;

  const handleLaunchTakeover = (e: React.FormEvent) => {
    e.preventDefault();

    let finalHost = customHostName.trim();
    let finalRole = customHostRole.trim();
    let finalAvatar = customAvatarUrl.trim();
    let finalWhatsapp = customWhatsapp.trim();
    let originProg = selectedProgramTitle || '';
    let targetProgId = selectedProgramId || currentScheduledProgram?.id || 'reb-default-auto';

    if (!isCustomMode) {
      const found = availableHosts.find((h) => h.host === selectedHostPreset);
      if (found) {
        finalHost = found.host;
        finalRole = found.hostRole || 'Locutor Online • Apresentação Especial';
        finalAvatar = found.avatarUrl || '';
        finalWhatsapp = found.whatsappNumber || stationConfig.whatsappNumber || '5548991984678';
        originProg = selectedProgramTitle || found.originProgram;
      }
    }

    if (!finalHost) {
      alert('Por favor, selecione ou informe o nome do locutor que está assumindo o microfone.');
      return;
    }

    const isRobotHost = finalHost.toLowerCase() === 'reb' || finalHost.toLowerCase().includes('autodj');

    const newTakeover: LiveTakeover = {
      isActive: true,
      substituteHost: finalHost,
      substituteHostRole: finalRole || (isRobotHost ? 'Robô AutoDJ • 24h' : 'Locutor Online • Apresentação Especial'),
      substituteAvatarUrl: finalAvatar || undefined,
      substituteWhatsapp: finalWhatsapp || stationConfig.whatsappNumber || '5548991984678',
      originProgramTitle: originProg || currentScheduledProgram?.title || 'REB - 24hs NOAR',
      targetProgramId: targetProgId,
      takeoverType: isRobotHost ? 'live_dj_session' : (currentScheduledProgram?.host === 'REB' ? 'live_dj_session' : 'covering_colleague'),
      notes: takeoverNotes.trim() || undefined,
      startedAt: Date.now(),
    };

    onStartTakeover(newTakeover);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="mono-card border border-white/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[calc(100vh-20px)] sm:max-h-[calc(100vh-60px)] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-lg">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-display">
                  Estúdio Ao Vivo • Assumir Microfone
                </h3>
                {activeSubstitute ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
                    SUBSTITUIÇÃO ATIVA
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ESTÚDIO PRONTO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Cumprir horário de colega ou entrar ao vivo durante a curadoria REB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Atual do Horário */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white" />
                Dono do Horário Atual na Grade
              </span>
              <span className="font-mono text-zinc-400">
                {currentScheduledProgram ? `${currentScheduledProgram.startTime} - ${currentScheduledProgram.endTime}` : '24h'}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              {currentScheduledProgram?.avatarUrl ? (
                <img
                  src={currentScheduledProgram.avatarUrl}
                  alt={currentScheduledProgram.title}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-white shrink-0">
                  <Radio className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {currentScheduledProgram?.title || 'REB - 24hs NOAR'}
                </h4>
                <p className="text-xs text-zinc-400 truncate">
                  Apresentador Titular: <strong className="text-zinc-200">{currentScheduledProgram?.host || 'REB (Locutor Padrão)'}</strong>
                  {currentScheduledProgram?.isRebDefault && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Horário Livre REB
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Se JÁ houver substituição ativa */}
          {activeSubstitute && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-zinc-900 border border-red-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-black text-red-300 uppercase tracking-wider">
                    No Ar no Momento (Locutor Online)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Iniciado há {Math.max(1, Math.round((Date.now() - activeSubstitute.startedAt) / 60000))} min
                </span>
              </div>

              <div className="flex items-center gap-3">
                {activeSubstitute.substituteAvatarUrl ? (
                  <img
                    src={activeSubstitute.substituteAvatarUrl}
                    alt={activeSubstitute.substituteHost}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-red-500/50 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-500/40 flex items-center justify-center text-red-300 font-bold shrink-0">
                    <Mic className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="text-sm font-black text-white truncate">
                    {activeSubstitute.substituteHost}
                  </h5>
                  <p className="text-xs text-red-200 truncate">
                    {activeSubstitute.substituteHostRole || 'Locutor Substituto'}
                  </p>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <MessageCircle className="w-3 h-3 text-emerald-400" />
                    WhatsApp ativo para pedidos:{' '}
                    <strong className="text-emerald-300 font-mono">
                      {activeSubstitute.substituteWhatsapp || stationConfig.whatsappNumber}
                    </strong>
                  </p>
                </div>
              </div>

              {activeSubstitute.notes && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 italic">
                  "{activeSubstitute.notes}"
                </div>
              )}

              <button
                onClick={() => {
                  onStopTakeover();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <PowerOff className="w-4 h-4" />
                <span>Encerrar Substituição e Devolver ao Titular ({currentScheduledProgram?.host || 'REB'})</span>
              </button>
            </div>
          )}

          {/* Formulário para Assumir Microfone / Entrar no Ar */}
          <form onSubmit={handleLaunchTakeover} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-white" />
                Quem vai assumir o microfone?
              </label>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-[11px] text-zinc-400 hover:text-white underline"
              >
                {isCustomMode ? '← Escolher da lista de locutores' : '+ Digitar locutor convidado / outro'}
              </button>
            </div>

            {!isCustomMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableHosts.map((h) => {
                    const isSelected = selectedHostPreset === h.host;
                    return (
                      <div
                        key={h.host}
                        onClick={() => handleSelectHostPreset(h.host)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-white/10 text-white'
                        }`}
                      >
                        {h.avatarUrl ? (
                          <img
                            src={h.avatarUrl}
                            alt={h.host}
                            className={`w-10 h-10 rounded-xl object-cover shrink-0 border ${
                              isSelected ? 'border-black/30' : 'border-white/10'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {h.host.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs font-black truncate">{h.host}</h5>
                            {h.isRobot && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-black/10 text-zinc-900 border border-black/20'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                <Bot className="w-2.5 h-2.5 text-amber-400" />
                                Robô AutoDJ
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-zinc-700' : 'text-zinc-400'}`}>
                            {h.originProgram}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-black shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Seleção do Programa a Transmitir (ex: REB tem inLINE - madrugadão Rebeldia & REB - 24hs NOAR) */}
                {selectedHostData && selectedHostData.programs && selectedHostData.programs.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        <span>Programa que vai ao ar:</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {selectedHostData.programs.length}{' '}
                        {selectedHostData.programs.length === 1 ? 'programa disponível' : 'programas cadastrados'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedHostData.programs.map((prog) => {
                        const isChosen = selectedProgramTitle === prog.title;
                        return (
                          <button
                            key={prog.id}
                            type="button"
                            onClick={() => {
                              setSelectedProgramTitle(prog.title);
                              setSelectedProgramId(prog.id);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                              isChosen
                                ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40'
                                : 'bg-zinc-950 border-white/5 text-zinc-300 hover:border-white/20'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate text-white flex items-center gap-1.5">
                                <span>{prog.title}</span>
                                {prog.isRebDefault && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold font-mono">
                                    24h
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {prog.startTime && prog.endTime ? `${prog.startTime} - ${prog.endTime}` : 'Programação Oficial'}
                              </div>
                            </div>
                            {isChosen ? (
                              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Nome do Apresentador / DJ</label>
                  <input
                    type="text"
                    value={customHostName}
                    onChange={(e) => setCustomHostName(e.target.value)}
                    placeholder="Ex: DJ Lucas Rock, Carla Santos..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300">Papel / Subtítulo</label>
                    <input
                      type="text"
                      value={customHostRole}
                      onChange={(e) => setCustomHostRole(e.target.value)}
                      placeholder="Ex: Plantão Especial de Fim de Semana"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300">WhatsApp Direto</label>
                    <input
                      type="text"
                      value={customWhatsapp}
                      onChange={(e) => setCustomWhatsapp(e.target.value)}
                      placeholder="Ex: 5548991984678"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">URL da Foto do Locutor (Opcional)</label>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            )}

            {/* Recado / Mensagem no Ar */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                Recado no Ar / Motivo do Plantão (Opcional)
              </label>
              <input
                type="text"
                value={takeoverNotes}
                onChange={(e) => setTakeoverNotes(e.target.value)}
                placeholder={`Ex: Cobrindo a bancada hoje no ${currentScheduledProgram?.title || 'estúdio'}, mandem seus pedidos!`}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Regra de Negócio Explicada */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-zinc-400 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Como a rádio exibirá esta transmissão:
              </p>
              <p className="text-[11px]">
                O programa permanecerá como <strong className="text-zinc-200">"{currentScheduledProgram?.title || 'REB - 24hs NOAR'}"</strong> (dono do horário na grade), mas a apresentação e o WhatsApp de pedidos serão alterados para o colega que assumiu o microfone.
              </p>
            </div>

            {/* Botão de Submissão */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black transition flex items-center gap-2 shadow-xl cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>ENTRAR NO AR AGORA</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
