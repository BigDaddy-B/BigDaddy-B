/**
 * Synaera-SA — on-device SASL sign recogniser.
 *
 * Runs entirely in the browser on MediaPipe hand landmarks. Nothing is uploaded,
 * so a Deaf user's camera feed never leaves their device — a hard requirement
 * for a service used in clinics, schools and police stations.
 *
 * The pipeline is:
 *   landmarks -> features -> motion over a rolling window -> template scoring
 *   -> temporal stability gate -> emitted sign
 *
 * The stability gate matters as much as the scoring: without it the recogniser
 * fires on every transitional hand position between signs and the voice output
 * becomes an unusable stutter.
 */

import type { HandFeatures, SigningZone, PointingDirection } from './handFeatures';
import { SIGN_TEMPLATES, type MotionType, type SignTemplate } from './signTemplates';

/* ------------------------------------------------------------------ *
 * Tuning
 * ------------------------------------------------------------------ */

/** How much history the movement classifier looks at. */
const MOTION_WINDOW_MS = 900;
/** Below this total travel (in image widths) the hand counts as held still. */
const STATIC_TRAVEL = 0.055;
/** Movement below this per-step is noise, not a direction change. */
const REVERSAL_DEADBAND = 0.006;
/** Minimum blended score before a sign is even considered a candidate. */
const CANDIDATE_THRESHOLD = 0.72;
/**
 * How far ahead of the runner-up the winner must be. A relaxed or half-formed
 * hand scores mediocre-but-similar against many templates; without a margin
 * the top of that pile gets spoken aloud. Silence is the right answer there —
 * a false positive puts words in a Deaf signer's mouth.
 */
const MIN_MARGIN = 0.07;
/** Consecutive agreeing frames required before a sign is emitted. */
const STABLE_FRAMES = 7;
/**
 * Movement history required before anything may be emitted. Without this the
 * stability gate can fill in ~230ms, before the buffer holds enough samples to
 * tell a wave from a still hand — so waving signs get read as their static
 * lookalikes.
 */
const MIN_HISTORY_MS = 550;
/** Refractory period before the same sign can fire again. */
const REPEAT_COOLDOWN_MS = 2200;

/* ------------------------------------------------------------------ *
 * Movement analysis
 * ------------------------------------------------------------------ */

interface MotionSample {
  t: number;
  x: number;
  y: number;
}

export interface MotionSummary {
  type: MotionType;
  /** Total path length in image widths. */
  travel: number;
  /** Net straight-line displacement. */
  netX: number;
  netY: number;
  /** 1 = straight path, near 0 = oscillating or circular. */
  directness: number;
  reversalsX: number;
  reversalsY: number;
}

const IDLE_MOTION: MotionSummary = {
  type: 'static',
  travel: 0,
  netX: 0,
  netY: 0,
  directness: 0,
  reversalsX: 0,
  reversalsY: 0,
};

function countReversals(deltas: number[]): number {
  let reversals = 0;
  let lastSign = 0;
  for (const d of deltas) {
    if (Math.abs(d) < REVERSAL_DEADBAND) continue;
    const sign = Math.sign(d);
    if (lastSign !== 0 && sign !== lastSign) reversals++;
    lastSign = sign;
  }
  return reversals;
}

function summariseMotion(samples: MotionSample[]): MotionSummary {
  if (samples.length < 4) return IDLE_MOTION;

  const dxs: number[] = [];
  const dys: number[] = [];
  let travel = 0;

  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x;
    const dy = samples[i].y - samples[i - 1].y;
    dxs.push(dx);
    dys.push(dy);
    travel += Math.hypot(dx, dy);
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const netX = last.x - first.x;
  const netY = last.y - first.y;
  const net = Math.hypot(netX, netY);
  const directness = travel > 1e-6 ? net / travel : 0;

  const reversalsX = countReversals(dxs);
  const reversalsY = countReversals(dys);

  const summary: Omit<MotionSummary, 'type'> = {
    travel,
    netX,
    netY,
    directness,
    reversalsX,
    reversalsY,
  };

  if (travel < STATIC_TRAVEL) return { ...summary, type: 'static' };

  const horizontal = Math.abs(netX) >= Math.abs(netY);

  // Repeated reversals mean an oscillation: side to side is a wave, up and
  // down is a tap/nod.
  if (reversalsX >= 2 && reversalsX >= reversalsY) return { ...summary, type: 'wave' };
  if (reversalsY >= 2) return { ...summary, type: 'tap' };

  // A path much longer than its displacement is going round in circles.
  if (directness < 0.45) return { ...summary, type: 'circle' };

  if (!horizontal) return { ...summary, type: netY < 0 ? 'up' : 'down' };

  // A directed horizontal sweep with no reversal yet — treat as an emerging wave.
  return { ...summary, type: 'wave' };
}

