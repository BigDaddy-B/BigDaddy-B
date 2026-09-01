/**
 * Synaera-SA — hand landmark feature extraction.
 *
 * Turns raw MediaPipe hand landmarks into the linguistic primitives SASL is
 * actually built from: handshape (which fingers are extended), orientation,
 * location in the signing space, and movement.
 *
 * Everything here is pure maths on landmark arrays — no model calls, no
 * network. That keeps recognition instant and private: video frames never
 * leave the device.
 */

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** MediaPipe hand landmark indices. */
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

/** Bone pairs for drawing the skeleton overlay. */
export const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

export interface FingerExtensions {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export type PointingDirection = 'up' | 'down' | 'side';

export type SigningZone = 'head' | 'face' | 'chin' | 'chest' | 'neutral' | 'low';

export interface FaceAnchor {
  /** Centre of the detected face, in normalised image coords. */
  cx: number;
  cy: number;
  width: number;
  height: number;
}

export interface HandFeatures {
  handedness: 'Left' | 'Right';
  /** Detector confidence for this hand. */
  score: number;
  /** Per-finger extension, 0 = fully curled, 1 = fully straight. */
  fingers: FingerExtensions;
  /** How many fingers read as clearly extended (>= 0.6). */
  extendedCount: number;
  /** Splay between the four fingers, 0 = together, 1 = wide. */
  spread: number;
  /** Direction the hand points in the image plane. */
  pointing: PointingDirection;
  /** Raw vertical component of the pointing vector (-1 = up, 1 = down). */
  pointingY: number;
  /** How squarely the palm faces the camera, 0 = edge-on/away, 1 = flat on. */
  palmToCamera: number;
  /** Wrist position in normalised image coords. */
  wrist: { x: number; y: number };
  /** Apparent hand size in image units — a rough proximity cue. */
  imageScale: number;
  /** Where the hand sits in the signing space. */
  zone: SigningZone;
  /** Vertical offset from face centre in face-heights (negative = above). */
  zoneY: number;
  /** Lateral offset from face centre in face-widths. */
  zoneX: number;
}

/* ------------------------------------------------------------------ *
 * Vector helpers
 * ------------------------------------------------------------------ */

const sub = (a: Point3, b: Point3): Point3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Point3, b: Point3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: Point3): number => Math.sqrt(dot(a, a)) || 1e-6;
const dist = (a: Point3, b: Point3): number => len(sub(a, b));

const cross = (a: Point3, b: Point3): Point3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Maps `v` from [lo, hi] onto [0, 1]. */
const ramp = (v: number, lo: number, hi: number): number => clamp01((v - lo) / (hi - lo || 1e-6));

/** Interior angle at `b` in the chain a-b-c, in radians. */
function angleAt(a: Point3, b: Point3, c: Point3): number {
  const u = sub(a, b);
  const v = sub(c, b);
  return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v)))));
}

/* ------------------------------------------------------------------ *
 * Handshape
 * ------------------------------------------------------------------ */

// Calibrated against measured joint geometry: a finger fully curled into a fist
// averages ~1.65 rad across its PIP and DIP joints, a straight one ~3.05.
// `npm run verify:recognizer` re-checks these against known handshapes.
const CURLED_RAD = 1.7;
const STRAIGHT_RAD = 3.0;

function fingerExtension(lms: Point3[], mcp: number, pip: number, dip: number, tip: number): number {
  const a1 = angleAt(lms[mcp], lms[pip], lms[dip]);
  const a2 = angleAt(lms[pip], lms[dip], lms[tip]);
  return ramp((a1 + a2) / 2, CURLED_RAD, STRAIGHT_RAD);
}

/**
 * The thumb needs its own treatment: it curls far less than the fingers, so
 * joint angle alone is ambiguous. We combine straightness with how far the tip
 * sits from the palm — a folded thumb lies across the middle knuckle.
 */
function thumbExtension(lms: Point3[], scale: number): number {
  const straight =
    (angleAt(lms[LM.THUMB_CMC], lms[LM.THUMB_MCP], lms[LM.THUMB_IP]) +
      angleAt(lms[LM.THUMB_MCP], lms[LM.THUMB_IP], lms[LM.THUMB_TIP])) /
    2;
  const straightScore = ramp(straight, 2.1, 3.05);

  // A folded thumb tip rests against the index/middle proximal phalanges, close
  // to the middle knuckle; an extended one swings well clear of it.
  const awayFromPalm = dist(lms[LM.THUMB_TIP], lms[LM.MIDDLE_MCP]) / scale;
  const awayScore = ramp(awayFromPalm, 0.45, 0.82);

  return clamp01(0.45 * straightScore + 0.55 * awayScore);
}

/**
 * Mean splay angle between neighbouring fingers.
 *
 * Only pairs where *both* fingers are extended count: a curled finger points
 * back at the palm, so including it reports a wild splay for shapes like a
 * single pointing index. When fewer than two adjacent fingers are extended the
 * measurement is meaningless, so we return 0.5 — templates should not lean on
 * spread for those handshapes.
 */
