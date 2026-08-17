import React, { useState } from 'react';
import { Player, GameSettings, GameMode, WordPair } from '../types';
import { CATEGORIES, DEFAULT_PLAYER_PALETTE, getRandomWordPair } from '../data/wordPacks';
import {
  Users,
  Play,
  Plus,
  Trash2,
  Bot,
  Sparkles,
  Settings,
  ShieldAlert,
  Flame,
  Palette,
  Shuffle,
  Info,
  Loader2,
} from 'lucide-react';
import { playClickSound, playTurnSound } from '../utils/audio';
import { getApiUrl } from '../utils/serverUrl';

interface LobbyViewProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onStartGame: (customPair?: WordPair) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  players,
  onUpdatePlayers,
  settings,
  onUpdateSettings,
  onStartGame,
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'settings' | 'custom'>('players');
  const [customCrewWord, setCustomCrewWord] = useState('');
  const [customImposterWord, setCustomImposterWord] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiThemePrompt, setAiThemePrompt] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Helper to add player
  const handleAddPlayer = (isBot: boolean = false) => {
    if (players.length >= 8) return;
    playClickSound();
    const nextIdx = players.length;
    const palette = DEFAULT_PLAYER_PALETTE[nextIdx % DEFAULT_PLAYER_PALETTE.length];
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: isBot ? `Bot ${players.filter((p) => p.isBot).length + 1}` : `Player ${nextIdx + 1}`,
      color: palette.color,
      colorName: palette.name,
      avatar: palette.avatar,
      isImposter: false,
      isBot,
      score: 0,
    };
    onUpdatePlayers([...players, newPlayer]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 3) return; // Keep minimum 3
    playClickSound();
    onUpdatePlayers(players.filter((p) => p.id !== id));
  };

  const handlePlayerNameChange = (id: string, name: string) => {
    onUpdatePlayers(players.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handlePlayerColorChange = (id: string, paletteIdx: number) => {
    playClickSound();
    const palette = DEFAULT_PLAYER_PALETTE[paletteIdx];
    onUpdatePlayers(
      players.map((p) =>
        p.id === id
          ? {
              ...p,
              color: palette.color,
              colorName: palette.name,
              avatar: palette.avatar,
            }
          : p
      )
    );
  };

  // Quick preset button (e.g. 4, 5, 6 players)
  const setPlayerCountPreset = (targetCount: number) => {
    playClickSound();
    let updated: Player[] = [];
    for (let i = 0; i < targetCount; i++) {
      const palette = DEFAULT_PLAYER_PALETTE[i % DEFAULT_PLAYER_PALETTE.length];
      if (players[i]) {
        updated.push(players[i]);
      } else {
        updated.push({
          id: `player-${Date.now()}-${i}`,
          name: `Player ${i + 1}`,
          color: palette.color,
          colorName: palette.name,
          avatar: palette.avatar,
          isImposter: false,
          score: 0,
        });
      }
    }
    onUpdatePlayers(updated);
  };

  // AI Word Generation
  const handleGenerateAiWords = async () => {
    setIsGeneratingAi(true);
    setAiFeedback(null);
    try {
      const res = await fetch(getApiUrl('/api/generate-words'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: aiThemePrompt || 'Fun Party Topics' }),
      });
      const data = await res.json();
      if (data?.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        setCustomCategory(pair.category);
        setCustomCrewWord(pair.crewWord);
        setCustomImposterWord(pair.imposterWord);
        setAiFeedback(`Generated: "${pair.crewWord}" vs "${pair.imposterWord}" (${pair.category})`);
      } else {
        // Fallback local random tricky pair
        const pair = getRandomWordPair();
        setCustomCategory(pair.category);
        setCustomCrewWord(pair.crewWord);
        setCustomImposterWord(pair.imposterWord);
        setAiFeedback(`Picked from word bank: "${pair.crewWord}" vs "${pair.imposterWord}"`);
      }
    } catch {
      const pair = getRandomWordPair();
      setCustomCategory(pair.category);
      setCustomCrewWord(pair.crewWord);
      setCustomImposterWord(pair.imposterWord);
      setAiFeedback(`Selected: "${pair.crewWord}" vs "${pair.imposterWord}"`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleStart = () => {
    playTurnSound();
    if (customCrewWord.trim() && customImposterWord.trim()) {
      onStartGame({
        category: customCategory.trim() || 'Custom',
        crewWord: customCrewWord.trim(),
        imposterWord: customImposterWord.trim(),
      });
    } else {
      onStartGame();
    }
  };

  return (
    <div id="lobby-view" className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Hero Title & Description */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>3 - 8 Player Drawing Imposter Party Game (3, 4, 5, 6, 8)</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          One Line. One Imposter.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Everyone draws <strong>one continuous stroke</strong> to illustrate a secret word.
          One person has a different word and is trying to blend in!
        </p>
      </div>

      {/* Quick Player Count Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Quick Setup:</span>
        {[3, 4, 5, 6, 8].map((count) => (
          <button
            key={count}
            id={`preset-btn-${count}`}
            onClick={() => setPlayerCountPreset(count)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              players.length === count
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-600/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            {count} Players
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center max-w-md mx-auto border border-slate-200 dark:border-slate-800">
        <button
          id="tab-players"
          onClick={() => {
            playClickSound();
            setActiveTab('players');
          }}
          className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'players'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Players ({players.length})</span>
        </button>
        <button
          id="tab-settings"
          onClick={() => {
            playClickSound();
            setActiveTab('settings');
          }}
          className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Game Rules</span>
        </button>
        <button
          id="tab-custom"
          onClick={() => {
            playClickSound();
            setActiveTab('custom');
          }}
          className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'custom'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Custom / AI</span>
        </button>
      </div>

      {/* Tab 1: Players Roster */}
      {activeTab === 'players' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <span>Player Lineup</span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {players.length} / 8
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each player will draw using their assigned line color.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-add-bot"
                onClick={() => handleAddPlayer(true)}
                disabled={players.length >= 8}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40"
                title="Add an AI Bot to fill a slot"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>+ Add Bot</span>
              </button>
              <button
                id="btn-add-player"
                onClick={() => handleAddPlayer(false)}
                disabled={players.length >= 8}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-sm disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Player</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {players.map((player, idx) => (
              <div
                key={player.id}
                id={`player-card-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 gap-2"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Color circle picker */}
                  <div className="relative group">
                    <button
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center shrink-0 transition-transform active:scale-90"
                      style={{ backgroundColor: player.color }}
                      title="Change stroke color"
                    >
                      <span className="text-xs">{player.avatar}</span>
                    </button>
                  </div>

                  {/* Name input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={player.name}
                      maxLength={18}
                      onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                      placeholder={`Player ${idx + 1}`}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {player.colorName}
                        {player.isBot && ' (AI Bot)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Color quick toggle & delete */}
                <div className="flex items-center gap-1">
                  <div className="flex gap-1 overflow-x-auto max-w-[70px] py-1">
                    {DEFAULT_PLAYER_PALETTE.slice(0, 4).map((pal, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handlePlayerColorChange(player.id, pIdx)}
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-xs"
                        style={{ backgroundColor: pal.color }}
                      />
                    ))}
                  </div>

                  {players.length > 3 && (
                    <button
                      id={`btn-remove-player-${idx}`}
                      onClick={() => handleRemovePlayer(player.id)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove player"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {players.length < 4 && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Recommended: 4 to 6 players for the most fun bluffing and drawing deductions!</span>
            </p>
          )}
        </div>
      )}

      {/* Tab 2: Settings & Categories */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Game Rules & Settings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure rounds, categories, and imposter mode.</p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Imposter Secret Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="mode-diff-word"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ ...settings, gameMode: 'different_word' });
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  settings.gameMode === 'different_word'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Different Tricky Word (Standard)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Imposter gets a closely related word (e.g., Crew: <em>"Airplane"</em> vs Imposter: <em>"Helicopter"</em>).
                </p>
              </button>

              <button
                type="button"
                id="mode-blind-imposter"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ ...settings, gameMode: 'blind_imposter' });
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  settings.gameMode === 'blind_imposter'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Blind Imposter (Hardcore)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Imposter only knows the broad category (e.g. <em>"Animals"</em>) and must fake their way through!
                </p>
              </button>
            </div>
          </div>

          {/* Strokes per player */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Drawing Turns per Player
            </label>
            <div className="flex gap-3">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  id={`round-turns-${num}`}
                  onClick={() => {
                    playClickSound();
                    onUpdateSettings({ ...settings, roundsPerPlayer: num });
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-all ${
                    settings.roundsPerPlayer === num
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  {num === 1 ? '1 Stroke per Player (Blitz)' : '2 Strokes per Player (Recommended)'}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Word Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                id="cat-all"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ ...settings, category: 'all' });
                }}
                className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all ${
                  settings.category === 'all'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="font-bold text-sm">🎲 All Categories</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Surprise mix of words</div>
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-${cat.id}`}
                  onClick={() => {
                    playClickSound();
                    onUpdateSettings({ ...settings, category: cat.id });
                  }}
                  className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all ${
                    settings.category === cat.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="font-bold text-sm">{cat.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{cat.pairs.length} word pairs</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Custom Word Pair or AI */}
      {activeTab === 'custom' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Custom Word Pair or AI Generation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your own sneaky secret pair or ask Gemini AI to create tricky concepts!
            </p>
          </div>

          {/* AI Generator Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 dark:border-indigo-900 space-y-3">
            <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
              Generate AI Word Pair by Theme:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 90s Cartoons, Space Sci-Fi, Street Food..."
                value={aiThemePrompt}
                onChange={(e) => setAiThemePrompt(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                id="btn-generate-ai"
                onClick={handleGenerateAiWords}
                disabled={isGeneratingAi}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors shrink-0"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isGeneratingAi ? 'Generating...' : 'AI Generate'}</span>
              </button>
            </div>
            {aiFeedback && (
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900">
                {aiFeedback}
              </p>
            )}
          </div>

          {/* Manual inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category Hint (Public)
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Movies"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Crew Word (Majority)
              </label>
              <input
                type="text"
                value={customCrewWord}
                onChange={(e) => setCustomCrewWord(e.target.value)}
                placeholder="e.g. Harry Potter"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Imposter Word (1 Person)
              </label>
              <input
                type="text"
                value={customImposterWord}
                onChange={(e) => setCustomImposterWord(e.target.value)}
                placeholder="e.g. Gandalf"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Start Game Action */}
      <div className="pt-2 flex flex-col items-center gap-3">
        <button
          id="btn-start-game"
          onClick={handleStart}
          className="w-full sm:w-auto min-w-[280px] px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-lg font-black rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-white" />
          <span>START GAME ({players.length} PLAYERS)</span>
        </button>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pass & Play on one device • Secret cards peek • 1 stroke per turn
        </p>
      </div>
    </div>
  );
};