/* ------------------------------------------------------------------ *
 * Template scoring
 * ------------------------------------------------------------------ */

const ZONE_ORDER: SigningZone[] = ['head', 'face', 'chin', 'chest', 'neutral', 'low'];

/** Neighbouring zones score partial credit — signers vary in how high they sign. */
function zoneSimilarity(actual: SigningZone, target: SigningZone): number {
  const d = Math.abs(ZONE_ORDER.indexOf(actual) - ZONE_ORDER.indexOf(target));
  if (d === 0) return 1;
  if (d === 1) return 0.6;
  if (d === 2) return 0.25;
  return 0.05;
}

function motionSimilarity(actual: MotionType, target: MotionType): number {
  if (target === 'any') return 1;
  if (actual === target) return 1;
  // Oscillations are easy to confuse while a sign is still forming.
  if ((actual === 'wave' && target === 'tap') || (actual === 'tap' && target === 'wave')) return 0.35;
  if ((actual === 'circle' && target === 'wave') || (actual === 'wave' && target === 'circle')) return 0.35;
  if (target === 'static' && actual !== 'static') return 0.15;
  if (target !== 'static' && actual === 'static') return 0.2;
  return 0.1;
}

function pointingSimilarity(actual: PointingDirection, target: PointingDirection): number {
  if (actual === target) return 1;
  if (actual === 'side' || target === 'side') return 0.35;
  return 0.05; // up vs down is a real contrast (GOOD vs NOT GOOD)
}

export interface ScoredSign {
  template: SignTemplate;
  score: number;
}

/**
 * Weighted match of live features against one template. Handshape carries the
 * most weight because it is the most reliably measured; location and movement
 * refine between signs that share a handshape.
 */
function scoreTemplate(
  template: SignTemplate,
  hand: HandFeatures,
  motion: MotionSummary,
  handCount: number,
): number {
  let total = 0;
  let weight = 0;

  const add = (similarity: number, w: number) => {
    total += similarity * w;
    weight += w;
  };

  // Handshape — each specified finger contributes. The similarity is squared so
  // that a finger sitting ambiguously mid-curl scores poorly against *every*
  // template rather than half-matching all of them.
  for (const [finger, target] of Object.entries(template.shape)) {
    if (target === undefined) continue;
    const actual = hand.fingers[finger as keyof typeof hand.fingers];
    const closeness = 1 - Math.abs(actual - target);
    add(closeness * closeness, 3);
  }

  if (template.spread !== undefined) {
    add(1 - Math.abs(hand.spread - template.spread), 1.2);
  }
  // Location and movement are primary SASL parameters, not tiebreakers: DEAF,
  // NO and ONE share one handshape and are told apart purely by where the hand
  // sits and how it moves. They are weighted to match.
  if (template.zone !== undefined) {
    add(zoneSimilarity(hand.zone, template.zone), 4);
  }
  if (template.pointing !== undefined) {
    add(pointingSimilarity(hand.pointing, template.pointing), 2);
  }
  if (template.palmToCamera !== undefined) {
    add(1 - Math.abs(hand.palmToCamera - template.palmToCamera), 1);
  }
  if (template.motion !== undefined) {
    add(motionSimilarity(motion.type, template.motion), 4);
  }

  let score = weight > 0 ? total / weight : 0;

  // Two-handed signs must actually be shown with two hands.
  if (template.hands === 2 && handCount < 2) score *= 0.45;
  // ...and one-handed signs shouldn't win while both hands are up mid-sign.
  if (template.hands === 1 && handCount > 1) score *= 0.9;

  // Weight by how sure the detector is about the hand itself.
  return score * (0.75 + 0.25 * hand.score);
}

