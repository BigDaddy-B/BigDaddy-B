import { SaslSign, BodyKeyframe, ArmPose, TranslationToken } from '../types/sasl';

export const REST_ARM_LEFT: ArmPose = {
  shoulderX: 0.1,
  shoulderY: 0.05,
  shoulderZ: 0.2,
  elbowX: 0.2,
  elbowY: 0.1,
  wristX: 0.0,
  wristY: 0.0,
  wristZ: 0.0,
  thumb: 0.2,
  index: 0.2,
  middle: 0.2,
  ring: 0.2,
  pinky: 0.2,
  fingerSpread: 0.2,
};

export const REST_ARM_RIGHT: ArmPose = {
  shoulderX: 0.1,
  shoulderY: -0.05,
  shoulderZ: -0.2,
  elbowX: 0.2,
  elbowY: -0.1,
  wristX: 0.0,
  wristY: 0.0,
  wristZ: 0.0,
  thumb: 0.2,
  index: 0.2,
  middle: 0.2,
  ring: 0.2,
  pinky: 0.2,
  fingerSpread: 0.2,
};

export const REST_POSE: BodyKeyframe = {
  durationMs: 400,
  head: { rotX: 0, rotY: 0, rotZ: 0 },
  torso: { leanX: 0, leanY: 0 },
  leftArm: { ...REST_ARM_LEFT },
  rightArm: { ...REST_ARM_RIGHT },
  facialExpression: 'neutral',
};

