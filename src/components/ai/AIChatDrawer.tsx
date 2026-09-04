import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Play, Radio, Volume2, Info, BookOpen } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import type { Station, PodcastEpisode } from '../../types';

interface MessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  stations?: Station[];
  sermons?: PodcastEpisode[];
  verses?: Array<{ reference: string; text: string }>;
  timestamp: string;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string, param?: string) => void;
}

export function AIChatDrawer({ isOpen, onClose, onNavigate }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your Christian Radios AI Discovery Assistant. How can I help you find radio stations, worship music, sermons, or prayer content today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playStation } = useAudioPlayer();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: MessageItem = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const aiMsg: MessageItem = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: data.data.message,
          stations: data.data.stations,
          sermons: data.data.sermons,
          verses: data.data.verses,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: MessageItem = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: data.error || 'AI assistance is temporarily unavailable. You can still browse and listen normally.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('[AIChatDrawer] Error sending message:', err);
      const errorMsg: MessageItem = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'Something went wrong. Please check your internet connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-950 border-l border-cyan-500/20 text-white flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">AI Radio Discovery Guide</h3>
              <p className="text-xs text-cyan-300">Grounded in Real Christian Content</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer banner */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>AI Assistant for discovery. Always test and verify scriptures directly in the Bible.</span>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-cyan-500/20 text-slate-200 rounded-bl-none shadow-lg'
                }`}
              >
                <p>{m.text}</p>

                {/* Verses if present */}
                {m.verses && m.verses.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs italic">
                    <p>{m.verses[0].text}</p>
                    <span className="block mt-1 font-bold not-italic text-[10px] text-amber-400">— {m.verses[0].reference}</span>
                  </div>
                )}

                {/* Stations if present */}
                {m.stations && m.stations.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Recommended Radio Stations ({m.stations.length})</span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {m.stations.slice(0, 4).map((st) => (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('station', st.slug || st.id);
                              onClose();
                            }
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={st.logoUrl}
                              alt={st.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="font-semibold text-xs text-white truncate">{st.name}</h5>
                              <p className="text-[10px] text-slate-400 truncate">{st.genre} • {st.city}, {st.countryCode}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => playStation(st)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 p-3 rounded-2xl bg-slate-900/60 w-fit">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finding the best Christian content...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything e.g. Find Swahili gospel stations..."
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AIAssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-2xl flex items-center gap-2 border border-cyan-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
    >
      <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
      <span>AI Guide</span>
    </button>
  );
}