/* ------------------------------------------------------------------ *
 * Recogniser
 * ------------------------------------------------------------------ */

export interface RecognitionState {
  /** Best current candidate, whether or not it is confirmed yet. */
  candidate: ScoredSign | null;
  /** Runner-up candidates, for the UI's "did you mean" hints. */
  alternatives: ScoredSign[];
  /** 0..1 progress toward confirming the candidate. */
  stability: number;
  motion: MotionSummary;
  handCount: number;
}

export interface RecognisedSign {
  template: SignTemplate;
  confidence: number;
  motion: MotionType;
  at: number;
}

export class SaslGestureRecognizer {
  private samples: MotionSample[] = [];
  private stableId: string | null = null;
  private stableCount = 0;
  private lastEmitted: { id: string; at: number } | null = null;

  /** Clears movement history — call when tracking is lost or the camera stops. */
  reset(): void {
    this.samples = [];
    this.stableId = null;
    this.stableCount = 0;
  }

  /**
   * Feeds one frame of tracked hands.
   *
   * @returns the recognised sign, if this frame confirmed one.
   */
  update(hands: HandFeatures[], now: number): { state: RecognitionState; emitted: RecognisedSign | null } {
    if (hands.length === 0) {
      this.reset();
      return {
        state: { candidate: null, alternatives: [], stability: 0, motion: IDLE_MOTION, handCount: 0 },
        emitted: null,
      };
    }

    // Track the dominant (highest-confidence) hand for movement.
    const primary = hands.reduce((a, b) => (b.score > a.score ? b : a));

    this.samples.push({ t: now, x: primary.wrist.x, y: primary.wrist.y });
    while (this.samples.length && now - this.samples[0].t > MOTION_WINDOW_MS) {
      this.samples.shift();
    }

    const motion = summariseMotion(this.samples);

    const scored: ScoredSign[] = SIGN_TEMPLATES.map((template) => ({
      template,
      score: scoreTemplate(template, primary, motion, hands.length),
    })).sort((a, b) => b.score - a.score);

    const best = scored[0];
    const runnerUp = scored[1];
    const decisive = !runnerUp || best.score - runnerUp.score >= MIN_MARGIN;
    const candidate = best && best.score >= CANDIDATE_THRESHOLD && decisive ? best : null;

    // Temporal stability: the same sign must persist across frames. This is what
    // stops the recogniser firing on the transitions between signs.
    if (candidate && candidate.template.id === this.stableId) {
      this.stableCount++;
    } else if (candidate) {
      this.stableId = candidate.template.id;
      this.stableCount = 1;
    } else {
      this.stableId = null;
      this.stableCount = 0;
    }

    const stability = Math.min(1, this.stableCount / STABLE_FRAMES);

    const historyMs = this.samples.length ? now - this.samples[0].t : 0;

    let emitted: RecognisedSign | null = null;
    if (candidate && this.stableCount >= STABLE_FRAMES && historyMs >= MIN_HISTORY_MS) {
      const isRepeat = this.lastEmitted?.id === candidate.template.id;
      const cooledDown = !this.lastEmitted || now - this.lastEmitted.at >= REPEAT_COOLDOWN_MS;

      if (!isRepeat || cooledDown) {
        emitted = {
          template: candidate.template,
          confidence: candidate.score,
          motion: motion.type,
          at: now,
        };
        this.lastEmitted = { id: candidate.template.id, at: now };
        // Require the gate to refill before the next emission.
        this.stableCount = 0;
      }
    }

    return {
      state: {
        candidate,
        alternatives: scored.slice(1, 3).filter((s) => s.score > 0.45),
        stability,
        motion,
        handCount: hands.length,
      },
      emitted,
    };
  }
}
