/**
 * Synaera-SA — recognisable SASL sign templates.
 *
 * Each template describes a sign the way SASL linguistics does, in four
 * parameters: handshape, orientation, location, and movement. The recogniser
 * scores live hand features against these descriptions.
 *
 * This is a deliberately open, readable vocabulary rather than an opaque
 * trained model — community contributors can add a sign by describing it, with
 * no ML pipeline and no data collection. `tip` is shown in the UI so a signer
 * can see exactly how the app expects each sign to be formed.
 *
 * Scope note: this is a starter vocabulary of high-frequency signs, not full
 * SASL. Signs are chosen to be mutually distinguishable from hand landmarks
 * alone. Contributions from Deaf SASL users are what should grow this list —
 * see CONTRIBUTING notes in the README.
 */

import type { FingerName, PointingDirection, SigningZone } from './handFeatures';

export type MotionType = 'static' | 'wave' | 'tap' | 'up' | 'down' | 'circle' | 'any';

export interface SignTemplate {
  id: string;
  gloss: string;
  english: string;
  /** How many hands the sign needs. */
  hands: 1 | 2;
  /** Target extension per finger, 0 = curled, 1 = straight. Omit = don't care. */
  shape: Partial<Record<FingerName, number>>;
  /** Target splay of the fingers, 0 = together, 1 = wide. */
  spread?: number;
  /** Where the hand should sit in the signing space. */
  zone?: SigningZone;
  /** Which way the hand points on screen. */
  pointing?: PointingDirection;
  /** How squarely the palm should face the camera. */
  palmToCamera?: number;
  /** Required movement. */
  motion?: MotionType;
  /** South African linguistic / cultural note. */
  saContext: string;
  handshapeDescription: string;
  /** Plain-language instruction shown to the signer. */
  tip: string;
  /** Matching entry in SASL_DICTIONARY, when one exists, for avatar playback. */
  dictionaryId?: string;
  category: 'greetings' | 'everyday' | 'emergency' | 'questions' | 'numbers' | 'culture_sa';
}

