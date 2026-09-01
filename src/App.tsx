/**
 * Synaera-SA: Accessible SASL Bridge
 * Open-Source Non-Profit South African Sign Language (SASL) Dual-Directional Translator
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  Mic,
  Camera,
  MessageSquare,
  BookOpen,
  Info,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Sliders,
  Layers,
  HelpCircle,
  Flag,
  Share2,
} from 'lucide-react';
import { TranslationMode, ConversationMessage, SaslSign } from './types/sasl';
import { SpeechToSign } from './components/SpeechToSign';
import { TextToSign } from './components/TextToSign';
import { SignToSpeech } from './components/SignToSpeech';
import { DualConversationView } from './components/DualConversationView';
import { SaslDictionaryModal } from './components/SaslDictionaryModal';
import { AboutModal } from './components/AboutModal';

/**
 * The four ways inuse. Labels are kept to two or three words: the previous
 * versions ("Voice / Text → Sign (3D Avatar)") made the header read as a wall
 * of text, which is the opposite of what a first-time user needs.
 */
const MODES: Array<{ id: TranslationMode; label: string; hint: string; Icon: typeof Mic }> = [
  {
    id: 'sign-to-voice',
    label: 'Sign → Voice',
    hint: 'Sign to the camera and hear it spoken in English',
    Icon: Camera,
  },
  {
    id: 'speech-to-sign',
    label: 'Speak → Sign',
    hint: 'Speak English and watch it signed by the avatar',
    Icon: Mic,
  },
  {
    id: 'text-to-sign',
    label: 'Type → Sign',
    hint: 'Type English and watch it signed by the avatar',
    Icon: MessageSquare,
  },
  {
    id: 'dual-split',
    label: 'Conversation',
    hint: 'Both directions side by side for a live conversation',
    Icon: Layers,
  },
];

export default function App() {
  const [activeMode, setActiveMode] = useState<TranslationMode>('sign-to-voice');
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: 'welcome-1',
      sender: 'system',
      senderLabel: 'Synaera-SA System',
      text: 'Sawubona! Welcome to the Synaera-SA Accessible SASL Bridge. Speak, type, or sign to begin real-time translation.',
      gloss: 'SAWUBONA • WELCOME • SASL • SOUTH AFRICA',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [isDictOpen, setIsDictOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  const handleNewMessage = (msg: ConversationMessage) => {
    setMessages((prev) => [msg, ...prev.slice(0, 49)]);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans select-none bg-radial-immersive selection:bg-blue-600 selection:text-white">
      {/* TOP HEADER - IMMERSIVE UI */}
      <header className="sticky top-0 z-40 h-16 px-4 sm:px-8 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Logo & National Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Synaera<span className="text-blue-400">-SA</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">
                SASL Bridge • Non-Profit
              </span>
            </div>

            {/* South African Flag Pill Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 ml-2">
              <div className="w-5 h-3 rounded-sm bg-[#007A4D] relative overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 w-full h-1/3 bg-[#E23D28]"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[#002395]"></div>
              </div>
              <span className="text-xs font-medium text-slate-300">South African Sign Language</span>
            </div>
          </div>

          {/* MODE SELECTOR — short labels so the choice reads at a glance */}
          <nav aria-label="Translation mode" className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shadow-lg overflow-x-auto">
            {MODES.map(({ id, label, hint, Icon }) => (
              <button
                key={id}
                id={`mode-${id}-btn`}
                onClick={() => setActiveMode(id)}
                aria-current={activeMode === id ? 'page' : undefined}
                title={hint}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeMode === id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop Right Utilities */}
          <div className="flex items-center gap-2">
            <button
              id="header-dictionary-btn"
              onClick={() => setIsDictOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">SASL Dictionary</span>
            </button>

            <button
              id="header-about-btn"
              onClick={() => setIsAboutOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition shadow-sm"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">About</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {activeMode === 'speech-to-sign' && (
          <SpeechToSign
            onNewMessage={handleNewMessage}
            speedMultiplier={speedMultiplier}
            setSpeedMultiplier={setSpeedMultiplier}
          />
        )}

        {activeMode === 'text-to-sign' && (
          <TextToSign
            onNewMessage={handleNewMessage}
            speedMultiplier={speedMultiplier}
            setSpeedMultiplier={setSpeedMultiplier}
          />
        )}

        {activeMode === 'sign-to-voice' && (
          <SignToSpeech
            onNewMessage={handleNewMessage}
            autoSpeak={autoSpeak}
            setAutoSpeak={setAutoSpeak}
          />
        )}

        {activeMode === 'dual-split' && (
          <DualConversationView
            messages={messages}
            onNewMessage={handleNewMessage}
            speedMultiplier={speedMultiplier}
            setSpeedMultiplier={setSpeedMultiplier}
            autoSpeak={autoSpeak}
            setAutoSpeak={setAutoSpeak}
          />
        )}
      </main>

      {/* BOTTOM ACCESSIBLE STATUS BAR - IMMERSIVE UI */}
      <footer className="h-12 bg-black/40 border-t border-white/5 px-4 sm:px-8 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SASL Official Language Pipeline Active (en-ZA)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-blue-500/80">Community Driven</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="hover:text-slate-300 transition uppercase tracking-[0.2em]"
          >
            Non-Profit License
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <SaslDictionaryModal
        isOpen={isDictOpen}
        onClose={() => setIsDictOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
