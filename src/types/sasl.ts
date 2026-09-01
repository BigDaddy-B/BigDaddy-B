/**
 * South African Sign Language (SASL) Data Structures & Kinematics Types
 * Synaera-SA Non-Profit Accessible Translation Engine
 */

export interface ArmPose {
  shoulderX: number; // Pitch
  shoulderY: number; // Yaw
  shoulderZ: number; // Roll
  elbowX: number;    // Flexion
  elbowY: number;    // Rotation
  wristX: number;    // Wrist pitch
  wristY: number;    // Wrist yaw
  wristZ: number;    // Wrist roll
  // Fingers: 0 = fully extended (open), 1 = fully bent (fist)
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  // Spread: 0 = close together, 1 = wide apart
  fingerSpread?: number;
}

export interface BodyKeyframe {
  durationMs: number;
  head: {
    rotX: number; // nod up/down
    rotY: number; // turn left/right
    rotZ: number; // tilt
  };
  torso: {
    leanX: number;
    leanY: number;
  };
  leftArm: ArmPose;
  rightArm: ArmPose;
  facialExpression?: 'neutral' | 'smile' | 'question_nod' | 'emphatic' | 'concern';
  mouthMorpheme?: string; // SASL mouth gesture (e.g. 'pff', 'th', 'ee')
}

export interface SaslSign {
  id: string;
  gloss: string;
  english: string;
  category: 'greetings' | 'emergency' | 'everyday' | 'culture_sa' | 'questions' | 'alphabet' | 'numbers';
  saContext?: string; // Regional / South African linguistic nuance
  handshapeDescription: string;
  twoHanded: boolean;
  keyframes: BodyKeyframe[];
  tags: string[];
}

export type TranslationMode = 'speech-to-sign' | 'sign-to-voice' | 'text-to-sign' | 'dual-split';

export interface TranslationToken {
  word: string;
  gloss: string;
  isFingerspelled: boolean;
  signId?: string;
  active?: boolean;
}

export interface ConversationMessage {
  id: string;
  sender: 'signer' | 'speaker' | 'system';
  senderLabel: string;
  text: string;
  gloss?: string;
  timestamp: string;
  confidence?: number;
  regionalNote?: string;
}

export interface CameraLandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}