export const SIGN_TEMPLATES: SignTemplate[] = [
  /* ---------------------------------------------------------------- *
   * Greetings
   * ---------------------------------------------------------------- */
  {
    id: 'hello_sawubona',
    gloss: 'SAWUBONA / HELLO',
    english: 'Hello',
    hands: 1,
    shape: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 1 },
    spread: 0.6,
    zone: 'face',
    motion: 'wave',
    saContext: 'Sawubona (isiZulu) — the everyday South African greeting.',
    handshapeDescription: 'Open flat hand beside the head, waving',
    tip: 'Open hand up beside your head and wave side to side.',
    dictionaryId: 'sawubona',
    category: 'greetings',
  },
  {
    id: 'thank_you',
    gloss: 'THANK YOU / NGIYABONGA',
    english: 'Thank you',
    hands: 1,
    shape: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 },
    spread: 0.15,
    zone: 'chin',
    motion: 'down',
    saContext: 'Ngiyabonga / Ke a leboga — flat hand from the chin, moving outward.',
    handshapeDescription: 'Flat hand, fingers together, starting at the chin',
    tip: 'Flat hand with fingers together at your chin, then move it down and forward.',
    dictionaryId: 'thank_you',
    category: 'greetings',
  },

  /* ---------------------------------------------------------------- *
   * Everyday responses
   * ---------------------------------------------------------------- */
  {
    id: 'sharp_good',
    gloss: 'SHARP / GOOD',
    english: 'Sharp sharp! Good',
    hands: 1,
    shape: { thumb: 1, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 },
    pointing: 'up',
    motion: 'static',
    saContext: '"Sharp sharp" is South African English for good / all is well.',
    handshapeDescription: 'Closed fist with the thumb pointing up',
    tip: 'Make a fist with your thumb pointing straight up, and hold it.',
    dictionaryId: 'sharp_good',
    category: 'everyday',
  },
  {
    id: 'not_good',
    gloss: 'NOT GOOD / BAD',
    english: 'Not good',
    hands: 1,
    shape: { thumb: 1, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 },
    pointing: 'down',
    motion: 'static',
    saContext: 'The inverse of "sharp" — thumb turned down.',
    handshapeDescription: 'Closed fist with the thumb pointing down',
    tip: 'Make a fist with your thumb pointing down, and hold it.',
    category: 'everyday',
  },
  {
    id: 'yes',
    gloss: 'YES',
    english: 'Yes',
    hands: 1,
    shape: { thumb: 0.2, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 },
    motion: 'tap',
    saContext: 'The fist "nods" like a head saying yes.',
    handshapeDescription: 'Closed fist nodding up and down',
    tip: 'Make a fist and nod it up and down from the wrist.',
    category: 'everyday',
  },
  {
    id: 'no',
    gloss: 'NO',
    english: 'No',
    hands: 1,
    shape: { thumb: 0.3, index: 1, middle: 0.1, ring: 0.05, pinky: 0.05 },
    zone: 'chest',
    motion: 'wave',
    saContext: 'Index finger shaken side to side — a widely shared negation sign.',
    handshapeDescription: 'Index finger extended, shaking side to side',
    tip: 'Point your index finger up and shake it side to side.',
    category: 'everyday',
  },
  {
    id: 'please',
    gloss: 'PLEASE / ASSEBLIEF',
    english: 'Please',
    hands: 1,
    shape: { thumb: 0.7, index: 1, middle: 1, ring: 1, pinky: 1 },
    spread: 0.15,
    zone: 'chest',
    motion: 'circle',
    saContext: 'Asseblief (Afrikaans) — flat hand circling on the chest.',
    handshapeDescription: 'Flat hand circling over the chest',
    tip: 'Flat hand over your chest, moving in a small circle.',
    dictionaryId: 'please',
    category: 'everyday',
  },
  {
    id: 'stop',
    gloss: 'STOP / WAIT',
    english: 'Stop',
    hands: 1,
    shape: { thumb: 0.7, index: 1, middle: 1, ring: 1, pinky: 1 },
    spread: 0.3,
    zone: 'chest',
    palmToCamera: 0.9,
    motion: 'static',
    saContext: 'Flat palm held toward the addressee.',
    handshapeDescription: 'Flat palm facing forward, held still',
    tip: 'Hold your flat palm up facing the camera, and keep it still.',
    category: 'everyday',
  },
  {
    id: 'you',
    gloss: 'YOU',
    english: 'You',
    hands: 1,
    shape: { thumb: 0.3, index: 1, middle: 0.1, ring: 0.05, pinky: 0.05 },
    pointing: 'side',
    zone: 'chest',
    motion: 'static',
    saContext: 'Direct indexing — pointing is grammatical in SASL, not rude.',
    handshapeDescription: 'Index finger pointing toward the addressee',
    tip: 'Point your index finger forward at the camera and hold.',
    category: 'everyday',
  },

  /* ---------------------------------------------------------------- *
   * Identity and connection
   * ---------------------------------------------------------------- */
  {
    id: 'i_love_you',
    gloss: 'I-LOVE-YOU',
    english: 'I love you',
    hands: 1,
    shape: { thumb: 1, index: 1, middle: 0.05, ring: 0.05, pinky: 1 },
    motion: 'static',
    saContext: 'The internationally shared ILY handshape, widely used in SASL.',
    handshapeDescription: 'Thumb, index and pinky extended; middle and ring folded',
    tip: 'Extend your thumb, index finger and pinky; fold the middle and ring fingers down.',
    category: 'greetings',
  },
  {
    id: 'love',
    gloss: 'LOVE / UTHANDO',
    english: 'Love',
    hands: 2,
    shape: { thumb: 0.2, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 },
    zone: 'chest',
    motion: 'static',
    saContext: 'Uthando (isiZulu) — both fists crossed over the heart.',
    handshapeDescription: 'Both fists crossed over the chest',
    tip: 'Cross both fists over your chest and hold.',
    dictionaryId: 'love',
    category: 'greetings',
  },
  {
    id: 'name',
    gloss: 'NAME / IGAMA',
    english: 'Name',
    hands: 1,
    shape: { thumb: 0.2, index: 1, middle: 1, ring: 0.05, pinky: 0.05 },
    spread: 0.1,
    zone: 'chest',
    motion: 'tap',
    saContext: 'Igama (isiZulu) — the H-hand tapping, used when introducing yourself.',
    handshapeDescription: 'Index and middle fingers together, tapping',
    tip: 'Hold index and middle fingers out together and tap them up and down.',
    dictionaryId: 'name',
    category: 'everyday',
  },
  {
    id: 'deaf',
    gloss: 'DEAF / SASL',
    english: 'Deaf',
    hands: 1,
    shape: { thumb: 0.3, index: 1, middle: 0.1, ring: 0.05, pinky: 0.05 },
    zone: 'face',
    motion: 'static',
    saContext: 'SASL became South Africa’s 12th official language in 2023.',
    handshapeDescription: 'Index finger touching near the ear',
    tip: 'Point your index finger up beside your ear and hold it there.',
    dictionaryId: 'deaf_sasl',
    category: 'culture_sa',
  },

  /* ---------------------------------------------------------------- *
   * Needs and emergencies
   * ---------------------------------------------------------------- */
  {
    id: 'help',
    gloss: 'HELP',
    english: 'I need help',
    hands: 2,
    shape: { thumb: 0.9, index: 0.4, middle: 0.4, ring: 0.4, pinky: 0.4 },
    zone: 'chest',
    motion: 'up',
    saContext: 'Priority sign for clinics and emergency services.',
    handshapeDescription: 'One fist resting on the flat opposite palm, lifting up',
    tip: 'Rest one fist on your other flat palm and lift both hands upward.',
    dictionaryId: 'help_emergency',
    category: 'emergency',
  },
  {
    id: 'water',
    gloss: 'WATER / AMANZI',
    english: 'Water',
    hands: 1,
    shape: { thumb: 0.1, index: 1, middle: 1, ring: 1, pinky: 0.05 },
    spread: 0.5,
    zone: 'chin',
    motion: 'static',
    saContext: 'Amanzi (isiZulu) — the W handshape held at the mouth.',
    handshapeDescription: 'Three fingers extended (W shape) at the mouth',
    tip: 'Extend index, middle and ring fingers and hold them near your mouth.',
    dictionaryId: 'water',
    category: 'everyday',
  },

  /* ---------------------------------------------------------------- *
   * Numbers — reliable, and a good way to check tracking is working
   * ---------------------------------------------------------------- */
  {
    id: 'number_one',
    gloss: 'ONE',
    english: 'One',
    hands: 1,
    shape: { thumb: 0.2, index: 1, middle: 0.05, ring: 0.05, pinky: 0.05 },
    pointing: 'up',
    zone: 'chest',
    motion: 'static',
    saContext: 'SASL counting handshape.',
    handshapeDescription: 'Index finger only, pointing up',
    tip: 'Hold up your index finger only.',
    category: 'numbers',
  },
  {
    id: 'number_two',
    gloss: 'TWO',
    english: 'Two',
    hands: 1,
    shape: { thumb: 0.2, index: 1, middle: 1, ring: 0.05, pinky: 0.05 },
    spread: 0.75,
    motion: 'static',
    saContext: 'SASL counting handshape (also reads as the peace sign).',
    handshapeDescription: 'Index and middle fingers extended in a V',
    tip: 'Hold up index and middle fingers in a V shape.',
    category: 'numbers',
  },
  {
    id: 'number_three',
    gloss: 'THREE',
    english: 'Three',
    hands: 1,
    shape: { thumb: 1, index: 1, middle: 1, ring: 0.05, pinky: 0.05 },
    motion: 'static',
    saContext: 'SASL counting handshape.',
    handshapeDescription: 'Thumb, index and middle fingers extended',
    tip: 'Hold up your thumb, index and middle fingers.',
    category: 'numbers',
  },
];

export const TEMPLATES_BY_ID: Record<string, SignTemplate> = Object.fromEntries(
  SIGN_TEMPLATES.map((t) => [t.id, t]),
);
