/**
 * Synaera-SA — 2D SASL avatar.
 *
 * A half-body, non-gendered blue signer drawn as scalable vector art. It reads
 * exactly the same `BodyKeyframe` stream as the rest of the app: joint angles in
 * radians, which map naturally onto nested SVG rotate transforms.
 *
 * 2D rather than 3D on purpose. This app is for clinics, schools and phones in
 * South Africa, and a WebGL scene is the heaviest thing it could possibly ask a
 * cheap Android device to do. Vector art renders instantly, stays sharp at any
 * size, needs no GPU, and cannot fail to a black canvas.
 *
 * The angle mappings below are calibrated against the actual range of values in
 * the sign dictionary (shoulderX 0.10–0.85, shoulderZ -0.20–0.70,
 * elbowX 0.20–1.70), not guessed, so the full sweep of the vocabulary uses the
 * full sweep of the drawing.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, ZoomIn } from 'lucide-react';
import { ArmPose, BodyKeyframe } from '../types/sasl';
import { REST_POSE } from '../lib/saslDictionary';

interface FlatMannequinProps {
  currentKeyframe?: BodyKeyframe;
  keyframeQueue?: BodyKeyframe[];
  isPlaying?: boolean;
  onSequenceComplete?: () => void;
  speedMultiplier?: number;
  activeGloss?: string;
  activeWord?: string;
  isFingerspelling?: boolean;
}

/* ------------------------------------------------------------------ *
 * Pose interpolation
 * ------------------------------------------------------------------ */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ease-in-out: signing has weight, it does not snap between positions. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function lerpArm(a: ArmPose, b: ArmPose, t: number): ArmPose {
  return {
    shoulderX: lerp(a.shoulderX, b.shoulderX, t),
    shoulderY: lerp(a.shoulderY, b.shoulderY, t),
    shoulderZ: lerp(a.shoulderZ, b.shoulderZ, t),
    elbowX: lerp(a.elbowX, b.elbowX, t),
    elbowY: lerp(a.elbowY, b.elbowY, t),
    wristX: lerp(a.wristX, b.wristX, t),
    wristY: lerp(a.wristY, b.wristY, t),
    wristZ: lerp(a.wristZ, b.wristZ, t),
    thumb: lerp(a.thumb, b.thumb, t),
    index: lerp(a.index, b.index, t),
    middle: lerp(a.middle, b.middle, t),
    ring: lerp(a.ring, b.ring, t),
    pinky: lerp(a.pinky, b.pinky, t),
    fingerSpread: lerp(a.fingerSpread ?? 0.2, b.fingerSpread ?? 0.2, t),
  };
}

function lerpKeyframe(a: BodyKeyframe, b: BodyKeyframe, t: number): BodyKeyframe {
  return {
    durationMs: b.durationMs,
    head: {
      rotX: lerp(a.head.rotX, b.head.rotX, t),
      rotY: lerp(a.head.rotY, b.head.rotY, t),
      rotZ: lerp(a.head.rotZ, b.head.rotZ, t),
    },
    torso: {
      leanX: lerp(a.torso.leanX, b.torso.leanX, t),
      leanY: lerp(a.torso.leanY, b.torso.leanY, t),
    },
    leftArm: lerpArm(a.leftArm, b.leftArm, t),
    rightArm: lerpArm(a.rightArm, b.rightArm, t),
    facialExpression: t > 0.5 ? b.facialExpression : a.facialExpression,
    mouthMorpheme: t > 0.5 ? b.mouthMorpheme : a.mouthMorpheme,
  };
}

/* ------------------------------------------------------------------ *
 * Radians -> screen degrees
 * ------------------------------------------------------------------ */

/** How far the upper arm swings away from hanging straight down. */
const armSwingDeg = (arm: ArmPose) =>
  8 + (arm.shoulderZ + 0.2) * 70 + (arm.shoulderX - 0.1) * 60;

/** Elbow flexion; near-straight at rest, ~105 degrees fully folded. */
const elbowBendDeg = (arm: ArmPose) => 8 + (arm.elbowX - 0.2) * 65;

const wristTurnDeg = (arm: ArmPose) => arm.wristZ * 40 + arm.wristX * 25;

/* ------------------------------------------------------------------ *
 * Hand
 * ------------------------------------------------------------------ */

/**
 * A limb segment drawn as a tapered, slightly bulged capsule rather than a
 * rectangle — muscle is thicker near the joint it hangs from and narrows toward
 * the next one, which is most of what separates a body from a set of sticks.
 */
