/**
 * Synaera-SA — Sign to spoken English.
 *
 * Tracks the signer's hands live with MediaPipe, recognises SASL signs on-device,
 * and speaks the English translation out loud.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  RefreshCw,
  FlipHorizontal,
  ShieldAlert,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { ConversationMessage } from '../types/sasl';
import { SIGN_TEMPLATES, type SignTemplate } from '../lib/signTemplates';
import { HAND_CONNECTIONS, LM } from '../lib/handFeatures';
import { useHandTracking } from '../hooks/useHandTracking';
import type { RecognisedSign } from '../lib/gestureRecognizer';

interface SignToSpeechProps {
  onNewMessage?: (msg: ConversationMessage) => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
}

interface Detection {
  gloss: string;
  english: string;
  confidence: number;
  time: string;
}

export const SignToSpeech: React.FC<SignToSpeechProps> = ({ onNewMessage, autoSpeak, setAutoSpeak }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /** What the user asked for; `cameraActive` is whether a stream is actually live. */
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  /** Bumped by "Try again" to re-run the camera effect when intent is unchanged. */
  const [retryCount, setRetryCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [lastSign, setLastSign] = useState<SignTemplate | null>(null);
  const [lastConfidence, setLastConfidence] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recent, setRecent] = useState<Detection[]>([]);
  const [practiceTarget, setPracticeTarget] = useState<SignTemplate | null>(null);
  const [panelTab, setPanelTab] = useState<'guide' | 'history'>('guide');

  /* ---------------------------------------------------------------- *
   * Speech synthesis
   * ---------------------------------------------------------------- */
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth || !text) return;

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Prefer a South African English voice, then any English voice.
    const voice =
      voicesRef.current.find((v) => v.lang.startsWith('en-ZA')) ??
      voicesRef.current.find((v) => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  }, []);

  /* ---------------------------------------------------------------- *
   * Camera
   * ---------------------------------------------------------------- */
  /**
   * The camera is driven declaratively from intent (`cameraOn`) rather than by
   * imperative start/stop calls.
   *
   * The imperative version raced itself: `getUserMedia` is async, so under
   * React's development double-mount the first call was still in flight when
   * cleanup stopped its tracks, and the two attempts collided into a spurious
   * "camera blocked" error. The same race hit any quick remount — switching
   * modes away and back. Here a cancelled attempt stops the stream it opened
   * and never touches state, so only the live attempt can win.
   */
  useEffect(() => {
    if (!cameraOn) {
      setCameraActive(false);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;

    (async () => {
      setCameraError(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (cancelled || !videoRef.current) return;

        videoRef.current.srcObject = stream;
        // play() rejects if the element is torn down mid-call; that is the
        // cancelled path and not worth surfacing.
        await videoRef.current.play().catch(() => {});
        if (cancelled) return;

        setCameraActive(true);
      } catch (err) {
        if (cancelled) return;
        console.error('[synaera] camera access failed', err);
        setCameraError('Camera access is blocked. Allow camera permission in your browser, then try again.');
        setCameraActive(false);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
      setCameraActive(false);
    };
  }, [cameraOn, facingMode, retryCount]);

  /* ---------------------------------------------------------------- *
   * Recognition
   * ---------------------------------------------------------------- */
  const handleSign = useCallback(
    (sign: RecognisedSign) => {
      setLastSign(sign.template);
      setLastConfidence(sign.confidence);

      const time = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setRecent((prev) =>
        [{ gloss: sign.template.gloss, english: sign.template.english, confidence: sign.confidence, time }, ...prev].slice(0, 6),
      );

      if (autoSpeak) speak(sign.template.english);

      onNewMessage?.({
        id: `msg-${sign.at}`,
        sender: 'signer',
        senderLabel: 'SASL signer (camera)',
        text: sign.template.english,
        gloss: sign.template.gloss,
        confidence: sign.confidence,
        regionalNote: sign.template.saContext,
        timestamp: time,
      });
    },
    [autoSpeak, speak, onNewMessage],
  );

  const { status, error, assetSource, frame, recognition, fps, resetRecognition } = useHandTracking({
    videoRef,
    enabled: cameraActive,
    onSign: handleSign,
  });

  /* ---------------------------------------------------------------- *
   * Skeleton overlay — draws the landmarks actually being tracked
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!cameraActive) return;

    // The video is mirrored on screen for the front camera, so the overlay has
    // to be mirrored to sit on top of the signer's real hands.
    const mirrored = facingMode === 'user';
    const px = (x: number) => (mirrored ? (1 - x) * w : x * w);
    const py = (y: number) => y * h;

    // Face anchor: shows the signer where the signing space is measured from.
    if (frame.face) {
      const fw = frame.face.width * w;
      const fh = frame.face.height * h;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(px(frame.face.cx) - fw / 2, py(frame.face.cy) - fh / 2, fw, fh);
      ctx.setLineDash([]);
    }

    frame.landmarks.forEach((hand, handIndex) => {
      const features = frame.features[handIndex];
      const confident = (recognition.candidate?.score ?? 0) > 0.68;
      const stroke = confident ? '#22d3ee' : '#3b82f6';

      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 8;

      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(px(hand[a].x), py(hand[a].y));
        ctx.lineTo(px(hand[b].x), py(hand[b].y));
        ctx.stroke();
      }

      // Fingertips are drawn larger when that finger reads as extended, so the
      // signer can see what the recogniser thinks their handshape is.
      const tips: Array<[number, number]> = [
        [LM.THUMB_TIP, features?.fingers.thumb ?? 0],
        [LM.INDEX_TIP, features?.fingers.index ?? 0],
        [LM.MIDDLE_TIP, features?.fingers.middle ?? 0],
        [LM.RING_TIP, features?.fingers.ring ?? 0],
        [LM.PINKY_TIP, features?.fingers.pinky ?? 0],
      ];

      hand.forEach((point, i) => {
        const tip = tips.find(([idx]) => idx === i);
        const radius = tip ? 3.5 + tip[1] * 4 : 3;
        ctx.fillStyle = tip && tip[1] > 0.6 ? '#a5f3fc' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(px(point.x), py(point.y), radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      // Label the hand with its handedness.
      if (features) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText(features.handedness, px(hand[LM.WRIST].x) - 12, py(hand[LM.WRIST].y) + 20);
      }
    });
  }, [frame, cameraActive, facingMode, recognition.candidate]);

  /* ---------------------------------------------------------------- *
   * Derived UI state
   * ---------------------------------------------------------------- */
  const handCount = recognition.handCount;
  const candidate = recognition.candidate;

  const statusLine = (() => {
    if (cameraError) return { text: 'Camera blocked', tone: 'error' as const };
    if (!cameraActive) return { text: 'Camera off', tone: 'idle' as const };
    if (status === 'loading') return { text: 'Loading recognition models…', tone: 'busy' as const };
    if (status === 'error') return { text: 'Recognition unavailable', tone: 'error' as const };
    if (handCount === 0) return { text: 'No hands detected — hold your hands up', tone: 'idle' as const };
    if (!candidate) return { text: `Tracking ${handCount === 2 ? 'both hands' : 'one hand'}…`, tone: 'busy' as const };
    return { text: `Reading “${candidate.template.gloss}” — hold it`, tone: 'good' as const };
  })();

  const toneClasses = {
    idle: 'bg-slate-500',
    busy: 'bg-blue-400',
    good: 'bg-emerald-400',
    error: 'bg-rose-500',
  };

  return (
    <div id="sign-to-speech-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* ---------------- Camera + live skeleton ---------------- */}
      <div className="lg:col-span-7 flex flex-col h-[360px] sm:h-[460px] lg:h-[600px] relative bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none z-0" />

        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Status bar */}
        <div className="absolute top-0 inset-x-0 z-20 p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
            <span
              className={`w-2 h-2 rounded-full ${toneClasses[statusLine.tone]} ${
                statusLine.tone === 'busy' ? 'animate-pulse' : ''
              }`}
            />
            <span className="text-[11px] font-semibold text-white">{statusLine.text}</span>
            {status === 'ready' && cameraActive && (
              <span className="text-[10px] font-mono text-slate-400 border-l border-white/15 pl-2 ml-1">
                {fps} fps
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="flip-camera-btn"
              onClick={() => setFacingMode((p) => (p === 'user' ? 'environment' : 'user'))}
              className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-slate-300 transition backdrop-blur-md shadow-lg"
              title="Switch camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              id="toggle-camera-btn"
              onClick={() => setCameraOn((on) => !on)}
              className={`p-2.5 rounded-xl border transition backdrop-blur-md shadow-lg ${
                cameraOn
                  ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/30'
                  : 'bg-rose-900/80 border-rose-700 text-rose-200'
              }`}
              title={cameraOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {cameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live caption + hold-to-confirm meter */}
        <div className="absolute bottom-16 left-6 right-6 z-20 pointer-events-none">
          <div className="bg-blue-950/50 backdrop-blur-xl p-4 rounded-2xl border border-blue-400/20 shadow-2xl">
            <div className="flex items-center justify-between text-[10px] font-mono text-blue-300 uppercase tracking-widest mb-1.5">
              <span>{candidate ? 'Recognising' : 'Waiting for a sign'}</span>
              {candidate && <span className="text-emerald-400">{Math.round(candidate.score * 100)}% match</span>}
            </div>

            <div className="text-xl font-semibold text-white tracking-wide">
              {candidate ? candidate.template.gloss : lastSign ? lastSign.gloss : '—'}
            </div>

            <div className="text-sm text-blue-100/85 italic mt-0.5 flex items-center gap-1.5">
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-cyan-300 animate-pulse' : 'text-blue-300'}`} />
              <span>{candidate ? candidate.template.english : lastSign ? `“${lastSign.english}”` : 'Hold a sign steady to translate'}</span>
            </div>

            {/* Fills as the sign is held — the sign fires when it completes. */}
            <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-[width] duration-75"
                style={{ width: `${Math.round(recognition.stability * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-6 py-3 bg-black/50 border-t border-white/10 backdrop-blur-md flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              id="speak-again-btn"
              onClick={() => lastSign && speak(lastSign.english)}
              disabled={!lastSign}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition disabled:opacity-40"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Say it again</span>
            </button>
            <button
              id="reset-recognition-btn"
              onClick={resetRecognition}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
              title="Clear the movement buffer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Reset</span>
            </button>
          </div>

          <button
            id="toggle-autospeak-btn"
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition border ${
              autoSpeak
                ? 'bg-blue-600/30 border-blue-400/40 text-blue-200'
                : 'bg-black/40 border-white/10 text-slate-400'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Voice {autoSpeak ? 'on' : 'off'}</span>
          </button>
        </div>

        {/* Loading / error overlays */}
        {cameraOn && status === 'loading' && (
          <div className="absolute inset-0 bg-slate-950/80 z-30 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm font-semibold text-white">Loading sign recognition…</p>
            <p className="text-xs text-slate-400">First run downloads the model. It is cached after that.</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6 text-center">
            <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Camera access needed</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">{cameraError}</p>
            <button
              onClick={() => {
                setCameraOn(true);
                setRetryCount((n) => n + 1);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'error' && !cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6 text-center">
            <ShieldAlert className="w-12 h-12 text-amber-500 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Recognition unavailable</h3>
            <p className="text-xs text-slate-400 max-w-sm">{error}</p>
          </div>
        )}
      </div>

      {/* ---------------- Right panel ---------------- */}
      <div className="lg:col-span-5 flex flex-col gap-4 lg:h-[600px] min-h-0 bg-white/5 rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        {/* Live status — the two things that are always worth seeing. */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            isSpeaking ? 'bg-blue-600/20 border-blue-400/40 shadow-lg shadow-blue-500/20' : 'bg-black/30 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 transition ${isSpeaking ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-400'}`}>
              <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {isSpeaking ? 'Speaking out loud…' : lastSign ? lastSign.english : 'Nothing translated yet'}
              </div>
              <div className="text-[11px] text-slate-400">
                {lastSign ? `${lastSign.gloss} · ${Math.round(lastConfidence * 100)}% match` : 'South African English voice'}
              </div>
            </div>
          </div>

          {lastSign && (
            <p className="mt-3 border-t border-white/10 pt-2.5 text-[11px] leading-snug text-cyan-300/90">
              {lastSign.saContext}
            </p>
          )}
        </div>

        {/* Compact tracking readout */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Hands', value: String(handCount), lit: handCount > 0 },
            { label: 'Movement', value: recognition.motion.type, lit: recognition.motion.type !== 'static' },
            { label: 'Position', value: frame.features[0]?.zone ?? '—', lit: Boolean(frame.features[0]) },
          ].map(({ label, value, lit }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
              <div className={`text-xs font-semibold capitalize ${lit ? 'text-cyan-300' : 'text-slate-500'}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs — the guide and the history used to stack into one long scroll. */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
          {([
            { id: 'guide', label: 'Signs I can read' },
            { id: 'history', label: `History${recent.length ? ` (${recent.length})` : ''}` },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              id={`panel-tab-${id}`}
              onClick={() => setPanelTab(id)}
              aria-current={panelTab === id ? 'true' : undefined}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
                panelTab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-[180px] flex-1 overflow-y-auto pr-1">
          {panelTab === 'guide' ? (
            <div className="space-y-2">
              {practiceTarget && (
                <div className="rounded-xl border border-blue-400/30 bg-blue-600/15 p-3 text-xs text-blue-100">
                  <div className="mb-0.5 font-bold text-cyan-300">{practiceTarget.gloss}</div>
                  <p className="leading-snug">{practiceTarget.tip}</p>
                </div>
              )}

              <p className="text-[11px] text-slate-500">Tap a sign to see how to form it.</p>

              <div className="grid grid-cols-2 gap-2">
                {SIGN_TEMPLATES.map((sign) => {
                  const isCandidate = candidate?.template.id === sign.id;
                  const isOpen = practiceTarget?.id === sign.id;
                  return (
                    <button
                      key={sign.id}
                      id={`practice-sign-${sign.id}`}
                      onClick={() => setPracticeTarget(isOpen ? null : sign)}
                      className={`group rounded-xl border p-2.5 text-left transition ${
                        isCandidate
                          ? 'border-cyan-400/50 bg-cyan-500/20'
                          : isOpen
                            ? 'border-blue-400/40 bg-blue-600/20'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                        <span className="truncate">{sign.gloss}</span>
                        <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                      </div>
                      <div className="truncate text-[10px] text-slate-400">{sign.english}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.length === 0 ? (
                <p className="p-4 text-center text-xs italic text-slate-500">
                  Signs read from your camera appear here and are spoken out loud.
                </p>
              ) : (
                recent.map((item, idx) => (
                  <div
                    key={`${item.time}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 p-2.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-mono font-bold text-blue-400">{item.gloss}</span>
                      <span className="truncate text-slate-300">“{item.english}”</span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">{item.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {assetSource && (
          <p className="border-t border-white/5 pt-2 text-center text-[10px] text-slate-600">
            Runs on your device — video never leaves this browser.
          </p>
        )}
      </div>
    </div>
  );
};
