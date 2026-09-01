/**
 * Synaera-SA: Accessible SASL Bridge
 * Open-Source Non-Profit South African Sign Language (SASL) Dual-Directional Translator
 * @license Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Info, MoreVertical } from 'lucide-react';
import { TranslationMode, ConversationMessage } from './types/sasl';
import { MODE_BY_ID } from './lib/modes';
import { SpeechToSign } from './components/SpeechToSign';
import { TextToSign } from './components/TextToSign';
import { SignToSpeech } from './components/SignToSpeech';
import { DualConversationView } from './components/DualConversationView';
import { SaslDictionaryModal } from './components/SaslDictionaryModal';
import { AboutModal } from './components/AboutModal';
import { ModeBottomBar, ModeTabs } from './components/ModeNav';
import { HelpBanner } from './components/HelpBanner';

export default function App() {
  // Opens on Type → Sign deliberately: it needs no camera or microphone, so a
  // first-time user sees the avatar working before the browser asks them to
  // grant anything. The camera modes are one tap away.
  const [activeMode, setActiveMode] = useState<TranslationMode>('text-to-sign');
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: 'welcome-1',
      sender: 'system',
      senderLabel: 'Synaera-SA',
      text: 'Sawubona! Sign, speak or type to start translating.',
      gloss: 'SAWUBONA • WELCOME',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [isDictOpen, setIsDictOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close the overflow menu on an outside click or Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const handleNewMessage = (msg: ConversationMessage) => {
    setMessages((prev) => [msg, ...prev.slice(0, 49)]);
  };

  const openDictionary = () => {
    setIsDictOpen(true);
    setIsMenuOpen(false);
  };

  const openAbout = () => {
    setIsAboutOpen(true);
    setIsMenuOpen(false);
  };

  const currentMode = MODE_BY_ID[activeMode];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans bg-radial-immersive selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 shadow-lg shadow-blue-500/20">
              <svg className="h-4.5 w-4.5 text-white" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="truncate text-base font-bold leading-tight tracking-tight text-white">
                Synaera<span className="text-blue-400">-SA</span>
              </div>
              {/* The current mode doubles as a "you are here" marker on mobile,
                  where the tabs live at the bottom of the screen. */}
              <div className="flex items-center gap-1.5 text-[11px] leading-tight text-slate-400">
                <span className="relative inline-block h-2.5 w-4 shrink-0 overflow-hidden rounded-[2px] bg-[#007A4D]">
                  <span className="absolute inset-x-0 top-0 h-1/3 bg-[#E23D28]" />
                  <span className="absolute inset-x-0 bottom-0 h-1/3 bg-[#002395]" />
                </span>
                <span className="truncate lg:hidden">{currentMode?.label ?? 'SASL'}</span>
                <span className="hidden truncate lg:inline">South African Sign Language</span>
              </div>
            </div>
          </div>

          <ModeTabs activeMode={activeMode} onChange={setActiveMode} />

          {/* Secondary actions: spelled out on desktop, folded into a menu on mobile
              so they never compete with the primary navigation. */}
          <div className="flex items-center gap-2">
            <button
              id="header-dictionary-btn"
              onClick={openDictionary}
              className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              <span>Dictionary</span>
            </button>

            <button
              id="header-about-btn"
              onClick={openAbout}
              className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
            >
              <Info className="h-3.5 w-3.5" />
              <span>About</span>
            </button>

            <div className="relative sm:hidden" ref={menuRef}>
              <button
                id="header-menu-btn"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                >
                  <button
                    role="menuitem"
                    onClick={openDictionary}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    SASL dictionary
                  </button>
                  <button
                    role="menuitem"
                    onClick={openAbout}
                    className="flex w-full items-center gap-2.5 border-t border-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    <Info className="h-4 w-4 text-slate-400" />
                    About this project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom padding clears the fixed mobile tab bar. */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-4 pb-24 sm:p-6 lg:justify-center lg:pb-6">
        <HelpBanner mode={activeMode} />

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

      <ModeBottomBar activeMode={activeMode} onChange={setActiveMode} />

      <SaslDictionaryModal isOpen={isDictOpen} onClose={() => setIsDictOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
