import React, { useState } from 'react';
import { FlatMannequin } from './FlatMannequin';
import { SignToSpeech } from './SignToSpeech';
import { SpeechToSign } from './SpeechToSign';
import { ConversationMessage } from '../types/sasl';
import { MessageSquare, Copy, Check } from 'lucide-react';

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
      {/* Split Grid: Left = Sign to Voice (Camera), Right = Voice/Text to Sign (Blue Mannequin) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Signer Side (Camera -> Voice Out) */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">Signing side</span>
            </div>
            <span className="text-[11px] text-cyan-300">Speaks out loud</span>
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
              <span className="text-sm font-semibold text-white">Speaking side</span>
            </div>
            <span className="text-[11px] text-blue-300">Signs on the avatar</span>
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
            <h3 className="text-sm font-semibold text-white">Transcript</h3>
          </div>
          <span className="text-[11px] text-slate-400">{messages.length} messages</span>
        </div>

        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 italic">
              Nothing yet — sign to the camera, or speak or type on the other side.
            </div>
          ) : (
            messages.map((msg) => {
              const isSigner = msg.sender === 'signer';
              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 transition ${
                    isSigner
                      ? 'bg-cyan-950/20 border-cyan-500/20 text-slate-200 sm:mr-12'
                      : 'bg-blue-950/20 border-blue-500/20 text-slate-200 sm:ml-12'
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
                        <span className="text-blue-300">{msg.gloss}</span>
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
