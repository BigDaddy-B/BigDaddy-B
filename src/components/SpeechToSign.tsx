import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, FastForward, RotateCcw, AlertCircle, CheckCircle2, Globe, Heart, MessageSquarePlus } from 'lucide-react';
import { BlueMannequin } from './BlueMannequin';
import { parseTextToSignTokens, lookupSaslSign, SASL_DICTIONARY, REST_POSE } from '../lib/saslDictionary';
import { BodyKeyframe, TranslationToken, ConversationMessage } from '../types/sasl';

interface SpeechToSignProps {
  onNewMessage?: (msg: ConversationMessage) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (s: number) => void;
}

export const SpeechToSign: React.FC<SpeechToSignProps> = ({
  onNewMessage,
  speedMultiplier,
  setSpeedMultiplier,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingDetected, setIsSpeakingDetected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [activeGloss, setActiveGloss] = useState('');
  const [activeWord, setActiveWord] = useState('');
  const [isFingerspelling, setIsFingerspelling] = useState(false);
  const [activeTokens, setActiveTokens] = useState<TranslationToken[]>([]);
  const [currentKeyframes, setCurrentKeyframes] = useState<BodyKeyframe[]>([REST_POSE]);
  const [sttError, setSttError] = useState<string | null>(null);
  const [selectedAccent, setSelectedAccent] = useState<'en-ZA' | 'en-GB' | 'en-US'>('en-ZA');

  // References for Web Speech API & Web Audio
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Quick SASL & South African presets
  const quickPhrases = [
    { label: '👋 Sawubona (Hello)', text: 'Sawubona hello' },
    { label: '🙏 Ke a leboga (Thank you)', text: 'Thank you very much' },
    { label: '👌 Sharp Sharp (Good)', text: 'Sharp good' },
    { label: '❓ Kunjani? (How are you?)', text: 'How are you?' },
    { label: '🇿🇦 South Africa', text: 'South Africa' },
    { label: '🚑 Help / Doctor', text: 'Help emergency doctor' },
    { label: '🚕 Taxi Transport', text: 'Taxi transport' },
    { label: '❤️ Love (Uthando)', text: 'I love you' },
    { label: '💧 Water (Amanzi)', text: 'Water' },
    { label: '🧏 Deaf SASL', text: 'Deaf sign language' },
  ];

  // Process text into sign animation
  const handleTranslateText = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    // Use dictionary tokenizer & kinematics generator
    const { tokens, keyframes } = parseTextToSignTokens(textToProcess);

    setActiveTokens(tokens);
    setCurrentKeyframes(keyframes);
    if (tokens.length > 0) {
      setActiveGloss(tokens[0].gloss);
      setActiveWord(tokens[0].word);
      setIsFingerspelling(tokens[0].isFingerspelled);
    }

    // Call NLP glossing API for deeper semantic parsing in background if needed
    try {
      fetch('/api/parse-to-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess }),
      }).catch(() => {});
    } catch {}

    // Record conversation message
    if (onNewMessage) {
      onNewMessage({
        id: 'msg-' + Date.now(),
        sender: 'speaker',
        senderLabel: 'Spoken / Typed English',
        text: textToProcess,
        gloss: tokens.map((t) => t.gloss).join(' • '),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  // Start / Stop Microphone Voice Recognition
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = async () => {
    setSttError(null);

    // Initialize Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSttError('Web Speech Recognition is not supported in this browser. Please use text input or Chrome/Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedAccent; // 'en-ZA' South African English
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentSpeech = (finalTranscript || interimTranscript).trim();
        if (currentSpeech) {
          setInputText(currentSpeech);
          handleTranslateText(currentSpeech);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setSttError('Microphone access was denied. Please allow microphone permission in browser settings.');
          stopListening();
        }
      };

      recognition.onend = () => {
        if (isListening) {
          // Restart if still marked as listening
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();

      // Setup Web Audio Analyser for glowing blue gradient voice reactivity
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStreamRef.current = stream;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((average / 128) * 100));

          setAudioLevel(normalized);
          setIsSpeakingDetected(normalized > 12);

          animationFrameRef.current = requestAnimationFrame(checkAudioVolume);
        };

        checkAudioVolume();
      } catch (audioErr) {
        console.warn('Microphone volume visualizer note:', audioErr);
      }
    } catch (err: any) {
      setSttError(err.message || 'Could not start microphone');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setIsSpeakingDetected(false);
    setAudioLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((t) => t.stop());
      microphoneStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div id="speech-to-sign-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* LEFT / TOP: 3D Blue Mannequin Avatar */}
      <div className="lg:col-span-7 flex flex-col h-[480px] lg:h-[600px]">
        <BlueMannequin
          keyframeQueue={currentKeyframes}
          speedMultiplier={speedMultiplier}
          activeGloss={activeGloss}
          activeWord={activeWord}
          isFingerspelling={isFingerspelling}
        />
      </div>

      {/* RIGHT: Input Controls, Listening Indicator & Quick Phrases (Immersive UI Theme) */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-5 bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl">
        {/* Header with Language Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Voice Recognition
            </h3>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>

          {/* Accent selector (Default South African English) */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              id="accent-select"
              value={selectedAccent}
              onChange={(e) => setSelectedAccent(e.target.value as any)}
              className="bg-black/40 border border-white/10 text-blue-300 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-blue-500/50"
            >
              <option value="en-ZA">🇿🇦 South Africa (en-ZA)</option>
              <option value="en-GB">🇬🇧 British English</option>
              <option value="en-US">🇺🇸 Global English</option>
            </select>
          </div>
        </div>

        {/* IMMERSIVE VOICE RECOGNITION SPHERE & FREQUENCY INDICATOR */}
        <div
          id="listening-indicator-card"
          className="flex-1 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-black/30 border border-white/5 relative overflow-hidden"
        >
          {/* Central Pulsing Sphere with Mic */}
          <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center mb-3 relative group">
            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-25" />
            )}
            <button
              id="mic-toggle-btn"
              onClick={toggleListening}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-blue-600 text-white shadow-blue-500/40 ring-4 ring-blue-400/20'
                  : 'bg-white/10 hover:bg-white/15 text-blue-400'
              }`}
              title={isListening ? 'Stop Listening' : 'Start Live Voice Listening'}
            >
              <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse text-white' : 'text-blue-400'}`} />
            </button>
          </div>

          <p className="text-base sm:text-lg font-medium text-white mb-1">
            {isListening
              ? isSpeakingDetected
                ? 'Speech Detected...'
                : 'Listening to English...'
              : 'Tap Mic to Listen'}
          </p>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {isListening
              ? 'Speak clearly in South African English accent for direct SASL translation.'
              : 'Continuous voice recognition enabled with en-ZA profile.'}
          </p>

          {/* Real-time Waveform Bars */}
          {isListening && (
            <div className="flex items-center gap-1 mt-3 h-6 px-3 bg-black/40 rounded-full border border-white/10">
              {[0.4, 0.8, 1.2, 0.9, 0.5, 1.1, 0.7].map((scale, idx) => {
                const barHeight = Math.max(
                  4,
                  Math.min(22, (audioLevel * scale * 0.4) + (isSpeakingDetected ? 8 : 2))
                );
                return (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-blue-400 transition-all duration-75"
                    style={{ height: `${barHeight}px` }}
                  />
                );
              })}
            </div>
          )}

          {sttError && (
            <div className="mt-2 p-2 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
              <span>{sttError}</span>
            </div>
          )}
        </div>

        {/* MANUAL TEXT INPUT SECTION */}
        <div className="border-t border-white/5 pt-3 space-y-2">
          <label htmlFor="text-input-field" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block">
            Manual Text Input
          </label>
          <div className="relative">
            <input
              id="text-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTranslateText(inputText);
              }}
              placeholder="Type a phrase to sign (e.g. Sawubona, Sharp Sharp)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600 transition"
            />
            <button
              id="translate-text-btn"
              onClick={() => handleTranslateText(inputText)}
              disabled={!inputText.trim()}
              className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition shadow-md shadow-blue-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Parsed Tokens Feed */}
        {activeTokens.length > 0 && (
          <div className="p-3 bg-black/40 rounded-xl border border-white/10">
            <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Parsed SASL Sequence:</span>
              <span className="text-blue-400">{activeTokens.length} Tokens</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeTokens.map((tok, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium border transition ${
                    tok.isFingerspelled
                      ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                      : 'bg-blue-950/60 border-blue-500/40 text-blue-200'
                  }`}
                >
                  {tok.gloss}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* QUICK SASL PRESETS */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Quick SASL Phrases:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            {quickPhrases.map((phrase, idx) => (
              <button
                key={idx}
                id={`quick-phrase-${idx}`}
                onClick={() => {
                  setInputText(phrase.text);
                  handleTranslateText(phrase.text);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition flex items-center gap-1"
              >
                {phrase.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Adjustment Bar */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-300 text-xs">
            <FastForward className="w-3.5 h-3.5 text-blue-400" />
            Playback Speed:
          </span>
          <div className="flex items-center gap-1">
            {[0.5, 0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                id={`speed-${speed}-btn`}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  speedMultiplier === speed
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-black/40 hover:bg-white/10 text-slate-400'
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
