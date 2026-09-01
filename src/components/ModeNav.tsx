/**
 * Mode navigation.
 *
 * Two presentations of the same four choices:
 *
 * - Wide screens get a row of tabs in the header.
 * - Narrow screens get a fixed bottom tab bar. The tabs previously lived in a
 *   cramped `overflow-x-auto` strip inside the header, which on a phone clipped
 *   three of the four modes with no visible scroll affordance — they were
 *   effectively undiscoverable. A bottom bar shows all four at once and sits
 *   where a thumb can reach.
 */

import React from 'react';
import { MODES } from '../lib/modes';
import type { TranslationMode } from '../types/sasl';

interface ModeNavProps {
  activeMode: TranslationMode;
  onChange: (mode: TranslationMode) => void;
}

/** Header tabs — hidden below `lg`, where the bottom bar takes over. */
export const ModeTabs: React.FC<ModeNavProps> = ({ activeMode, onChange }) => (
  <nav
    aria-label="Translation mode"
    className="hidden lg:flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 shadow-lg"
  >
    {MODES.map(({ id, label, help, Icon }) => {
      const active = activeMode === id;
      return (
        <button
          key={id}
          id={`mode-${id}-btn`}
          onClick={() => onChange(id)}
          aria-current={active ? 'page' : undefined}
          title={help}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            active
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      );
    })}
  </nav>
);

/** Fixed bottom bar — shown below `lg` only. */
export const ModeBottomBar: React.FC<ModeNavProps> = ({ activeMode, onChange }) => (
  <nav
    aria-label="Translation mode"
    className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
  >
    <div className="grid grid-cols-4">
      {MODES.map(({ id, shortLabel, help, Icon }) => {
        const active = activeMode === id;
        return (
          <button
            key={id}
            id={`mobile-mode-${id}-btn`}
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            aria-label={help}
            // A generous tap target: the whole cell is pressable, not just the icon.
            className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[60px] transition-colors ${
              active ? 'text-blue-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span
              className={`flex items-center justify-center w-10 h-7 rounded-lg transition-colors ${
                active ? 'bg-blue-600/25' : ''
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <span className={`text-[11px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
              {shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);