function limbPath(len: number, topWidth: number, bottomWidth: number, bulge = 1.14): string {
  const t = topWidth / 2;
  const b = bottomWidth / 2;
  const out = t * bulge;
  return [
    `M ${-t} 0`,
    `Q ${-out} ${len * 0.42} ${-b} ${len}`,
    `Q 0 ${len + b} ${b} ${len}`,
    `Q ${out} ${len * 0.42} ${t} 0`,
    `Q 0 ${-t * 0.75} ${-t} 0 Z`,
  ].join(' ');
}

/** One finger: two tapered segments that fold over the palm as `curl` rises. */
const Finger: React.FC<{
  x: number;
  length: number;
  curl: number;
  splayDeg: number;
  width?: number;
}> = ({ x, length, curl, splayDeg, width = 3.6 }) => {
  const first = length * 0.56;
  const second = length * 0.44;
  // 0 = extended, 1 = folded into a fist.
  const knuckle = curl * 92;
  const midJoint = curl * 88;

  return (
    <g transform={`translate(${x},0) rotate(${splayDeg})`}>
      <g transform={`rotate(${knuckle})`}>
        <path d={limbPath(first, width, width * 0.88, 1.06)} fill="url(#limb)" />
        <g transform={`translate(0,${first}) rotate(${midJoint})`}>
          <path d={limbPath(second, width * 0.88, width * 0.74, 1.04)} fill="url(#limbLight)" />
        </g>
      </g>
    </g>
  );
};

/**
 * The hand: a palm that is wider at the knuckles than the wrist, with the thumb
 * hinged off the side of the palm where the web of the hand actually sits.
 */
