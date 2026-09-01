/**
 * Synthetic verification for the SASL recogniser.
 *
 * Builds anatomically plausible 21-point hand landmark sets for known
 * handshapes and checks the recogniser picks the intended sign. This is what
 * keeps the handshape thresholds honest — change a ramp constant and this
 * tells you which signs stopped being distinguishable.
 *
 * Run with: npm run verify:recognizer
 */

import { extractHandFeatures } from '../src/lib/handFeatures.ts';
import { SaslGestureRecognizer } from '../src/lib/gestureRecognizer.ts';

/* ------------------------------------------------------------------ *
 * Synthetic hand builder
 * ------------------------------------------------------------------ */

const rotX = (v, t) => ({
  x: v.x,
  y: v.y * Math.cos(t) - v.z * Math.sin(t),
  z: v.y * Math.sin(t) + v.z * Math.cos(t),
});

const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });

const D2R = Math.PI / 180;

/** Builds the four joints of one finger with a curl of 0 (straight) to 1 (fist). */
function buildFinger(mcp, curl, lengths, splayDeg = 0) {
  // A straight finger continues away from the wrist; curling folds it into the
  // palm, which sits on the -z side here.
  const base = rotX({ x: Math.sin(splayDeg * D2R), y: -Math.cos(splayDeg * D2R), z: 0 }, 0);

  const a1 = curl * 95 * D2R;
  const a2 = a1 + curl * 100 * D2R;
  const a3 = a2 + curl * 72 * D2R;

  const pip = add(mcp, scale(rotX(base, a1), lengths[0]));
  const dip = add(pip, scale(rotX(base, a2), lengths[1]));
  const tip = add(dip, scale(rotX(base, a3), lengths[2]));
  return [pip, dip, tip];
}

/**
 * @param curls  {thumb,index,middle,ring,pinky} each 0 (curled) .. 1 (straight)
 * @param splay  degrees of splay between fingers
 */
function buildHand({ curls, splay = 8 }) {
  const wrist = { x: 0, y: 0, z: 0 };

  const mcps = {
    index: { x: -0.32, y: -0.95, z: 0 },
    middle: { x: 0.0, y: -1.0, z: 0 },
    ring: { x: 0.3, y: -0.96, z: 0 },
    pinky: { x: 0.57, y: -0.86, z: 0 },
  };

  const lengths = {
    index: [0.52, 0.32, 0.26],
    middle: [0.58, 0.36, 0.27],
    ring: [0.54, 0.33, 0.25],
    pinky: [0.42, 0.26, 0.22],
  };

  const splays = { index: -splay, middle: -splay * 0.2, ring: splay * 0.5, pinky: splay * 1.4 };

  const lm = new Array(21);
  lm[0] = wrist;

  // Thumb: interpolate between two anatomically placed chains. An extended
  // thumb reaches out and up; a folded one lies across the palm with its tip
  // resting against the index/middle proximal phalanges, much closer to the
  // middle knuckle. That distance is what separates the two shapes.
  const t = curls.thumb;
  const lerp = (a, b) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  });

  const thumbFolded = [
    { x: -0.38, y: -0.26, z: 0.02 },
    { x: -0.44, y: -0.55, z: -0.10 },
    { x: -0.25, y: -0.72, z: -0.28 },
    { x: 0.02, y: -0.76, z: -0.34 },
  ];
  const thumbExtended = [
    { x: -0.38, y: -0.26, z: 0.02 },
    { x: -0.62, y: -0.62, z: 0.04 },
    { x: -0.74, y: -0.86, z: 0.05 },
    { x: -0.82, y: -1.08, z: 0.06 },
  ];

  const thumbCmc = thumbFolded[0];
  const mcp = lerp(thumbFolded[1], thumbExtended[1]);
  const ip = lerp(thumbFolded[2], thumbExtended[2]);
  const tip = lerp(thumbFolded[3], thumbExtended[3]);

  lm[1] = thumbCmc;
  lm[2] = mcp;
  lm[3] = ip;
  lm[4] = tip;

  const order = [
    ['index', 5],
    ['middle', 9],
    ['ring', 13],
    ['pinky', 17],
  ];

  for (const [name, base] of order) {
    lm[base] = mcps[name];
    const [pip, dip, ftip] = buildFinger(mcps[name], 1 - curls[name], lengths[name], splays[name]);
    lm[base + 1] = pip;
    lm[base + 2] = dip;
    lm[base + 3] = ftip;
  }

  return lm;
}

