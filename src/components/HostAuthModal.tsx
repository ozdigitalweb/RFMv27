import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Lock,
  KeyRound,
  ShieldCheck,
  Sparkles,
  X,
  Eye,
  EyeOff,
  Radio,
  CheckCircle2,
  AlertCircle,
  Phone,
  LogOut,
  Settings,
  ArrowRight,
  ExternalLink,
  Mic,
} from 'lucide-react';
import { HostAccount, ProgramItem, RadioStationConfig, LiveTakeover } from '../types';
import { api } from '../utils/api';
import { GoogleReCaptchaProvider, GoogleReCaptcha, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

interface HostAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: ProgramItem[];
  currentLoggedInHost: HostAccount | null;
  onHostLogin: (host: HostAccount) => void;
  onHostLogout: () => void;
  onSelectProgram?: (program: ProgramItem) => void;
  stationConfig: RadioStationConfig;
  onOpenTakeoverModal?: (program?: ProgramItem) => void;
  liveTakeover?: LiveTakeover | null;
  onStopTakeover?: () => Promise<void> | void;
}

type AuthTab = 'login' | 'recover' | 'profile';

export const HostAuthModal: React.FC<HostAuthModalProps> = ({
  isOpen,
  onClose,
  programs,
  currentLoggedInHost,
  onHostLogin,
  onHostLogout,
  onSelectProgram,
  stationConfig,
  onOpenTakeoverModal,
  liveTakeover,
  onStopTakeover,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(currentLoggedInHost ? 'profile' : 'login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Recovery form state (exclusivo por celular)
  const [recoverStep, setRecoverStep] = useState<1 | 2>(1);
  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [recoverQuestion, setRecoverQuestion] = useState('');
  const [recoverName, setRecoverName] = useState('');
  const [recoverAnswer, setRecoverAnswer] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState('');
  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [recoverError, setRecoverError] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [takeoverStopping, setTakeoverStopping] = useState(false);
  const [takeoverError, setTakeoverError] = useState('');

    // reCAPTCHA state
    const { executeRecaptcha: executeRecaptchaHook } = useGoogleReCaptcha();
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [recaptchaError, setRecaptchaError] = useState('');

    const executeRecaptcha = async (action: string) => {
      try {
        const token = await executeRecaptchaHook(action);
        setRecaptchaToken(token);
        setRecaptchaError('');
        return token;
      } catch (err) {
        setRecaptchaError('Erro ao validar reCAPTCHA. Tente novamente.');
        return null;
      }
    };

  if (!isOpen) return null;

    // Get reCAPTCHA site key from environment (Vite injects VITE_ vars at build time)
    const RECAPTCHA_SITE_KEY = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || '';

    const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Preencha seu usuário/e-mail e senha');
      return;
    }

      // Execute reCAPTCHA before login
      const token = await executeRecaptcha('login');
      if (!token) {
        setLoginError(recaptchaError || 'Erro na verificação de segurança. Tente novamente.');
        return;
      }

      setLoginLoading(true);
      try {
        const res = await api.loginHost(loginIdentifier.trim(), loginPassword, undefined, token);
        if (res.success && res.host) {
          onHostLogin(res.host);
          setActiveTab('profile');
          setLoginPassword('');
          setLoginError('');
        } else {
          setLoginError(res.error || 'Credenciais inválidas');
        }
      } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao conectar com o servidor';
            setLoginError(message);
          } finally {
        setLoginLoading(false);
      }
    };

  const handleRecoverLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverError('');
    setRecoverSuccess('');

    if (!recoverIdentifier.trim()) {
      setRecoverError('Informe seu e-mail ou nome de usuário');
      return;
    }

    setRecoverLoading(true);
    try {
      const res = await api.recoverHostPassword({ identifier: recoverIdentifier.trim() });
      if (res.success && res.securityQuestion) {
        setRecoverQuestion(res.securityQuestion);
        setRecoverName(res.name || '');
        setRecoverStep(2);
      } else {
        setRecoverError(res.error || 'Nenhum locutor encontrado com estes dados');
      }
    } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao buscar dados';
          setRecoverError(message);
        } finally {
      setRecoverLoading(false);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverError('');
    setRecoverSuccess('');

    if (!recoverAnswer.trim()) {
      setRecoverError('Informe a resposta de segurança');
      return;
    }

    if (!recoverNewPassword || recoverNewPassword.length < 4) {
      setRecoverError('A nova senha deve ter no mínimo 4 caracteres');
      return;
    }

    if (recoverNewPassword !== recoverConfirmPassword) {
      setRecoverError('As senhas não coincidem');
      return;
    }

      // Execute reCAPTCHA before recover password
      const token = await executeRecaptcha('recover');
      if (!token) {
        setRecoverError(recaptchaError || 'Erro na verificação de segurança. Tente novamente.');
        return;
      }

      setRecoverLoading(true);
      try {
        const res = await api.recoverHostPassword({
          identifier: recoverIdentifier.trim(),
          securityAnswer: recoverAnswer.trim(),
          newPassword: recoverNewPassword,
        }, token);

        if (res.success) {
          setRecoverSuccess('Senha redefinida com sucesso! Redirecionando para login...');
          setTimeout(() => {
            setRecoverStep(1);
            setRecoverIdentifier('');
            setRecoverAnswer('');
            setRecoverNewPassword('');
            setRecoverConfirmPassword('');
            setRecoverSuccess('');
            setActiveTab('login');
          }, 1800);
        } else {
          setRecoverError(res.error || 'Resposta incorreta ou erro ao redefinir');
        }
      } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao redefinir senha';
            setRecoverError(message);
          } finally {
        setRecoverLoading(false);
      }
    };

  // Find all programs associated with current host
  const hostProgramIds = currentLoggedInHost?.programIds && currentLoggedInHost.programIds.length > 0
    ? currentLoggedInHost.programIds
    : currentLoggedInHost?.programId
    ? [currentLoggedInHost.programId]
    : [];

  const linkedPrograms = programs.filter((p) =>
    hostProgramIds.includes(String(p.id)) ||
    (currentLoggedInHost?.name && (
      p.host.toLowerCase().includes(currentLoggedInHost.name.toLowerCase()) ||
      currentLoggedInHost.name.toLowerCase().includes(p.host.toLowerCase())
    ))
  );

  const primaryLinkedProgram = linkedPrograms[0] || null;

  return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="mono-card border border-white/20 rounded-2xl w-full max-w-xl max-h-[calc(100vh-20px)] sm:max-h-[calc(100vh-60px)] flex flex-col overflow-hidden shadow-2xl bg-zinc-950">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black">
              <Mic className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
                Área do Locutor & Comunicador
              </h2>
              <p className="text-xs text-zinc-400">
                Acesso seguro ao perfil oficial, transmissão ao vivo e microfone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-zinc-900/30 px-6 pt-3 gap-2 overflow-x-auto scrollbar-none">
          {currentLoggedInHost ? (
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Meu Perfil Conectado</span>
            </button>
          ) : null}

          <button
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'login'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Entrar com Senha</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('recover');
              setRecoverError('');
              setRecoverStep(1);
            }}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'recover'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Recuperar Senha</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Profile (When Logged In) */}
          {activeTab === 'profile' && currentLoggedInHost && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-start gap-4">
                {currentLoggedInHost.avatarUrl ? (
                  <img
                    src={currentLoggedInHost.avatarUrl}
                    alt={currentLoggedInHost.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-amber-400/50"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xl font-display">
                    {currentLoggedInHost.name.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Sessão Ativa
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">@{currentLoggedInHost.username}</span>
                  </div>

                  <h3 className="text-xl font-black text-white font-display truncate">
                    {currentLoggedInHost.name}
                  </h3>
                  <p className="text-xs text-zinc-400">{currentLoggedInHost.role || 'Locutor da Rebeldia FM'}</p>
                  <p className="text-xs text-zinc-500 truncate">{currentLoggedInHost.email}</p>
                </div>
              </div>

              {/* LIVE TAKEOVER & TRANSMISSÃO AO VIVO CONTROL BOX */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/40 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className={`w-4 h-4 ${liveTakeover?.isActive ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Transmissão & Microfone Ao Vivo
                    </span>
                  </div>
                  {liveTakeover?.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
                      Ao Vivo no Ar
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Pronto para Transmitir
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {liveTakeover?.isActive
                    ? `Você está no ar com "${liveTakeover.originProgramTitle}" (${liveTakeover.substituteHost}). Clique abaixo para gerenciar ou encerrar sua transmissão.`
                    : `Deseja abrir o microfone, transmitir ao vivo ou cobrir o horário de um colega locutor? Clique no botão abaixo para entrar no ar imediatamente.`}
                </p>

                {takeoverError && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{takeoverError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  {liveTakeover?.isActive && onStopTakeover && (
                    <button
                      type="button"
                      disabled={takeoverStopping}
                      onClick={async () => {
                        setTakeoverError('');
                        setTakeoverStopping(true);
                        try {
                          await onStopTakeover();
                        } catch (err: unknown) {
                          setTakeoverError(
                            err instanceof Error ? err.message : 'Erro ao encerrar plantão no servidor.'
                          );
                        } finally {
                          setTakeoverStopping(false);
                        }
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/40"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{takeoverStopping ? 'Encerrando...' : 'Encerrar Plantão / Sair do Ar'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenTakeoverModal) {
                        onOpenTakeoverModal(primaryLinkedProgram || undefined);
                      }
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      liveTakeover?.isActive
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{liveTakeover?.isActive ? 'Ajustar Configurações do Ar' : '🎙️ Entrar no Ar / Iniciar Plantão'}</span>
                  </button>
                </div>
              </div>

              {/* Linked Programs Section */}
              {linkedPrograms.length > 0 ? (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      <span>Seus Programas Vinculados ({linkedPrograms.length})</span>
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Programas que você apresenta
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {linkedPrograms.map((lp) => (
                      <div
                        key={lp.id}
                        className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {lp.avatarUrl ? (
                            <img
                              src={lp.avatarUrl}
                              alt={lp.title}
                              className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-white font-bold shrink-0">
                              {lp.title.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white font-display truncate">{lp.title}</h4>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              {lp.startTime} - {lp.endTime} • {lp.genre}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onSelectProgram) onSelectProgram(lp);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                        >
                          <Sparkles className="w-3 h-3 text-black" />
                          <span>Página do Programa</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300">
                  Nenhum programa específico está vinculado ao seu usuário ainda. O administrador da rádio pode vincular seus programas no painel de controle.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    onHostLogout();
                    setActiveTab('login');
                  }}
                  className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-950 text-red-300 border border-red-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta de Locutor</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Entre com seu usuário ou e-mail cadastrado e senha para gerenciar seu hotsite e entrar no ar.
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Usuário ou E-mail do Locutor *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Ex: carlos ou carlos@rebeldiafm.com.br"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Senha de Acesso *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('recover');
                      setRecoverIdentifier(loginIdentifier);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {loginLoading ? (
                    <span>Verificando credenciais...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Entrar no Painel do Locutor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Password Recovery */}
          {activeTab === 'recover' && (
            <div className="space-y-4 animate-fadeIn">
              {recoverSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{recoverSuccess}</span>
                </div>
              )}

              {recoverError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{recoverError}</span>
                </div>
              )}

              {recoverStep === 1 ? (
                <form onSubmit={handleRecoverLookup} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      Recuperação de Senha do Locutor
                    </p>
                    <p className="text-zinc-400">
                      Informe o e-mail ou nome de usuário utilizado no cadastro para responder à sua pergunta de segurança e definir uma nova senha.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      E-mail ou Usuário do Locutor *
                    </label>
                    <input
                      type="text"
                      value={recoverIdentifier}
                      onChange={(e) => setRecoverIdentifier(e.target.value)}
                      placeholder="Ex: carlos@rebeldiafm.com.br ou @carlos"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={recoverLoading}
                      className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {recoverLoading ? <span>Buscando cadastro...</span> : <span>Continuar Recuperação</span>}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRecoverSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                    <p className="font-bold text-white">
                      Locutor identificado: <span className="text-amber-300">{recoverName}</span>
                    </p>
                    <p className="text-xs text-zinc-300">
                      Responda à sua pergunta secreta para desbloquear a troca de senha:
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white font-bold">
                    💬 {recoverQuestion}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Sua Resposta Secreta *
                    </label>
                    <input
                      type="text"
                      value={recoverAnswer}
                      onChange={(e) => setRecoverAnswer(e.target.value)}
                      placeholder="Digite a resposta cadastrada"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Nova Senha *
                      </label>
                      <div className="relative">
                        <input
                          type={showRecoverPassword ? 'text' : 'password'}
                          value={recoverNewPassword}
                          onChange={(e) => setRecoverNewPassword(e.target.value)}
                          placeholder="Mínimo 4 caracteres"
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRecoverPassword(!showRecoverPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {showRecoverPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Confirmar Nova Senha *
                      </label>
                      <input
                        type={showRecoverPassword ? 'text' : 'password'}
                        value={recoverConfirmPassword}
                        onChange={(e) => setRecoverConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRecoverStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={recoverLoading}
                      className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {recoverLoading ? <span>Redefinindo senha...</span> : <span>Salvar Nova Senha & Entrar</span>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
          </GoogleReCaptchaProvider>
        );
};
