import React from 'react';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Grid,
  Trophy,
  Sun,
  Moon,
  Languages,
} from 'lucide-react';
import { GamePhase } from '../types';
import { PartyGameType } from '../types/partyGames';
import { playClickSound } from '../utils/audio';
import { AppTheme } from '../utils/theme';

import { t, getLang, toggleLang } from '../i18n';
interface HeaderBarProps {
  activeModule?: 'arcade_hub' | PartyGameType;
  phase?: GamePhase | string;
  currentRound?: number;
  maxRounds?: number;
  onOpenRules: () => void;
  onRestart: () => void;
  onSelectGameHub?: () => void;
  onOpenLeaderboard?: () => void;
  soundActive: boolean;
  onToggleSound: () => void;
  theme?: AppTheme;
  onToggleTheme?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeModule = 'arcade_hub',
  phase = 'LOBBY',
  currentRound = 1,
  maxRounds = 5,
  onOpenRules,
  onRestart,
  onSelectGameHub,
  onOpenLeaderboard,
  soundActive,
  onToggleSound,
  theme = 'light',
  onToggleTheme,
}) => {
  const getGameIcon = () => {
    switch (activeModule) {
      case 'trivia_pursuit':
        return '🧠';
      case 'codenames':
        return '🕵️';
      case 'imposter':
        return '🎭';
      case 'bluff':
        return '🤥';
      case 'bomb':
        return '💣';
      case 'race':
        return '🏇';
      case 'colory':
        return '🎨';
      case 'timing':
        return '⏱️';
      default:
        return '🎮';
    }
  };

  const getGameTitle = () => {
    switch (activeModule) {
      case 'trivia_pursuit':
        return 'Trivia Pursuit';
      case 'codenames':
        return 'Gizli Ajanlar';
      case 'imposter':
        return 'Sahtekâr Ressam';
      case 'bluff':
        return t('Yalan Ustası');
      case 'bomb':
        return 'Saatli Bomba';
      case 'race':
        return t('At Yarışı');
      case 'colory':
        return 'Colory';
      case 'timing':
        return t('Tam Zamanında');
      default:
        return 'Parti Merkezi';
    }
  };

  const getGameSubtitle = () => {
    switch (activeModule) {
      case 'trivia_pursuit':
        return t('Bilgi çarkı & 6 kategori rozet savaşı');
      case 'codenames':
        return t('Kırmızı vs Mavi Takım İstihbarat Savaşı');
      case 'imposter':
        return t('Her oyuncuya 1 sürekli çizgi');
      case 'bluff':
        return t('Yaratıcı yalanlar & gerçek trivia');
      case 'bomb':
        return 'Tik tak bomba & kelime hecesi';
      case 'race':
        return t('Ganyan · plase · ikili — kuponunu yatır');
      case 'colory':
        return t('Rengi hatırla, en yakınını bul');
      case 'timing':
        return t('İçinden say, tam vaktinde bas');
      default:
        return t('Çok oyunculu parti oyunları');
    }
  };

  return (
    <header
      id="game-header-bar"
      className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-xs transition-colors"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              playClickSound();
              if (onSelectGameHub) onSelectGameHub();
            }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-500/20 text-white font-black text-lg ring-2 ring-amber-500/30 transition-transform active:scale-95 cursor-pointer"
            title={t('FiestaLoco Ana Menü')}
          >
            {getGameIcon()}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={() => {
                  playClickSound();
                  if (onSelectGameHub) onSelectGameHub();
                }}
                className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Fiesta<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-600">Loco</span>
              </h1>
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                <span>
                  {getGameTitle()}
                </span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>
                {getGameSubtitle()}
              </span>
              {activeModule === 'imposter' && phase !== 'LOBBY' && (
                <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                  Tur {currentRound}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Phase Indicator Badge (For Imposter Line) */}
        {activeModule === 'imposter' && phase !== 'LOBBY' && (
          <div className="hidden md:flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
            <span>
              {phase === 'WORD_REVEAL' && t('Rol & Kelime Kartı Aşaması')}
              {phase === 'DRAWING' && t('Çizim Sırası Canlı Devam Ediyor')}
              {phase === 'DISCUSSION' && t('Çizgileri İnceleyin & Tartışın')}
              {phase === 'VOTING' && t('Sahtekâr İçin Gizli Oylama')}
              {phase === 'IMPOSTER_GUESS' && t('Sahtekâr Kelime Tahmin Düellosu')}
              {phase === 'RESULTS' && t('Tur Sonuçları & Puan Durumu')}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onSelectGameHub && (
            <button
              id="btn-game-switcher"
              onClick={() => {
                playClickSound();
                onSelectGameHub();
              }}
              className="px-2.5 py-1.5 sm:px-3 rounded-xl text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5 text-xs font-black shadow-xs cursor-pointer active:scale-95"
              title={t('Oyun Seçim Menüsü')}
            >
              <Grid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{t('Oyunlar')}</span>
            </button>
          )}

          {/* Unified Leaderboard & History Modal trigger */}
          {onOpenLeaderboard && (
            <button
              id="btn-leaderboard-toggle"
              onClick={() => {
                playClickSound();
                onOpenLeaderboard();
              }}
              className="px-2.5 py-1.5 sm:px-3 rounded-xl text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1.5 text-xs font-black shadow-xs cursor-pointer active:scale-95"
              title={t('Skor Tablosu & Geçmiş')}
            >
              <Trophy className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <span className="hidden sm:inline">{t('Skorlar')}</span>
            </button>
          )}

          {/* Dil Secici — TR / EN. Oyun ya tamamen Turkce ya tamamen Ingilizce. */}
          <button
            id="btn-lang-toggle"
            onClick={() => {
              playClickSound();
              toggleLang();
            }}
            className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 text-[11px] font-black shadow-xs cursor-pointer active:scale-95"
            title={getLang() === 'tr' ? 'Switch to English' : t("Türkçe'ye geç")}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{getLang() === 'tr' ? 'TR' : 'EN'}</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          {onToggleTheme && (
            <button
              id="btn-theme-toggle"
              onClick={() => {
                playClickSound();
                onToggleTheme();
              }}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
              title={theme === 'dark' ? t('Aydınlık Moda Geç') : t('Karanlık Moda Geç')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
              )}
            </button>
          )}

          <button
            id="btn-rules-toggle"
            onClick={() => {
              playClickSound();
              onOpenRules();
            }}
            className="px-2.5 py-1.5 sm:px-3 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
            title={t('Nasıl Oynanır?')}
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{t('Kurallar')}</span>
          </button>

          <button
            id="btn-sound-toggle"
            onClick={() => {
              onToggleSound();
              playClickSound();
            }}
            className="p-2 sm:px-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            title={soundActive ? 'Sesi Kapat' : t('Sesi Aç')}
          >
            {soundActive ? (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Volume2 className="w-4 h-4" />
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-emerald-500 rounded-full animate-pulse delay-75" />
                  <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                </span>
              </div>
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {activeModule === 'imposter' && phase !== 'LOBBY' && (
            <button
              id="btn-restart-game"
              onClick={() => {
                playClickSound();
                if (window.confirm('Lobiye dönüp yeni oyun başlatmak istiyor musunuz?')) {
                  onRestart();
                }
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-rose-700 dark:text-rose-300 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer active:scale-95"
              title={t('Lobiye Dön')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('Lobiye Dön')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

