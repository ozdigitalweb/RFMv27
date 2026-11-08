import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Heart, Pin, User, MapPin, LogIn, ShieldAlert, Info } from 'lucide-react';
import { ShoutoutMessage, RadioStationConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface MuralBoardProps {
  messages: ShoutoutMessage[];
  onAddMessage: (msg: Omit<ShoutoutMessage, 'id' | 'timestamp' | 'likes'>) => void;
  onLikeMessage: (id: string) => void;
  stationConfig: RadioStationConfig;
}

export const MuralBoard: React.FC<MuralBoardProps> = ({
  messages,
  onAddMessage,
  onLikeMessage,
  stationConfig,
}) => {
  const { user, idToken, signInWithGoogle } = useAuth();
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.displayName && !author) {
      setAuthor(user.displayName);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      // Save to Cloud SQL database
      await api.createShoutout(
        {
          authorName: author.trim(),
          authorCity: city.trim() || 'Ouvinte Online',
          content: text.trim(),
        },
        idToken
      );

      // Local optimistic update
      onAddMessage({
        author: author.trim(),
        city: city.trim() || 'Ouvinte Online',
        message: text.trim(),
        avatarColor: 'bg-zinc-800',
      });

      setText('');
    } catch (err) {
      console.error('Failed to submit shoutout to database:', err);
      // Fallback local update
      onAddMessage({
        author: author.trim(),
        city: city.trim() || 'Ouvinte Online',
        message: text.trim(),
        avatarColor: 'bg-zinc-800',
      });
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (ts: number) => {
    const diffMin = Math.round((Date.now() - ts) / (1000 * 60));
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    const hours = Math.floor(diffMin / 60);
    if (hours < 24) return `há ${hours}h`;
    return new Date(ts).toLocaleDateString();
  };

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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 backdrop-blur-md shadow-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white font-display">Mural de Recados & Ouvintes</h2>
              <p className="text-xs text-zinc-300">
                Deixe um salve para os locutores ou mande um abraço para sua cidade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar com Google</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full" />
                ) : (
                  <User className="w-3.5 h-3.5 text-white" />
                )}
                <span className="font-semibold text-white">{user.displayName || user.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-4">
          <div className="mono-card p-6 rounded-2xl sticky top-28 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-white/10 flex items-center justify-between">
              <span>Deixar um Salve no Mural</span>
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Marina Santos"
                  className="w-full px-3.5 py-2.5 rounded-xl mono-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Sua Cidade / Bairro
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Canoas - RS"
                  className="w-full px-3.5 py-2.5 rounded-xl mono-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Sua Mensagem *
                </label>
                <textarea
                  required
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Mande um salve para a rádio, comente a música que está tocando..."
                  className="w-full px-3.5 py-2.5 rounded-xl mono-input text-xs resize-none"
                />
              </div>

              {/* Aviso de Mediação e Moderação */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-2.5 text-zinc-400 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px] text-zinc-300">
                  <strong className="text-white font-bold">Aviso de Mediação:</strong> Para garantir o respeito e a segurança na transmissão, todas as mensagens enviadas ao mural passam por mediação e moderação da equipe da rádio.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Publicando...' : 'Publicar no Mural'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Message Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              Recados dos Ouvintes ({messages.length})
            </h3>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Mural Ao Vivo
            </span>
          </div>

          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mono-card mono-card-hover p-4 sm:p-5 rounded-2xl space-y-3 relative ${
                  msg.isPinned ? 'border-white/30 bg-zinc-900/90' : ''
                }`}
              >
                {msg.isPinned && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider mb-1">
                    <Pin className="w-3 h-3 fill-black" />
                    <span>Destaque da Rádio</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-xs font-bold`}>
                      {msg.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {msg.author}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {msg.city}
                        </span>
                        <span>•</span>
                        <span>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onLikeMessage(msg.id)}
                    className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                      msg.hasLiked
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Curtir recado"
                  >
                    <Heart className={`w-3.5 h-3.5 ${msg.hasLiked ? 'fill-black' : ''}`} />
                    <span className="text-xs font-mono font-bold">{msg.likes}</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed pl-12">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
