/**
 * Synaera-SA — Text to SASL.
 *
 * Type English, watch it signed by the blue mannequin. Deliberately the
 * simplest screen in the app: one box, one button, one avatar. It is the
 * fallback that always works — no microphone, no camera, no permissions — which
 * matters on shared or borrowed devices.
 */

import React, { useMemo, useState } from 'react';
import { Send, Sparkles, FastForward, Type, Eraser } from 'lucide-react';
import { BlueMannequin } from './BlueMannequin';
import { parseTextToSignTokens, REST_POSE } from '../lib/saslDictionary';
import { BodyKeyframe, ConversationMessage, TranslationToken } from '../types/sasl';

interface TextToSignProps {
  onNewMessage?: (msg: ConversationMessage) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (s: number) => void;
}

const QUICK_PHRASES = [
  { label: '👋 Sawubona', text: 'Sawubona hello' },
  { label: '🙏 Thank you', text: 'Thank you' },
  { label: '👌 Sharp sharp', text: 'Sharp good' },
  { label: '❓ How are you?', text: 'How are you' },
  { label: '🇿🇦 South Africa', text: 'South Africa' },
  { label: '🚑 I need help', text: 'Help emergency' },
  { label: '❤️ I love you', text: 'I love you' },
  { label: '💧 Water', text: 'Water' },
];

export const TextToSign: React.FC<TextToSignProps> = ({
  onNewMessage,
  speedMultiplier,
  setSpeedMultiplier,
}) => {
  const [inputText, setInputText] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { tokens, keyframes } = useMemo<{ tokens: TranslationToken[]; keyframes: BodyKeyframe[] }>(
    () => (submitted ? parseTextToSignTokens(submitted) : { tokens: [], keyframes: [REST_POSE] }),
    [submitted],
  );

  const translate = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInputText(trimmed);
    setSubmitted(trimmed);

    const { tokens: parsed } = parseTextToSignTokens(trimmed);
    onNewMessage?.({
      id: `msg-${Date.now()}`,
      sender: 'speaker',
      senderLabel: 'Typed English',
      text: trimmed,
      gloss: parsed.map((t) => t.gloss).join(' • '),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const fingerspelledCount = tokens.filter((t) => t.isFingerspelled).length;

  return (
    <div id="text-to-sign-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Avatar */}
      <div className="lg:col-span-7 flex flex-col h-[480px] lg:h-[600px]">
        <BlueMannequin
          keyframeQueue={keyframes}
          speedMultiplier={speedMultiplier}
          activeGloss={tokens[0]?.gloss ?? ''}
          activeWord={tokens[0]?.word ?? ''}
          isFingerspelling={tokens[0]?.isFingerspelled ?? false}
        />
      </div>

      {/* Controls */}
      <div className="lg:col-span-5 flex flex-col gap-5 bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Type to sign</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-mono text-cyan-300">
            SASL
          </span>
        </div>

        <div className="space-y-2">
          <label htmlFor="text-to-sign-input" className="text-xs text-slate-400">
            Write in English. The mannequin signs it back in SASL.
          </label>

          <textarea
            id="text-to-sign-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter makes a new line.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                translate(inputText);
              }
            }}
            rows={4}
            placeholder="e.g. Sawubona, how are you?"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600 transition resize-none"
          />

          <div className="flex items-center gap-2">
            <button
              id="text-to-sign-translate-btn"
              onClick={() => translate(inputText)}
              disabled={!inputText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-blue-500/20"
            >
              <Send className="w-4 h-4" />
              <span>Sign this</span>
            </button>

            <button
              id="text-to-sign-clear-btn"
              onClick={() => {
                setInputText('');
                setSubmitted('');
              }}
              disabled={!inputText && !submitted}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition disabled:opacity-30"
              title="Clear"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Parsed gloss */}
        {tokens.length > 0 && (
          <div className="p-3 bg-black/40 rounded-xl border border-white/10">
            <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1.5 flex items-center justify-between">
              <span>SASL gloss</span>
              <span className="text-blue-400">{tokens.length} signs</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((tok, idx) => (
                <span
                  key={`${tok.gloss}-${idx}`}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                    tok.isFingerspelled
                      ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                      : 'bg-blue-950/60 border-blue-500/40 text-blue-200'
                  }`}
                >
                  {tok.gloss}
                </span>
              ))}
            </div>
            {fingerspelledCount > 0 && (
              <p className="text-[10px] text-amber-300/70 mt-2">
                {fingerspelledCount} word{fingerspelledCount > 1 ? 's are' : ' is'} fingerspelled — no SASL sign for
                {fingerspelledCount > 1 ? ' them' : ' it'} in the dictionary yet.
              </p>
            )}
          </div>
        )}

        {/* Quick phrases */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Common phrases</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase.text}
                onClick={() => translate(phrase.text)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition"
              >
                {phrase.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <FastForward className="w-3.5 h-3.5 text-blue-400" />
            Signing speed
          </span>
          <div className="flex items-center gap-1">
            {[0.5, 0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  speedMultiplier === speed ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/40 hover:bg-white/10 text-slate-400'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