/**
 * Places a canonical hand into image space.
 * @param rollDeg rotation in the image plane; 0 = fingers up, 180 = fingers down.
 */
function toScreen(worldLm, { cx, cy, size, rollDeg = 0 }) {
  const r = rollDeg * D2R;
  return worldLm.map((p) => {
    const x = p.x * Math.cos(r) - p.y * Math.sin(r);
    const y = p.x * Math.sin(r) + p.y * Math.cos(r);
    return { x: cx + x * size, y: cy + y * size, z: p.z * size };
  });
}

/* ------------------------------------------------------------------ *
 * Scenarios
 * ------------------------------------------------------------------ */

const FIST = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
const OPEN = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };

// A face roughly centred in the upper frame, as if the signer is seated.
const FACE = { cx: 0.5, cy: 0.28, width: 0.22, height: 0.3 };

const SCENARIOS = [
  {
    name: 'Thumbs up held still',
    expect: 'sharp_good',
    curls: { ...FIST, thumb: 1 },
    place: { cx: 0.5, cy: 0.62, size: 0.13, rollDeg: 0 },
    motion: 'still',
  },
  {
    name: 'Thumbs down held still',
    expect: 'not_good',
    curls: { ...FIST, thumb: 1 },
    place: { cx: 0.5, cy: 0.62, size: 0.13, rollDeg: 180 },
    motion: 'still',
  },
  {
    name: 'Open hand waving beside the head',
    expect: 'hello_sawubona',
    curls: OPEN,
    splay: 16,
    place: { cx: 0.72, cy: 0.2, size: 0.13 },
    motion: 'waveH',
  },
  {
    name: 'Open flat palm held still at the chest',
    expect: 'stop',
    curls: OPEN,
    splay: 10,
    place: { cx: 0.5, cy: 0.62, size: 0.13 },
    motion: 'still',
  },
  {
    name: 'ILY handshape',
    expect: 'i_love_you',
    curls: { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 1 },
    place: { cx: 0.5, cy: 0.62, size: 0.13 },
    motion: 'still',
  },
  {
    name: 'V / peace sign',
    expect: 'number_two',
    curls: { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 },
    splay: 24,
    place: { cx: 0.5, cy: 0.62, size: 0.13 },
    motion: 'still',
  },
  {
    name: 'Index only pointing up in neutral space',
    expect: 'number_one',
    curls: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 },
    place: { cx: 0.5, cy: 0.62, size: 0.13 },
    motion: 'still',
  },
  {
    name: 'Index finger beside the ear',
    expect: 'deaf',
    curls: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 },
    place: { cx: 0.7, cy: 0.3, size: 0.13 },
    motion: 'still',
  },
  {
    name: 'Fist nodding up and down',
    expect: 'yes',
    curls: FIST,
    place: { cx: 0.5, cy: 0.62, size: 0.13 },
    motion: 'tapV',
  },
  {
    name: 'Three fingers at the mouth',
    expect: 'water',
    curls: { thumb: 0, index: 1, middle: 1, ring: 1, pinky: 0 },
    splay: 14,
    place: { cx: 0.5, cy: 0.44, size: 0.13 },
    motion: 'still',
  },
  {
    name: 'Index finger shaking side to side',
    expect: 'no',
    curls: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 },
    place: { cx: 0.5, cy: 0.6, size: 0.13 },
    motion: 'waveH',
  },
  {
    name: 'Flat hand circling on the chest',
    expect: 'please',
    curls: OPEN,
    splay: 4,
    place: { cx: 0.5, cy: 0.6, size: 0.13 },
    motion: 'circle',
  },

  // Negative cases: a relaxed or half-formed hand must stay silent rather than
  // guessing. False positives are worse than silence — they put words in a
  // Deaf signer's mouth.
  {
    name: 'Relaxed half-curled hand at rest',
    expect: null,
    curls: { thumb: 0.45, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5 },
    place: { cx: 0.5, cy: 0.82, size: 0.13 },
    motion: 'still',
  },
  {
    name: 'Hand mid-transition between signs',
    expect: null,
    curls: { thumb: 0.6, index: 0.45, middle: 0.55, ring: 0.4, pinky: 0.5 },
    place: { cx: 0.5, cy: 0.6, size: 0.13 },
    motion: 'circle',
  },
];

