/**
 * A one-line instruction for the current mode.
 *
 * The app opens straight into a camera view with no explanation of what to do,
 * which is the moment most first-time users give up. This says the one thing
 * they need, and stays dismissed per mode so it never nags a returning user.
 */

import React, { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { MODE_BY_ID } from '../lib/modes';
import type { TranslationMode } from '../types/sasl';

const STORAGE_KEY = 'synaera:dismissed-help';

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    // Private browsing, or storage blocked entirely — just show the hint.
    return [];
  }
}

interface HelpBannerProps {
  mode: TranslationMode;
}

export const HelpBanner: React.FC<HelpBannerProps> = ({ mode }) => {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const definition = MODE_BY_ID[mode];
  if (!definition || dismissed.includes(mode)) return null;

  const dismiss = () => {
    const next = [...dismissed, mode];
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Not being able to remember the dismissal is not worth an error.
    }
  };

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-blue-400/25 bg-blue-600/10 px-4 py-3">
      <Lightbulb className="mt-0.5 w-4 h-4 shrink-0 text-blue-300" />
      <p className="flex-1 text-sm leading-snug text-blue-100">{definition.help}</p>
      <button
        onClick={dismiss}
        aria-label="Dismiss this tip"
        className="shrink-0 rounded-lg p-1 text-blue-300/70 transition hover:bg-white/10 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