// SASL Sign Dictionary
export const SASL_DICTIONARY: Record<string, SaslSign> = {
  sawubona: {
    id: 'sawubona',
    gloss: 'SAWUBONA / HELLO',
    english: 'Hello / Greetings (Sawubona)',
    category: 'greetings',
    saContext: 'Common national South African greeting; recognized in SASL with open palm wave originating from temple.',
    handshapeDescription: 'Open flat 5-hand by temple moving outward with friendly smile',
    twoHanded: false,
    tags: ['hello', 'hi', 'sawubona', 'dumela', 'molo', 'greetings', 'welcome'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.8,
          shoulderY: -0.3,
          shoulderZ: 0.6,
          elbowX: 1.4,
          elbowY: -0.4,
          wristX: 0.3,
          wristY: -0.2,
          wristZ: 0.1,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.6,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 450,
        head: { rotX: 0.08, rotY: 0.05, rotZ: 0.02 },
        torso: { leanX: 0.02, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.85,
          shoulderY: -0.1,
          shoulderZ: 0.7,
          elbowX: 1.3,
          elbowY: -0.1,
          wristX: -0.2,
          wristY: 0.2,
          wristZ: 0.3,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.8,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 350,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  thank_you: {
    id: 'thank_you',
    gloss: 'THANK-YOU / KE-A-LEBOGA',
    english: 'Thank you (Ke a leboga / Baie dankie / Siyabonga)',
    category: 'greetings',
    saContext: 'SASL thank you sign originates from the chin extending smoothly towards the listener with respectful slight bow.',
    handshapeDescription: 'Flat B-hand touches lips/chin then moves forward and down towards addressee',
    twoHanded: false,
    tags: ['thank', 'thanks', 'thank you', 'ke a leboga', 'siyabonga', 'dankie', 'grateful'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.02, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.7,
          shoulderY: -0.2,
          shoulderZ: 0.3,
          elbowX: 1.7,
          elbowY: -0.3,
          wristX: 0.5,
          wristY: 0.0,
          wristZ: 0.1,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.1,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 450,
        head: { rotX: 0.12, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.06, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.4,
          shoulderY: -0.1,
          shoulderZ: 0.1,
          elbowX: 0.8,
          elbowY: -0.1,
          wristX: -0.2,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.2,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 300,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  sharp_good: {
    id: 'sharp_good',
    gloss: 'SHARP / GOOD / ALL-RIGHT',
    english: 'Sharp sharp / Good / Everything is well',
    category: 'culture_sa',
    saContext: 'Iconic South African cultural sign: "Sharp Sharp" indicating enthusiastic agreement or approval.',
    handshapeDescription: 'A-hand with extended thumb pointing forward, pulsing twice with confident head nod',
    twoHanded: true,
    tags: ['good', 'sharp', 'great', 'fine', 'cool', 'sharp sharp', 'lekker', 'nice', 'awesome', 'okay'],
    keyframes: [
      {
        durationMs: 300,
        head: { rotX: 0.1, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.03, leanY: 0 },
        leftArm: {
          shoulderX: 0.4,
          shoulderY: 0.2,
          shoulderZ: 0.2,
          elbowX: 1.1,
          elbowY: 0.2,
          wristX: 0.2,
          wristY: 0.1,
          wristZ: 0.0,
          thumb: 0.0,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.1,
        },
        rightArm: {
          shoulderX: 0.4,
          shoulderY: -0.2,
          shoulderZ: -0.2,
          elbowX: 1.1,
          elbowY: -0.2,
          wristX: 0.2,
          wristY: -0.1,
          wristZ: 0.0,
          thumb: 0.0,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.1,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 350,
        head: { rotX: 0.18, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.05, leanY: 0 },
        leftArm: {
          shoulderX: 0.45,
          shoulderY: 0.2,
          shoulderZ: 0.2,
          elbowX: 0.9,
          elbowY: 0.2,
          wristX: 0.1,
          wristY: 0.1,
          wristZ: 0.0,
          thumb: 0.0,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.1,
        },
        rightArm: {
          shoulderX: 0.45,
          shoulderY: -0.2,
          shoulderZ: -0.2,
          elbowX: 0.9,
          elbowY: -0.2,
          wristX: 0.1,
          wristY: -0.1,
          wristZ: 0.0,
          thumb: 0.0,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.1,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  how_are_you: {
    id: 'how_are_you',
    gloss: 'HOW-YOU / KUNJANI',
    english: 'How are you? (Kunjani? / Hoe gaan dit?)',
    category: 'questions',
    saContext: 'SASL question form using bent open hands starting at chest rotating upward with furrowed/raised question eyebrows.',
    handshapeDescription: 'Curved hands start palms in at chest, rotate outward facing up',
    twoHanded: true,
    tags: ['how', 'how are you', 'kunjani', 'hoe gaan dit', 'how you', 'status'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: -0.08, rotY: 0.05, rotZ: 0.03 },
        torso: { leanX: 0.02, leanY: 0 },
        leftArm: {
          shoulderX: 0.35,
          shoulderY: 0.2,
          shoulderZ: 0.1,
          elbowX: 1.2,
          elbowY: 0.4,
          wristX: 0.4,
          wristY: 0.2,
          wristZ: -0.3,
          thumb: 0.1,
          index: 0.1,
          middle: 0.1,
          ring: 0.1,
          pinky: 0.1,
          fingerSpread: 0.3,
        },
        rightArm: {
          shoulderX: 0.35,
          shoulderY: -0.2,
          shoulderZ: -0.1,
          elbowX: 1.2,
          elbowY: -0.4,
          wristX: 0.4,
          wristY: -0.2,
          wristZ: 0.3,
          thumb: 0.1,
          index: 0.1,
          middle: 0.1,
          ring: 0.1,
          pinky: 0.1,
          fingerSpread: 0.3,
        },
        facialExpression: 'question_nod',
      },
      {
        durationMs: 450,
        head: { rotX: 0.05, rotY: -0.03, rotZ: 0.02 },
        torso: { leanX: 0.04, leanY: 0 },
        leftArm: {
          shoulderX: 0.4,
          shoulderY: 0.35,
          shoulderZ: 0.2,
          elbowX: 0.9,
          elbowY: 0.1,
          wristX: -0.2,
          wristY: 0.3,
          wristZ: 0.1,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.5,
        },
        rightArm: {
          shoulderX: 0.4,
          shoulderY: -0.35,
          shoulderZ: -0.2,
          elbowX: 0.9,
          elbowY: -0.1,
          wristX: -0.2,
          wristY: -0.3,
          wristZ: -0.1,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.5,
        },
        facialExpression: 'question_nod',
      },
      {
        durationMs: 300,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  south_africa: {
    id: 'south_africa',
    gloss: 'SOUTH-AFRICA',
    english: 'South Africa (Mzansi / SASL 12th Official Language)',
    category: 'culture_sa',
    saContext: 'Official sign for South Africa: S-hand moving into A-hand or contouring national unity shape.',
    handshapeDescription: 'Right hand forms S then moves into A shape across torso',
    twoHanded: false,
    tags: ['south africa', 'mzansi', 'south african', 'country', 'sasl', 'sa'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.6,
          shoulderY: -0.2,
          shoulderZ: 0.3,
          elbowX: 1.3,
          elbowY: -0.2,
          wristX: 0.2,
          wristY: 0.1,
          wristZ: 0.2,
          thumb: 0.8,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'emphatic',
      },
      {
        durationMs: 450,
        head: { rotX: 0.08, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.02, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.4,
          shoulderY: -0.35,
          shoulderZ: 0.1,
          elbowX: 0.9,
          elbowY: -0.1,
          wristX: -0.1,
          wristY: -0.2,
          wristZ: 0.0,
          thumb: 0.0,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 300,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  help_emergency: {
    id: 'help_emergency',
    gloss: 'HELP / EMERGENCY',
    english: 'Help / Emergency (Usizo / Noodgeval)',
    category: 'emergency',
    saContext: 'Vital emergency SASL sign: base hand holds up fist with thumb up, lifting urgently.',
    handshapeDescription: 'Left open palm carries right fist upward with earnest facial expression',
    twoHanded: true,
    tags: ['help', 'emergency', 'assist', 'sos', 'urgent', 'danger', 'rescue'],
    keyframes: [
      {
        durationMs: 300,
        head: { rotX: 0.1, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.05, leanY: 0 },
        leftArm: {
          shoulderX: 0.4,
          shoulderY: 0.1,
          shoulderZ: 0.1,
          elbowX: 1.3,
          elbowY: 0.3,
          wristX: 0.2,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.2,
        },
        rightArm: {
          shoulderX: 0.4,
          shoulderY: -0.1,
          shoulderZ: -0.1,
          elbowX: 1.4,
          elbowY: -0.2,
          wristX: 0.2,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.0,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'concern',
      },
      {
        durationMs: 400,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.03, leanY: 0 },
        leftArm: {
          shoulderX: 0.6,
          shoulderY: 0.1,
          shoulderZ: 0.1,
          elbowX: 1.6,
          elbowY: 0.3,
          wristX: 0.2,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.2,
        },
        rightArm: {
          shoulderX: 0.6,
          shoulderY: -0.1,
          shoulderZ: -0.1,
          elbowX: 1.7,
          elbowY: -0.2,
          wristX: 0.2,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.0,
          index: 1.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'concern',
      },
      {
        durationMs: 300,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  doctor: {
    id: 'doctor',
    gloss: 'DOCTOR / CLINIC',
    english: 'Doctor / Clinic / Hospital (Dokotela)',
    category: 'emergency',
    saContext: 'SASL medical sign: M-hand or bent fingers tapping radial pulse on wrist twice.',
    handshapeDescription: 'Bent right fingers tap left inner wrist taking pulse',
    twoHanded: true,
    tags: ['doctor', 'clinic', 'hospital', 'nurse', 'medic', 'sick', 'health', 'medicine'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.08, rotY: 0.05, rotZ: 0 },
        torso: { leanX: 0.03, leanY: 0 },
        leftArm: {
          shoulderX: 0.3,
          shoulderY: 0.2,
          shoulderZ: 0.1,
          elbowX: 1.3,
          elbowY: 0.4,
          wristX: 0.1,
          wristY: 0.3,
          wristZ: 0.0,
          thumb: 0.1,
          index: 0.1,
          middle: 0.1,
          ring: 0.1,
          pinky: 0.1,
          fingerSpread: 0.2,
        },
        rightArm: {
          shoulderX: 0.35,
          shoulderY: -0.1,
          shoulderZ: -0.1,
          elbowX: 1.4,
          elbowY: -0.3,
          wristX: 0.3,
          wristY: -0.2,
          wristZ: 0.1,
          thumb: 0.8,
          index: 0.2,
          middle: 0.2,
          ring: 0.2,
          pinky: 0.8,
          fingerSpread: 0.1,
        },
        facialExpression: 'concern',
      },
      {
        durationMs: 350,
        head: { rotX: 0.08, rotY: 0.05, rotZ: 0 },
        torso: { leanX: 0.03, leanY: 0 },
        leftArm: {
          shoulderX: 0.3,
          shoulderY: 0.2,
          shoulderZ: 0.1,
          elbowX: 1.3,
          elbowY: 0.4,
          wristX: 0.1,
          wristY: 0.3,
          wristZ: 0.0,
          thumb: 0.1,
          index: 0.1,
          middle: 0.1,
          ring: 0.1,
          pinky: 0.1,
          fingerSpread: 0.2,
        },
        rightArm: {
          shoulderX: 0.38,
          shoulderY: -0.12,
          shoulderZ: -0.1,
          elbowX: 1.5,
          elbowY: -0.3,
          wristX: 0.4,
          wristY: -0.2,
          wristZ: 0.1,
          thumb: 0.8,
          index: 0.2,
          middle: 0.2,
          ring: 0.2,
          pinky: 0.8,
          fingerSpread: 0.1,
        },
        facialExpression: 'concern',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  taxi_transport: {
    id: 'taxi_transport',
    gloss: 'TAXI / TRANSPORT',
    english: 'Taxi / Minibus Transport',
    category: 'culture_sa',
    saContext: 'Famous South African Taxi hand signal & steering sign used across all provinces.',
    handshapeDescription: 'Index finger points upward indicating local destination hailing, then hands hold steering wheel',
    twoHanded: true,
    tags: ['taxi', 'transport', 'bus', 'car', 'ride', 'travel', 'commute', 'kombi'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.02, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.7,
          shoulderY: -0.2,
          shoulderZ: 0.2,
          elbowX: 1.3,
          elbowY: -0.1,
          wristX: 0.2,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.9,
          index: 0.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 400,
        head: { rotX: 0.08, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.04, leanY: 0 },
        leftArm: {
          shoulderX: 0.45,
          shoulderY: 0.2,
          shoulderZ: 0.1,
          elbowX: 1.1,
          elbowY: 0.2,
          wristX: 0.1,
          wristY: 0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.8,
          middle: 0.8,
          ring: 0.8,
          pinky: 0.8,
          fingerSpread: 0.0,
        },
        rightArm: {
          shoulderX: 0.45,
          shoulderY: -0.2,
          shoulderZ: -0.1,
          elbowX: 1.1,
          elbowY: -0.2,
          wristX: 0.1,
          wristY: -0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.8,
          middle: 0.8,
          ring: 0.8,
          pinky: 0.8,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  please: {
    id: 'please',
    gloss: 'PLEASE / ASSEBLIEF',
    english: 'Please (Asseblief / Uxolo)',
    category: 'greetings',
    saContext: 'Flat open palm circulating gently on the sternum with humble polite nod.',
    handshapeDescription: 'Open 5-hand circles on chest',
    twoHanded: false,
    tags: ['please', 'pls', 'asseblief', 'kindly', 'polite'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.08, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.02, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.5,
          shoulderY: -0.15,
          shoulderZ: 0.1,
          elbowX: 1.5,
          elbowY: -0.2,
          wristX: 0.2,
          wristY: -0.1,
          wristZ: 0.1,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.1,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 400,
        head: { rotX: 0.12, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.04, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.52,
          shoulderY: -0.05,
          shoulderZ: 0.15,
          elbowX: 1.4,
          elbowY: -0.1,
          wristX: 0.1,
          wristY: 0.1,
          wristZ: -0.1,
          thumb: 0.0,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.0,
          fingerSpread: 0.1,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  name: {
    id: 'name',
    gloss: 'NAME / MY-NAME',
    english: 'Name / My name is (Igama lami)',
    category: 'everyday',
    saContext: 'Points to self, then taps H-fingers (index and middle) across each other.',
    handshapeDescription: 'Point to chest then H-hands tap twice perpendicularly',
    twoHanded: true,
    tags: ['name', 'called', 'my name is', 'igama'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.02, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.45,
          shoulderY: -0.1,
          shoulderZ: 0.1,
          elbowX: 1.5,
          elbowY: -0.2,
          wristX: 0.3,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 400,
        head: { rotX: 0.08, rotY: 0, rotZ: 0 },
        torso: { leanX: 0.03, leanY: 0 },
        leftArm: {
          shoulderX: 0.35,
          shoulderY: 0.1,
          shoulderZ: 0.1,
          elbowX: 1.3,
          elbowY: 0.2,
          wristX: 0.1,
          wristY: 0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.0,
          middle: 0.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        rightArm: {
          shoulderX: 0.38,
          shoulderY: -0.1,
          shoulderZ: -0.1,
          elbowX: 1.3,
          elbowY: -0.2,
          wristX: 0.1,
          wristY: -0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.0,
          middle: 0.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  deaf_sasl: {
    id: 'deaf_sasl',
    gloss: 'DEAF / SASL-COMMUNITY',
    english: 'Deaf / SASL Community (Isithulu)',
    category: 'culture_sa',
    saContext: 'Index finger touches ear then mouth, signaling Deaf culture and South African Sign Language.',
    handshapeDescription: 'Index finger touches near ear then moves to touch mouth',
    twoHanded: false,
    tags: ['deaf', 'hard of hearing', 'sasl', 'signer', 'deaf community', 'sign language'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0.1, rotZ: 0.02 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.75,
          shoulderY: -0.25,
          shoulderZ: 0.4,
          elbowX: 1.6,
          elbowY: -0.3,
          wristX: 0.2,
          wristY: 0.1,
          wristZ: 0.1,
          thumb: 0.8,
          index: 0.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 400,
        head: { rotX: 0.05, rotY: 0.05, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.65,
          shoulderY: -0.15,
          shoulderZ: 0.2,
          elbowX: 1.5,
          elbowY: -0.2,
          wristX: 0.3,
          wristY: 0.0,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.0,
          middle: 1.0,
          ring: 1.0,
          pinky: 1.0,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  water: {
    id: 'water',
    gloss: 'WATER / AMANZI',
    english: 'Water (Amanzi / Metsi / Water)',
    category: 'everyday',
    saContext: 'W-handshape (three fingers up) taps lips gently twice.',
    handshapeDescription: 'W hand taps chin twice',
    twoHanded: false,
    tags: ['water', 'amanzi', 'metsi', 'drink', 'thirsty'],
    keyframes: [
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.65,
          shoulderY: -0.15,
          shoulderZ: 0.2,
          elbowX: 1.6,
          elbowY: -0.2,
          wristX: 0.2,
          wristY: 0.0,
          wristZ: 0.1,
          thumb: 0.9,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.9,
          fingerSpread: 0.3,
        },
        facialExpression: 'neutral',
      },
      {
        durationMs: 350,
        head: { rotX: 0.05, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: {
          shoulderX: 0.68,
          shoulderY: -0.15,
          shoulderZ: 0.2,
          elbowX: 1.65,
          elbowY: -0.2,
          wristX: 0.25,
          wristY: 0.0,
          wristZ: 0.1,
          thumb: 0.9,
          index: 0.0,
          middle: 0.0,
          ring: 0.0,
          pinky: 0.9,
          fingerSpread: 0.3,
        },
        facialExpression: 'neutral',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },

  love: {
    id: 'love',
    gloss: 'LOVE / THANDO',
    english: 'Love / I love you (Uthando)',
    category: 'everyday',
    saContext: 'Both fists crossed over chest / heart, or ILY universal hand sign.',
    handshapeDescription: 'Crossed arms over heart with warm smile',
    twoHanded: true,
    tags: ['love', 'care', 'heart', 'uthando', 'liefde', 'affection'],
    keyframes: [
      {
        durationMs: 400,
        head: { rotX: 0.1, rotY: 0.05, rotZ: 0.04 },
        torso: { leanX: 0.03, leanY: 0 },
        leftArm: {
          shoulderX: 0.45,
          shoulderY: 0.35,
          shoulderZ: 0.2,
          elbowX: 1.6,
          elbowY: 0.4,
          wristX: 0.2,
          wristY: 0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.8,
          middle: 0.8,
          ring: 0.8,
          pinky: 0.8,
          fingerSpread: 0.0,
        },
        rightArm: {
          shoulderX: 0.45,
          shoulderY: -0.35,
          shoulderZ: -0.2,
          elbowX: 1.6,
          elbowY: -0.4,
          wristX: 0.2,
          wristY: -0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.8,
          middle: 0.8,
          ring: 0.8,
          pinky: 0.8,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 400,
        head: { rotX: 0.12, rotY: 0.05, rotZ: 0.04 },
        torso: { leanX: 0.04, leanY: 0 },
        leftArm: {
          shoulderX: 0.45,
          shoulderY: 0.35,
          shoulderZ: 0.2,
          elbowX: 1.6,
          elbowY: 0.4,
          wristX: 0.2,
          wristY: 0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.8,
          middle: 0.8,
          ring: 0.8,
          pinky: 0.8,
          fingerSpread: 0.0,
        },
        rightArm: {
          shoulderX: 0.45,
          shoulderY: -0.35,
          shoulderZ: -0.2,
          elbowX: 1.6,
          elbowY: -0.4,
          wristX: 0.2,
          wristY: -0.1,
          wristZ: 0.0,
          thumb: 0.8,
          index: 0.8,
          middle: 0.8,
          ring: 0.8,
          pinky: 0.8,
          fingerSpread: 0.0,
        },
        facialExpression: 'smile',
      },
      {
        durationMs: 250,
        head: { rotX: 0, rotY: 0, rotZ: 0 },
        torso: { leanX: 0, leanY: 0 },
        leftArm: { ...REST_ARM_LEFT },
        rightArm: { ...REST_ARM_RIGHT },
        facialExpression: 'neutral',
      },
    ],
  },
};

// Generates A-Z fingerspelling kinematic poses
export function getFingerspellingPose(letter: string): BodyKeyframe {
  const char = letter.toUpperCase();
  // Base fingerspelling position: right hand raised chest/shoulder height
  const baseArm: ArmPose = {
    shoulderX: 0.5,
    shoulderY: -0.2,
    shoulderZ: 0.3,
    elbowX: 1.3,
    elbowY: -0.2,
    wristX: 0.1,
    wristY: 0.0,
    wristZ: 0.0,
    thumb: 0.0,
    index: 0.0,
    middle: 0.0,
    ring: 0.0,
    pinky: 0.0,
    fingerSpread: 0.2,
  };

  switch (char) {
    case 'A':
      baseArm.thumb = 0.0;
      baseArm.index = 1.0;
      baseArm.middle = 1.0;
      baseArm.ring = 1.0;
      baseArm.pinky = 1.0;
      break;
    case 'B':
      baseArm.thumb = 0.9;
      baseArm.index = 0.0;
      baseArm.middle = 0.0;
      baseArm.ring = 0.0;
      baseArm.pinky = 0.0;
      baseArm.fingerSpread = 0.0;
      break;
    case 'C':
      baseArm.thumb = 0.4;
      baseArm.index = 0.4;
      baseArm.middle = 0.4;
      baseArm.ring = 0.4;
      baseArm.pinky = 0.4;
      baseArm.wristX = 0.3;
      break;
    case 'D':
      baseArm.thumb = 0.8;
      baseArm.index = 0.0;
      baseArm.middle = 0.8;
      baseArm.ring = 0.8;
      baseArm.pinky = 0.8;
      break;
    case 'E':
      baseArm.thumb = 0.9;
      baseArm.index = 0.8;
      baseArm.middle = 0.8;
      baseArm.ring = 0.8;
      baseArm.pinky = 0.8;
      break;
    case 'F':
      baseArm.thumb = 0.8;
      baseArm.index = 0.8;
      baseArm.middle = 0.0;
      baseArm.ring = 0.0;
      baseArm.pinky = 0.0;
      baseArm.fingerSpread = 0.3;
      break;
    case 'I':
      baseArm.thumb = 0.9;
      baseArm.index = 1.0;
      baseArm.middle = 1.0;
      baseArm.ring = 1.0;
      baseArm.pinky = 0.0;
      break;
    case 'L':
      baseArm.thumb = 0.0;
      baseArm.index = 0.0;
      baseArm.middle = 1.0;
      baseArm.ring = 1.0;
      baseArm.pinky = 1.0;
      baseArm.fingerSpread = 0.9;
      break;
    case 'O':
      baseArm.thumb = 0.7;
      baseArm.index = 0.7;
      baseArm.middle = 0.7;
      baseArm.ring = 0.7;
      baseArm.pinky = 0.7;
      break;
    case 'V':
      baseArm.thumb = 0.9;
      baseArm.index = 0.0;
      baseArm.middle = 0.0;
      baseArm.ring = 1.0;
      baseArm.pinky = 1.0;
      baseArm.fingerSpread = 0.7;
      break;
    case 'Y':
      baseArm.thumb = 0.0;
      baseArm.index = 1.0;
      baseArm.middle = 1.0;
      baseArm.ring = 1.0;
      baseArm.pinky = 0.0;
      baseArm.fingerSpread = 1.0;
      break;
    default:
      // General fingerspelling posture
      baseArm.thumb = 0.2;
      baseArm.index = 0.1;
      baseArm.middle = 0.3;
      baseArm.ring = 0.5;
      baseArm.pinky = 0.6;
      break;
  }

  return {
    durationMs: 380,
    head: { rotX: 0.04, rotY: 0, rotZ: 0 },
    torso: { leanX: 0.01, leanY: 0 },
    leftArm: { ...REST_ARM_LEFT },
    rightArm: baseArm,
    facialExpression: 'neutral',
  };
}

/**
 * Looks up the sign for an exact word or phrase.
 *
 * Matching is exact against the entry key or its tags. It previously also
 * matched when the phrase merely *contained* a tag, which made the phrase
 * parser greedy: "sawubona thank you" matched SAWUBONA on the substring, then
 * consumed all three words, silently dropping THANK-YOU from the output. The
 * parser already tries progressively shorter windows, so containment is not
 * needed to match a sign inside a longer sentence.
 */
export function lookupSaslSign(text: string): SaslSign | null {
  const clean = text.toLowerCase().trim();
  if (SASL_DICTIONARY[clean]) return SASL_DICTIONARY[clean];

  for (const sign of Object.values(SASL_DICTIONARY)) {
    if (sign.tags.some((tag) => tag.toLowerCase().trim() === clean)) {
      return sign;
    }
  }
  return null;
}

export function parseTextToSignTokens(rawText: string): {
  tokens: TranslationToken[];
  keyframes: BodyKeyframe[];
} {
  if (!rawText.trim()) {
    return { tokens: [], keyframes: [REST_POSE] };
  }

  const clean = rawText
    .replace(/[^\w\s]/g, '')
    .trim()
    .toLowerCase();

  const words = clean.split(/\s+/).filter(Boolean);
  const tokens: TranslationToken[] = [];
  const keyframes: BodyKeyframe[] = [];

  let i = 0;
  while (i < words.length) {
    // Prefer the longest phrase that is a known sign, so "thank you" wins over
    // "thank". Windows are clamped to the words that actually remain — an
    // unclamped slice makes the three-word pass re-test a shorter phrase and
    // then over-advance past it.
    let matched = false;

    for (let span = Math.min(3, words.length - i); span >= 1; span--) {
      const phrase = words.slice(i, i + span).join(' ');
      const sign = lookupSaslSign(phrase);
      if (!sign) continue;

      // Two adjacent words can be synonyms for one sign ("help emergency"),
      // which would otherwise animate the same sign twice in a row.
      const previous = tokens[tokens.length - 1];
      if (previous?.signId !== sign.id) {
        tokens.push({
          word: phrase,
          gloss: sign.gloss,
          isFingerspelled: false,
          signId: sign.id,
        });
        keyframes.push(...sign.keyframes);
      }

      i += span;
      matched = true;
      break;
    }

    if (matched) continue;

    // Not in the dictionary: fingerspell it letter by letter.
    const word = words[i];
    tokens.push({
      word,
      gloss: word.toUpperCase() + ' (FS)',
      isFingerspelled: true,
    });

    for (const char of word) {
      keyframes.push(getFingerspellingPose(char));
    }
    i += 1;
  }

  // Return to rest pose at end of sequence
  keyframes.push(REST_POSE);

  return { tokens, keyframes };
}
