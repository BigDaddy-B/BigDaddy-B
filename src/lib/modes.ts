/**
 * The four translation modes, defined once so the header tabs, the mobile tab
 * bar and the per-mode help text can never drift apart.
 */

import { Camera, Layers, MessageSquare, Mic, type LucideIcon } from 'lucide-react';
import type { TranslationMode } from '../types/sasl';

export interface ModeDefinition {
  id: TranslationMode;
  /** Full label, used on wide screens. */
  label: string;
  /** Two-word label for the mobile tab bar, where space is tight. */
  shortLabel: string;
  /** One line telling a first-time user exactly what to do. */
  help: string;
  Icon: LucideIcon;
}

export const MODES: ModeDefinition[] = [
  {
    id: 'sign-to-voice',
    label: 'Sign → Voice',
    shortLabel: 'Sign',
    help: 'Hold a sign in front of your camera. When it registers, the English is spoken out loud.',
    Icon: Camera,
  },
  {
    id: 'speech-to-sign',
    label: 'Speak → Sign',
    shortLabel: 'Speak',
    help: 'Tap the microphone and speak English. The avatar signs what you say.',
    Icon: Mic,
  },
  {
    id: 'text-to-sign',
    label: 'Type → Sign',
    shortLabel: 'Type',
    help: 'Type English and press Sign this. Works with no camera or microphone.',
    Icon: MessageSquare,
  },
  {
    id: 'dual-split',
    label: 'Conversation',
    shortLabel: 'Talk',
    help: 'Both directions at once — one person signs, the other speaks or types.',
    Icon: Layers,
  },
];

export const MODE_BY_ID: Record<string, ModeDefinition> = Object.fromEntries(
  MODES.map((m) => [m.id, m]),
);