function fingerSpread(lms: Point3[], fingers: FingerExtensions): number {
  const chain: Array<{ dir: Point3; extended: boolean }> = [
    { dir: sub(lms[LM.INDEX_TIP], lms[LM.INDEX_MCP]), extended: fingers.index >= 0.55 },
    { dir: sub(lms[LM.MIDDLE_TIP], lms[LM.MIDDLE_MCP]), extended: fingers.middle >= 0.55 },
    { dir: sub(lms[LM.RING_TIP], lms[LM.RING_MCP]), extended: fingers.ring >= 0.55 },
    { dir: sub(lms[LM.PINKY_TIP], lms[LM.PINKY_MCP]), extended: fingers.pinky >= 0.55 },
  ];

  let total = 0;
  let pairs = 0;
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    if (!a.extended || !b.extended) continue;
    total += Math.acos(Math.max(-1, Math.min(1, dot(a.dir, b.dir) / (len(a.dir) * len(b.dir)))));
    pairs++;
  }

  if (pairs === 0) return 0.5;
  return ramp(total / pairs, 0.05, 0.38);
}

/* ------------------------------------------------------------------ *
 * Signing-space zones
 * ------------------------------------------------------------------ */

/**
 * SASL locates signs against the body, so a hand's meaning depends on where it
 * sits relative to the head. With a face box we measure in face-heights, which
 * stays stable as the signer moves nearer or further from the camera. Without
 * one we fall back to coarse thirds of the frame.
 */
function classifyZone(
  wristX: number,
  wristY: number,
  face: FaceAnchor | null,
): { zone: SigningZone; zoneY: number; zoneX: number } {
  if (!face) {
    const zone: SigningZone =
      wristY < 0.28 ? 'head' : wristY < 0.42 ? 'face' : wristY < 0.55 ? 'chin' : wristY < 0.75 ? 'chest' : 'neutral';
    return { zone, zoneY: (wristY - 0.35) * 3, zoneX: (wristX - 0.5) * 3 };
  }

  const zoneY = (wristY - face.cy) / (face.height || 1e-6);
  const zoneX = (wristX - face.cx) / (face.width || 1e-6);

  let zone: SigningZone;
  if (zoneY < -0.45) zone = 'head';
  else if (zoneY < 0.25) zone = 'face';
  else if (zoneY < 0.85) zone = 'chin';
  else if (zoneY < 2.0) zone = 'chest';
  else if (zoneY < 3.2) zone = 'neutral';
  else zone = 'low';

  return { zone, zoneY, zoneX };
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */

/**
 * @param world  World landmarks (metric, origin at hand centre) — used for
 *               shape and orientation, which must not depend on framing.
 * @param screen Normalised image landmarks — used for position and motion.
 */
export function extractHandFeatures(
  world: Point3[],
  screen: Point3[],
  handedness: 'Left' | 'Right',
  score: number,
  face: FaceAnchor | null,
): HandFeatures {
  const scale = dist(world[LM.WRIST], world[LM.MIDDLE_MCP]) || 1e-6;

  const fingers: FingerExtensions = {
    thumb: thumbExtension(world, scale),
    index: fingerExtension(world, LM.INDEX_MCP, LM.INDEX_PIP, LM.INDEX_DIP, LM.INDEX_TIP),
    middle: fingerExtension(world, LM.MIDDLE_MCP, LM.MIDDLE_PIP, LM.MIDDLE_DIP, LM.MIDDLE_TIP),
    ring: fingerExtension(world, LM.RING_MCP, LM.RING_PIP, LM.RING_DIP, LM.RING_TIP),
    pinky: fingerExtension(world, LM.PINKY_MCP, LM.PINKY_PIP, LM.PINKY_DIP, LM.PINKY_TIP),
  };

  const extendedCount = (Object.values(fingers) as number[]).filter((v) => v >= 0.6).length;

  // Pointing direction is read in the image plane so it matches what the signer
  // sees on screen.
  const pv = {
    x: screen[LM.MIDDLE_MCP].x - screen[LM.WRIST].x,
    y: screen[LM.MIDDLE_MCP].y - screen[LM.WRIST].y,
  };
  const pvLen = Math.hypot(pv.x, pv.y) || 1e-6;
  const pointingY = pv.y / pvLen;
  const pointing: PointingDirection = pointingY < -0.55 ? 'up' : pointingY > 0.55 ? 'down' : 'side';

  // Palm normal from the triangle wrist / index knuckle / pinky knuckle. The
  // normal flips between hands, so we cancel that out by handedness.
  const normal = cross(
    sub(world[LM.INDEX_MCP], world[LM.WRIST]),
    sub(world[LM.PINKY_MCP], world[LM.WRIST]),
  );
  const nLen = len(normal);
  const facing = (handedness === 'Right' ? 1 : -1) * (normal.z / nLen);
  const palmToCamera = clamp01(0.5 + facing * 0.5);

  const wristX = screen[LM.WRIST].x;
  const wristY = screen[LM.WRIST].y;
  const { zone, zoneY, zoneX } = classifyZone(wristX, wristY, face);

  return {
    handedness,
    score,
    fingers,
    extendedCount,
    spread: fingerSpread(world, fingers),
    pointing,
    pointingY,
    palmToCamera,
    wrist: { x: wristX, y: wristY },
    imageScale: Math.hypot(
      screen[LM.MIDDLE_MCP].x - screen[LM.WRIST].x,
      screen[LM.MIDDLE_MCP].y - screen[LM.WRIST].y,
    ),
    zone,
    zoneY,
    zoneX,
  };
}
