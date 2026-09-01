import React, { useState } from 'react';
import { X, Search, BookOpen, Sparkles, Volume2, Play, Flag, Heart } from 'lucide-react';
import { SASL_DICTIONARY, getFingerspellingPose, REST_POSE } from '../lib/saslDictionary';
import { SaslSign, BodyKeyframe } from '../types/sasl';
import { FlatMannequin } from './FlatMannequin';

interface SaslDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSignForAvatar?: (sign: SaslSign) => void;
}

export const SaslDictionaryModal: React.FC<SaslDictionaryModalProps> = ({
  isOpen,
  onClose,
  onSelectSignForAvatar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewSign, setPreviewSign] = useState<SaslSign>(SASL_DICTIONARY['sawubona']);
  const [previewKeyframes, setPreviewKeyframes] = useState<BodyKeyframe[]>(SASL_DICTIONARY['sawubona'].keyframes);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Signs' },
    { id: 'greetings', label: 'Greetings (Sawubona)' },
    { id: 'culture_sa', label: 'South African Context' },
    { id: 'emergency', label: 'Emergency & Medical' },
    { id: 'everyday', label: 'Everyday Life' },
    { id: 'questions', label: 'Questions (Kunjani)' },
    { id: 'alphabet', label: 'Alphabet (A-Z)' },
  ];

  // Alphabet signs list
  const alphabetLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const filteredSigns = Object.values(SASL_DICTIONARY).filter((sign) => {
    const matchesCat = selectedCategory === 'all' || sign.category === selectedCategory;
    const matchesSearch =
      sign.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.gloss.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleSelectSign = (sign: SaslSign) => {
    setPreviewSign(sign);
    setPreviewKeyframes(sign.keyframes);
    if (onSelectSignForAvatar) {
      onSelectSignForAvatar(sign);
    }
  };

  const handleSelectLetter = (letter: string) => {
    const pose = getFingerspellingPose(letter);
    const mockSign: SaslSign = {
      id: `letter_${letter}`,
      gloss: `LETTER: ${letter}`,
      english: `Fingerspelling Letter '${letter}'`,
      category: 'alphabet',
      handshapeDescription: `SASL manual alphabet handshape for letter ${letter}`,
      twoHanded: false,
      keyframes: [pose, REST_POSE],
      tags: ['alphabet', letter],
      saContext: 'Standard SASL one-handed manual alphabet',
    };
    setPreviewSign(mockSign);
    setPreviewKeyframes([pose, REST_POSE]);
  };

  return (
    <div id="sasl-dictionary-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#020617] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-black/40 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-blue-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">South African Sign Language (SASL) Dictionary</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  12th Official Language
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore authentic SASL signs, kinematics, and South African regional phrasing
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

        {/* Content: Left List / Right 3D Avatar Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Sign Browser */}
          <div className="lg:col-span-7 p-5 flex flex-col gap-4 overflow-y-auto border-r border-white/10">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SASL signs (e.g. Sawubona, Sharp, Doctor, Taxi)..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Alphabet Quick Grid */}
            {selectedCategory === 'alphabet' && (
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-2">
                <div className="text-xs font-semibold text-slate-300">A-Z SASL Fingerspelling Alphabet:</div>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                  {alphabetLetters.map((l) => (
                    <button
                      key={l}
                      onClick={() => handleSelectLetter(l)}
                      className={`p-2 rounded-xl text-xs font-bold text-center border transition ${
                        previewSign.gloss.includes(l)
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sign Cards List */}
            <div className="space-y-2 overflow-y-auto pr-1">
              {filteredSigns.map((sign) => {
                const isSelected = previewSign.id === sign.id;
                return (
                  <div
                    key={sign.id}
                    onClick={() => handleSelectSign(sign)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-400/50 shadow-lg ring-1 ring-blue-400/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{sign.gloss}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-950/80 border border-blue-500/30 text-cyan-300">
                        {sign.category}
                      </span>
                    </div>

                    <div className="text-xs text-blue-200 mt-0.5">{sign.english}</div>

                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {sign.handshapeDescription}
                    </div>

                    {sign.saContext && (
                      <div className="mt-2 text-[11px] font-medium text-amber-300/90 flex items-center gap-1">
                        <Flag className="w-3 h-3 text-amber-400" />
                        <span>{sign.saContext}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 3D Blue Mannequin Visualizer */}
          <div className="lg:col-span-5 p-5 bg-black/40 flex flex-col gap-4 justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live 3D Kinematics</span>
              <span className="text-xs font-mono text-cyan-400">{previewSign.gloss}</span>
            </div>

            <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-white/10">
              <FlatMannequin
                keyframeQueue={previewKeyframes}
                speedMultiplier={1.0}
                activeGloss={previewSign.gloss}
                activeWord={previewSign.english}
              />
            </div>

            {/* Sign details breakdown */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="font-bold text-white text-sm">{previewSign.english}</div>
              <div className="text-slate-300 text-xs">{previewSign.handshapeDescription}</div>
              {previewSign.saContext && (
                <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-blue-200 text-[11px]">
                  <strong className="text-white">South African Context:</strong> {previewSign.saContext}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setPreviewKeyframes([...previewSign.keyframes]);
              }}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Replay 3D Avatar Kinematics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
