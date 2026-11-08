import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Sparkles,
  X,
  Eye,
  EyeOff,
  Radio,
  HelpCircle,
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
  onStopTakeover?: () => void;
}

type AuthTab = 'login' | 'register' | 'recover' | 'profile';

const SECURITY_QUESTIONS = [
  'Qual é a sua banda ou artista favorito de todos os tempos?',
  'Em qual cidade você nasceu ou começou a fazer rádio?',
  'Qual foi o primeiro disco ou álbum que você comprou?',
  'Qual o nome da sua primeira escola ou rádio que trabalhou?',
  'Qual é o nome do seu primeiro animal de estimação?',
];

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

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regWhatsapp, setRegWhatsapp] = useState('5548991984678');
  const [regProgramIds, setRegProgramIds] = useState<string[]>([]);
  const [regRole, setRegRole] = useState('Locutor Titular');
  const [regSecurityQuestion, setRegSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [regSecurityAnswer, setRegSecurityAnswer] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Recovery form state
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

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Preencha seu usuário/e-mail e senha');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await api.loginHost(loginIdentifier.trim(), loginPassword);
      if (res.success && res.host) {
        onHostLogin(res.host);
        setActiveTab('profile');
        setLoginPassword('');
        setLoginError('');
      } else {
        setLoginError(res.error || 'Credenciais inválidas');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Preencha todos os campos obrigatórios (*)');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('A senha deve ter no mínimo 4 caracteres');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas não coincidem');
      return;
    }

    if (!regSecurityAnswer.trim()) {
      setRegError('Preencha a resposta de segurança para recuperação de senha');
      return;
    }

    setRegLoading(true);
    try {
      const targetProg = programs.find((p) => regProgramIds.includes(String(p.id)));
      const res = await api.registerHost({
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        whatsapp: regWhatsapp.trim() || '5548991984678',
        role: regRole.trim(),
        programIds: regProgramIds,
        programId: regProgramIds[0] || undefined,
        programTitle: targetProg?.title || undefined,
        securityQuestion: regSecurityQuestion,
        securityAnswer: regSecurityAnswer.trim(),
      });

      if (res.success && res.host) {
        setRegSuccess('Cadastro realizado com sucesso! Você já está autenticado.');
        onHostLogin(res.host);
        setTimeout(() => {
          setActiveTab('profile');
          setRegSuccess('');
        }, 1200);
      } else {
        setRegError(res.error || 'Erro ao cadastrar locutor');
      }
    } catch (err: any) {
      setRegError(err.message || 'Erro ao cadastrar');
    } finally {
      setRegLoading(false);
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
    } catch (err: any) {
      setRecoverError(err.message || 'Erro ao buscar dados');
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

    setRecoverLoading(true);
    try {
      const res = await api.recoverHostPassword({
        identifier: recoverIdentifier.trim(),
        securityAnswer: recoverAnswer.trim(),
        newPassword: recoverNewPassword,
      });

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
    } catch (err: any) {
      setRecoverError(err.message || 'Erro ao redefinir senha');
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
              setActiveTab('register');
              setRegError('');
            }}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'register'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Novo Cadastro de Locutor</span>
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
                    ? `Você está no ar com "${liveTakeover.programTitle}" (${liveTakeover.hostName}). Clique abaixo para gerenciar ou encerrar sua transmissão.`
                    : `Deseja abrir o microfone, transmitir ao vivo ou cobrir o horário de um colega locutor? Clique no botão abaixo para entrar no ar imediatamente.`}
                </p>

                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                  {liveTakeover?.isActive && onStopTakeover && (
                    <button
                      type="button"
                      onClick={() => {
                        onStopTakeover();
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/40"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Encerrar Plantão / Sair do Ar</span>
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

              <div className="text-center pt-2">
                <p className="text-xs text-zinc-400">
                  Ainda não tem conta de locutor?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-white font-bold hover:underline cursor-pointer"
                  >
                    Cadastre-se aqui
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 3: Register */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {regError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Nome Artístico / Completo *
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Carlos Rocha"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Usuário de Login (Slug) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      placeholder="carlosrocha"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl pl-8 pr-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    E-mail Oficial do Locutor *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="carlos@rebeldiafm.com.br"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      WhatsApp para Pedidos
                    </label>
                    <button
                      type="button"
                      onClick={() => setRegWhatsapp('5548991984678')}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Padrão (5548991984678)
                    </button>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value.replace(/\D/g, ''))}
                      placeholder="5548991984678"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Função / Cargo na Rádio
                </label>
                <input
                  type="text"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  placeholder="Ex: Locutor Titular & Apresentador"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              {/* Multi-program selection in Registration */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>Programas que você apresenta ({regProgramIds.length})</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    Selecione um ou mais programas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {programs.map((prog) => {
                    const isChecked = regProgramIds.includes(String(prog.id));
                    return (
                      <label
                        key={prog.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-400 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const progIdStr = String(prog.id);
                            if (e.target.checked) {
                              setRegProgramIds([...regProgramIds, progIdStr]);
                            } else {
                              setRegProgramIds(regProgramIds.filter((id) => id !== progIdStr));
                            }
                          }}
                          className="rounded border-zinc-700 text-amber-500 focus:ring-0 focus:outline-none accent-amber-400"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate text-white">{prog.title}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {prog.startTime} - {prog.endTime}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 4 dígitos"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pergunta e Resposta de Segurança para Recuperação de Senha */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Pergunta Secreta para Recuperação de Senha</span>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Escolha a Pergunta de Segurança *</label>
                  <select
                    value={regSecurityQuestion}
                    onChange={(e) => setRegSecurityQuestion(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                  >
                    {SECURITY_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Sua Resposta Secreta *</label>
                  <input
                    type="text"
                    value={regSecurityAnswer}
                    onChange={(e) => setRegSecurityAnswer(e.target.value)}
                    placeholder="Ex: Legião Urbana"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition"
                    required
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Esta resposta será solicitada caso você esqueça sua senha no futuro.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {regLoading ? (
                    <span>Cadastrando locutor...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluir Cadastro de Locutor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Password Recovery */}
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
  );
};