const Hand: React.FC<{ arm: ArmPose }> = ({ arm }) => {
  const spread = arm.fingerSpread ?? 0.2;
  const splay = spread * 16;

  return (
    <g>
      {/* Palm — narrow at the wrist, broad at the knuckles. */}
      <path
        d="M -7 -1 Q -9.6 8 -8.6 15.5 Q 0 18.4 8.6 15.5 Q 9.6 8 7 -1 Q 0 -3.4 -7 -1 Z"
        fill="url(#limb)"
      />

      {/* Thumb, hinged at the web rather than pinned to the wrist. */}
      <g transform={`translate(-7.6,5.5) rotate(${-54 + arm.thumb * 64})`}>
        <path d={limbPath(8, 4.6, 4, 1.1)} fill="url(#limb)" />
        <g transform={`translate(0,8) rotate(${arm.thumb * 56})`}>
          <path d={limbPath(6.4, 4, 3.4, 1.05)} fill="url(#limbLight)" />
        </g>
      </g>

      <g transform="translate(0,14.5)">
        <Finger x={-6.1} length={15} curl={arm.index} splayDeg={-splay} />
        <Finger x={-2.05} length={16.6} curl={arm.middle} splayDeg={-splay * 0.3} />
        <Finger x={2.05} length={15.2} curl={arm.ring} splayDeg={splay * 0.5} />
        <Finger x={6.0} length={12.4} curl={arm.pinky} splayDeg={splay * 1.2} width={3.2} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ *
 * Arm chain
 * ------------------------------------------------------------------ */

const UPPER_ARM = 50;
const FOREARM = 44;

/**
 * @param side -1 for the arm on the viewer's left (the signer's right), which
 *             swings outward under a positive SVG rotation; +1 mirrors it.
 */
const Arm: React.FC<{ arm: ArmPose; x: number; y: number; side: -1 | 1 }> = ({ arm, x, y, side }) => {
  const swing = armSwingDeg(arm) * -side;
  const bend = elbowBendDeg(arm) * -side;
  const wrist = wristTurnDeg(arm) * -side;

  return (
    <g transform={`translate(${x},${y})`}>
      <g transform={`rotate(${swing})`}>
        {/* Deltoid, then a bicep that narrows into the elbow. */}
        <path d={limbPath(UPPER_ARM, 15, 10.5, 1.2)} fill="url(#limb)" />
        <ellipse cx={0} cy={1} rx={8.6} ry={9.4} fill="url(#joint)" />

        <g transform={`translate(0,${UPPER_ARM}) rotate(${bend})`}>
          <circle cx={0} cy={0} r={5.6} fill="url(#joint)" opacity={0.85} />
          {/* Forearm: full at the elbow, tapering to a narrow wrist. */}
          <path d={limbPath(FOREARM, 11, 7.4, 1.16)} fill="url(#limbLight)" />

          <g transform={`translate(0,${FOREARM}) rotate(${wrist})`}>
            <Hand arm={arm} />
          </g>
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export const FlatMannequin: React.FC<FlatMannequinProps> = ({
  currentKeyframe,
  keyframeQueue = [],
  isPlaying = true,
  onSequenceComplete,
  speedMultiplier = 1,
  activeGloss,
  activeWord,
  isFingerspelling = false,
}) => {
  const [pose, setPose] = useState<BodyKeyframe>(currentKeyframe ?? REST_POSE);
  const [paused, setPaused] = useState(false);
  const [zoomHands, setZoomHands] = useState(false);

  const queue = useMemo(
    () => (keyframeQueue.length ? keyframeQueue : currentKeyframe ? [currentKeyframe] : [REST_POSE]),
    [keyframeQueue, currentKeyframe],
  );

  const fromRef = useRef<BodyKeyframe>(REST_POSE);
  const indexRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // Restart the sequence whenever a new one arrives.
  useEffect(() => {
    fromRef.current = pose;
    indexRef.current = 0;
    startRef.current = performance.now();
    doneRef.current = false;
    // `pose` is intentionally read, not depended on: including it would restart
    // the animation on every interpolated frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  useEffect(() => {
    if (paused || !isPlaying) return;

    const tick = () => {
      const target = queue[indexRef.current];
      if (!target) {
        if (!doneRef.current) {
          doneRef.current = true;
          onSequenceComplete?.();
        }
        return;
      }

      const duration = Math.max(80, (target.durationMs || 400) / Math.max(0.25, speedMultiplier));
      const elapsed = performance.now() - startRef.current;
      const t = Math.min(1, elapsed / duration);

      setPose(lerpKeyframe(fromRef.current, target, ease(t)));

      if (t >= 1) {
        fromRef.current = target;
        indexRef.current += 1;
        startRef.current = performance.now();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [queue, paused, isPlaying, speedMultiplier, onSequenceComplete]);

  const resetToRest = () => {
    fromRef.current = pose;
    indexRef.current = 0;
    startRef.current = performance.now();
    setPose(REST_POSE);
  };

  const { head, torso } = pose;
  const headTilt = head.rotZ * 120;
  const headNod = head.rotX * 14;
  const headTurn = head.rotY * 20;
  const lean = torso.leanX * 40;

  const smiling = pose.facialExpression === 'smile';

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-[#0a1330] shadow-2xl">
      {/* Controls */}
      <div className="pointer-events-none relative z-20 flex items-start justify-between gap-2 p-4">
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          SASL avatar
        </span>

        {isFingerspelling && (
          <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-200 backdrop-blur-md">
            Fingerspelling
          </span>
        )}

        <button
          onClick={() => setZoomHands((z) => !z)}
          className={`pointer-events-auto ml-auto flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition ${
            zoomHands
              ? 'border-blue-400/40 bg-blue-600 text-white'
              : 'border-white/10 bg-black/50 text-slate-300 hover:text-white'
          }`}
        >
          <ZoomIn className="h-3.5 w-3.5" />
          <span>Hands</span>
        </button>
      </div>

      {/* Avatar */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
        <svg
          viewBox={zoomHands ? '45 95 210 145' : '0 0 300 245'}
          className="h-full w-full transition-all duration-500"
          role="img"
          aria-label={activeGloss ? `Avatar signing ${activeGloss}` : 'SASL avatar at rest'}
        >
          <defs>
            <linearGradient id="limb" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="limbLight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="torso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <radialGradient id="joint">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
            <radialGradient id="headFill" cx="0.4" cy="0.35">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
          </defs>

          <g transform={`translate(${torso.leanY * 30},0) rotate(${lean} 150 230)`}>
            <g className="avatar-breathe">
              {/* Torso: shoulders slope out of the neck along the trapezius,
                  the ribcage is widest at the chest, and it draws in at the
                  waist. Deliberately non-gendered — no chest or hip shaping. */}
              <path
                d="M150 91
                   C 170 91 185 97 191 111
                   C 194 133 191 162 186 190
                   C 183 208 180 222 178 233
                   L 122 233
                   C 120 222 117 208 114 190
                   C 109 162 106 133 109 111
                   C 115 97 130 91 150 91 Z"
                fill="url(#torso)"
              />
              {/* Collarbone hollow and a soft sternum shadow give the flat
                  shape some depth without any extra geometry. */}
              <path d="M126 101 Q150 113 174 101 Q150 121 126 101 Z" fill="#1e3a8a" opacity="0.55" />
              <path d="M150 118 L150 172" stroke="#1e3a8a" strokeWidth="3" opacity="0.3" strokeLinecap="round" />

              {/* Neck, with the sternocleidomastoid line rather than a plain tube. */}
              <path d="M139 74 Q141 91 131 99 Q150 105 169 99 Q159 91 161 74 Z" fill="#1d4ed8" />
              <path d="M139 74 Q141 91 131 99 Q150 103 150 103 Q146 88 146 74 Z" fill="#1e3a8a" opacity="0.35" />
            </g>

            {/* Head */}
            <g transform={`translate(${headTurn},${headNod}) rotate(${headTilt} 150 56)`}>
              {/* Ears */}
              <ellipse cx={121} cy={54} rx={4.4} ry={7} fill="#2563eb" />
              <ellipse cx={179} cy={54} rx={4.4} ry={7} fill="#2563eb" />

              {/* Cranium tapering to a jaw and chin. */}
              <path
                d="M150 20
                   C 168 20 178 33 178 50
                   C 178 62 174 72 166 79
                   C 160 84 155 86 150 86
                   C 145 86 140 84 134 79
                   C 126 72 122 62 122 50
                   C 122 33 132 20 150 20 Z"
                fill="url(#headFill)"
              />

              {/* Brows carry most of the expression. */}
              <path
                d={smiling ? 'M136 40 Q141 37.5 146 39' : 'M136 40.5 Q141 39 146 40'}
                stroke="#0f172a"
                strokeWidth={1.9}
                fill="none"
                strokeLinecap="round"
                opacity={0.75}
              />
              <path
                d={smiling ? 'M154 39 Q159 37.5 164 40' : 'M154 40 Q159 39 164 40.5'}
                stroke="#0f172a"
                strokeWidth={1.9}
                fill="none"
                strokeLinecap="round"
                opacity={0.75}
              />

              {/* Eyes blink on their own — the single cheapest cue that
                  something is alive rather than a diagram. */}
              <g className="avatar-blink">
                <ellipse cx={140.5} cy={49} rx={3.4} ry={4.2} fill="#0f172a" />
                <circle cx={141.6} cy={47.6} r={1.15} fill="#e0f2fe" opacity={0.9} />
              </g>
              <g className="avatar-blink">
                <ellipse cx={159.5} cy={49} rx={3.4} ry={4.2} fill="#0f172a" />
                <circle cx={160.6} cy={47.6} r={1.15} fill="#e0f2fe" opacity={0.9} />
              </g>

              {/* Nose: a shadow line, not an outline. */}
              <path d="M150 54 Q152.4 60 149.4 62.4" stroke="#1e3a8a" strokeWidth={1.7} fill="none" strokeLinecap="round" opacity={0.6} />

              {/* Mouth. SASL grammar lives partly in the face, so expression is
                  driven by the keyframe rather than fixed. */}
              {smiling ? (
                <path d="M141 68 Q150 75.5 159 68" stroke="#0f172a" strokeWidth={2.1} fill="none" strokeLinecap="round" />
              ) : (
                <path d="M143 69 Q150 70.8 157 69" stroke="#0f172a" strokeWidth={2.1} fill="none" strokeLinecap="round" />
              )}
            </g>

            {/* Arms last so the hands read above the torso, as when signing. */}
            <Arm arm={pose.rightArm} x={114} y={112} side={-1} />
            <Arm arm={pose.leftArm} x={186} y={112} side={1} />
          </g>
        </svg>
      </div>

      {/* Caption */}
      {(activeGloss || activeWord) && (
        <div className="relative z-20 mx-4 mb-3 rounded-2xl border border-blue-400/20 bg-blue-950/50 px-4 py-3 backdrop-blur-md">
          {activeWord && <p className="text-[11px] italic text-slate-400">Input detected: “{activeWord}”</p>}
          <p className="text-lg font-semibold tracking-wide text-white">{activeGloss || activeWord}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="relative z-20 flex items-center justify-between gap-3 border-t border-white/10 bg-black/40 px-4 py-3 text-xs text-slate-300 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <button
            id="toggle-playback-btn"
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
          >
            {paused ? <Play className="h-3.5 w-3.5 fill-white" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{paused ? 'Play' : 'Pause'}</span>
          </button>

          <button
            id="reset-pose-btn"
            onClick={resetToRest}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition hover:bg-white/10"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>

        <span className="text-[11px] text-blue-300/80">{speedMultiplier}x</span>
      </div>
    </div>
  );
};
