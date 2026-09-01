import React, { useState } from 'react';
import { BlueMannequin } from './BlueMannequin';
import { SignToSpeech } from './SignToSpeech';
import { SpeechToSign } from './SpeechToSign';
import { ConversationMessage } from '../types/sasl';
import { MessageSquare, Users, Sparkles, Volume2, Copy, Check } from 'lucide-react';

interface DualConversationViewProps {
  messages: ConversationMessage[];
  onNewMessage: (msg: ConversationMessage) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (s: number) => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
}

export const DualConversationView: React.FC<DualConversationViewProps> = ({
  messages,
  onNewMessage,
  speedMultiplier,
  setSpeedMultiplier,
  autoSpeak,
  setAutoSpeak,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="dual-conversation-view" className="flex flex-col gap-6 h-full">
      {/* Top Banner explaining bidirectional flow */}
      <div className="p-4 bg-gradient-to-r from-blue-900/30 via-slate-900/50 to-blue-950/40 rounded-2xl border border-white/10 flex items-center justify-between shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-400/30 text-blue-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Dual-Directional Real-Time Bridge (Signer ⇄ Speaker)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign into the camera on the left to speak out loud in English; speak/type on the right to animate the blue mannequin.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            Live Synchronous Bridge
          </span>
        </div>
      </div>

      {/* Split Grid: Left = Sign to Voice (Camera), Right = Voice/Text to Sign (Blue Mannequin) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Signer Side (Camera -> Voice Out) */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Signer Terminal (Camera → Spoken English)</span>
            </div>
            <span className="text-xs text-cyan-300 font-mono">Live TTS Audio Out</span>
          </div>

          <div className="flex-1">
            <SignToSpeech
              onNewMessage={onNewMessage}
              autoSpeak={autoSpeak}
              setAutoSpeak={setAutoSpeak}
            />
          </div>
        </div>

        {/* Speaker Side (Voice/Text -> Blue Mannequin 3D Rig) */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Speaker Terminal (Voice/Text → 3D Avatar)</span>
            </div>
            <span className="text-xs text-blue-300 font-mono">3D SASL Kinematics</span>
          </div>

          <div className="flex-1">
            <SpeechToSign
              onNewMessage={onNewMessage}
              speedMultiplier={speedMultiplier}
              setSpeedMultiplier={setSpeedMultiplier}
            />
          </div>
        </div>
      </div>

      {/* Synchronized Conversation Transcript Log */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Accessible Conversation Transcript</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{messages.length} Messages Recorded</span>
        </div>

        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 italic">
              No conversation messages yet. Begin signing into the camera or speaking into the microphone!
            </div>
          ) : (
            messages.map((msg) => {
              const isSigner = msg.sender === 'signer';
              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 transition ${
                    isSigner
                      ? 'bg-cyan-950/20 border-cyan-500/20 text-slate-200 ml-0 mr-12'
                      : 'bg-blue-950/20 border-blue-500/20 text-slate-200 ml-12 mr-0'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isSigner ? 'text-cyan-400' : 'text-blue-400'
                        }`}
                      >
                        {msg.senderLabel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                      {msg.confidence && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                          {Math.round(msg.confidence * 100)}% match
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-white">{msg.text}</div>
                    {msg.gloss && (
                      <div className="text-xs font-mono text-slate-400">
                        SASL Gloss: <span className="text-blue-300">{msg.gloss}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
