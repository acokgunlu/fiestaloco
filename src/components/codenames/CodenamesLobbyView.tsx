import React, { useState } from 'react';
import { CodenamesSettings } from '../../types/codenames';
import { CODENAMES_CATEGORIES } from '../../data/codenamesWords';
import { CodenamesRulesModal } from './CodenamesRulesModal';
import {
  Shield,
  UserCheck,
  Play,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Users,
  Shuffle,
  Flame,
} from 'lucide-react';
import { playClickSound, playTurnSound } from '../../utils/audio';

interface CodenamesLobbyViewProps {
  onStartGame: (settings: CodenamesSettings) => void;
  onReturnToHub: () => void;
}

export function CodenamesLobbyView({ onStartGame, onReturnToHub }: CodenamesLobbyViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startingTeam, setStartingTeam] = useState<'random' | 'red' | 'blue'>('random');
  const [rulesOpen, setRulesOpen] = useState(false);

  const [redPlayers, setRedPlayers] = useState<string[]>([
    'Kırmızı Lider',
    'Ajan Kemal',
    'Ajan Ayşe',
  ]);
  const [bluePlayers, setBluePlayers] = useState<string[]>([
    'Mavi Lider',
    'Ajan Can',
    'Ajan Zeynep',
  ]);

  const handleStart = () => {
    playTurnSound();
    onStartGame({
      startingTeam,
      category: selectedCategory,
      timerSeconds: 0,
      aiSpymaster: false,
    });
  };

  return (
    <div
      id="codenames-lobby-view"
      className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-5 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-purple-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white text-center shadow-xl relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-xs border border-white/30">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Gizli İstihbarat & İpucu Arenası</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          🕵️‍♂️ GİZLİ AJANLAR (CODENAMES)
        </h1>
        <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto mt-2 font-medium">
          İki takım, 25 kod kelimesi ve 1 ölümcül Kara Suikastçı! Liderinizin verdiği gizli ipuçlarını çözerek kendi ajanlarınızı ilk siz açığa çıkarın.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Category & Starting Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <span>🎲 Kelime Havuzu & Tema</span>
            </h3>
            <button
              onClick={() => setRulesOpen(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Nasıl Oynanır?</span>
            </button>
          </div>

          {/* Category selection */}
          <div className="space-y-2">
            {CODENAMES_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setSelectedCategory(cat.id);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{cat.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{cat.description}</div>
                  </div>
                </div>
                {selectedCategory === cat.id && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Starting Team Selector */}
          <div className="pt-2 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              İlk Başlayacak Takım (9 Ajanlı):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'random', label: '🎲 Rastgele' },
                { id: 'red', label: '🔴 Kırmızı' },
                { id: 'blue', label: '🔵 Mavi' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setStartingTeam(item.id as any);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                    startingTeam === item.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Team Squads (Red vs Blue) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Takım Kadroları (2-12+ Oyuncu)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Red Squad */}
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-rose-900 dark:text-rose-200 text-xs uppercase tracking-wider pb-1 border-b border-rose-200 dark:border-rose-900">
                  <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Kırmızı Takım</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                    <span>👑 Lider:</span> <span>Kırmızı Lider</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] pl-2 border-l border-rose-300 dark:border-rose-800 space-y-0.5">
                    <div>• Ajan Kemal</div>
                    <div>• Ajan Ayşe</div>
                  </div>
                </div>
              </div>

              {/* Blue Squad */}
              <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-sky-900 dark:text-sky-200 text-xs uppercase tracking-wider pb-1 border-b border-sky-200 dark:border-sky-900">
                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Mavi Takım</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                    <span>👑 Lider:</span> <span>Mavi Lider</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] pl-2 border-l border-sky-300 dark:border-sky-800 space-y-0.5">
                    <div>• Ajan Can</div>
                    <div>• Ajan Zeynep</div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic leading-relaxed">
              İpucu: Tek cihazda (Pass & Play) veya projeksiyon/TV ekranında oynarken liderler "👁️ Lider Haritası" butonunu kullanarak kartların gizli renklerine bakabilir.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4">
            <button
              id="btn-start-codenames-game"
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-purple-600 to-sky-600 hover:from-red-500 hover:to-sky-500 text-white font-black text-base rounded-2xl shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>AJANLARI SAHAYA SÜR! 🕵️‍♂️</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                onReturnToHub();
              }}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Parti Kulübü Ana Menüsüne Dön</span>
            </button>
          </div>
        </div>
      </div>

      <CodenamesRulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
