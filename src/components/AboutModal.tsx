import React from 'react';
import { X, Heart, Github, ExternalLink, ShieldCheck, Award, Flag, Users, Cpu, Eye, Volume2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="about-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#020617] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-black/40 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-blue-300">
              <Heart className="w-5 h-5 fill-blue-400/20 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Synaera-SA: Accessible SASL Bridge</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
                  Open Source & Non-Profit
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bridging communication for Deaf, Hard-of-Hearing, and hearing communities across South Africa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Mission & South African Context */}
          <div className="p-5 bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-blue-950/30 border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Flag className="w-4 h-4 text-amber-400" />
              <span>South African Sign Language (SASL) Historic Milestone</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              In July 2023, the South African National Assembly officially signed the South African Sign Language Act into law, making <strong className="text-white">SASL the 12th official language of South Africa</strong>. Synaera-SA exists as a free, open-source accessibility bridge to empower inclusive healthcare, education, transport, and public service interactions.
            </p>
          </div>

          {/* Reference Architecture */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Github className="w-4 h-4 text-blue-400" />
              <span>Open-Source Reference Architecture</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synaera-SA builds upon the pioneering open-source accessibility framework from{' '}
              <a
                href="https://github.com/MehrinFirdousi/Synaera-TeamSemaphore"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-semibold inline-flex items-center gap-1"
              >
                <span>Synaera-TeamSemaphore</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              , extending it with dual-directional real-time translation, WebGL 3D blue mannequin kinematics, and South African English speech profiles (`en-ZA`).
            </p>
          </div>

          {/* System Modules Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>1. Camera & Vision Ingestion</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Continuous gesture landmark extraction tracking hands, fingers, and torso coordinates for SASL classification.
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>2. Live Spoken Voice (en-ZA)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instant Text-to-Speech (TTS) engine speaking translated SASL gestures out loud in natural South African English.
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>3. 3D Blue Mannequin Rig</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gender-neutral half-body avatar with 5-finger articulated kinematics for fluid SASL sign generation and fingerspelling.
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>4. Accessible Community Privacy</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Non-profit open-source design with client-first local processing and zero telemetry harvesting.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Non-Profit Accessibility Initiative • Made for South Africa 🇿🇦</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition"
          >
            Close & Return
          </button>
        </div>
      </div>
    </div>
  );
};