/** Offsets applied per frame to simulate each movement pattern. */
function offsetFor(motion, i) {
  const phase = (i / 30) * Math.PI * 2;
  switch (motion) {
    case 'still':
      return { dx: 0, dy: 0 };
    case 'waveH':
      return { dx: Math.sin(phase * 2) * 0.07, dy: 0 };
    case 'tapV':
      return { dx: 0, dy: Math.sin(phase * 2) * 0.05 };
    case 'circle':
      return { dx: Math.cos(phase) * 0.045, dy: Math.sin(phase) * 0.045 };
    default:
      return { dx: 0, dy: 0 };
  }
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

let passed = 0;
const failures = [];

for (const sc of SCENARIOS) {
  const world = buildHand({ curls: sc.curls, splay: sc.splay ?? 8 });
  const recognizer = new SaslGestureRecognizer();

  let emitted = null;
  let lastState = null;

  // ~40 frames at 30fps: enough for the motion window to fill and the
  // stability gate to confirm.
  for (let i = 0; i < 40; i++) {
    const { dx, dy } = offsetFor(sc.motion, i);
    const screen = toScreen(world, {
      ...sc.place,
      cx: sc.place.cx + dx,
      cy: sc.place.cy + dy,
    });

    const features = extractHandFeatures(world, screen, 'Right', 0.95, FACE);
    const { state, emitted: e } = recognizer.update([features], i * 33.3);
    lastState = state;
    if (e && !emitted) emitted = e;
  }

  // For negative cases only an actual emission counts as a failure: a weak
  // candidate that never passes the stability gate is correct behaviour.
  const got = sc.expect === null
    ? (emitted?.template.id ?? null)
    : (emitted?.template.id ?? lastState?.candidate?.template.id ?? null);
  const ok = got === sc.expect;
  if (ok) passed++;
  else failures.push({ sc, got, state: lastState });

  const f = extractHandFeatures(world, toScreen(world, sc.place), 'Right', 0.95, FACE);
  const shape = ['thumb', 'index', 'middle', 'ring', 'pinky']
    .map((k) => `${k[0]}${f.fingers[k].toFixed(2)}`)
    .join(' ');

  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${sc.name.padEnd(42)} expected=${String(sc.expect ?? 'no sign').padEnd(16)} got=${String(got ?? 'no sign').padEnd(16)} ` +
      `[${shape} | spread ${f.spread.toFixed(2)} | ${f.pointing} | ${f.zone} | ${lastState?.motion.type}]`,
  );
}

console.log(`\n${passed}/${SCENARIOS.length} scenarios passed.`);

if (failures.length) {
  console.log('\nFailures in detail:');
  for (const { sc, got, state } of failures) {
    console.log(`  ${sc.name}: expected ${sc.expect}, got ${got}`);
    if (state?.candidate) console.log(`    winner score ${state.candidate.score.toFixed(3)}`);
    for (const alt of state?.alternatives ?? []) {
      console.log(`    alt ${alt.template.id} ${alt.score.toFixed(3)}`);
    }
  }
  process.exit(1);
}
