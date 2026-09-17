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
      case 'kapisma':
        return '🏁';
      case 'kusatma':
        return '🏰';
      case 'fetih':
        return '🗺️';
      default:
        return '🎮';
    }
  };

  const getGameTitle = () => {
    switch (activeModule) {
      case 'trivia_pursuit':
        return 'Bilgi Kalesi';
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
      case 'kapisma':
        return t('Kapışma');
      case 'kusatma':
        return t('Kale Kuşatması');
      case 'fetih':
        return t('İl İl Fetih');
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
      case 'kapisma':
        return t('Gerçek sürüş · telefonun direksiyon');
      case 'kusatma':
        return t('İki takım, iki sur — bilgiyle yık');
      case 'fetih':
        return t('Bil, üret, fethet — Türkiye haritasında');
      default:
        return t('Çok oyunculu parti oyunları');
    }
  };

  return (
    <header
      id="game-header-bar"
      className="w-full sticky top-0 z-30 px-3 sm:px-6 py-2.5 font-body"
      style={{ background: 'var(--sticker-surface)', borderBottom: '3px solid var(--sticker-ink)', color: 'var(--sticker-ink)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              playClickSound();
              if (onSelectGameHub) onSelectGameHub();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg cursor-pointer sticker-btn"
            style={{ background: '#ff5d8f', color: '#fff', borderWidth: '2.5px', boxShadow: '3px 3px 0 var(--sticker-ink)', transform: 'rotate(-6deg)' }}
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
                className="text-lg sm:text-xl font-display leading-tight cursor-pointer"
              >
                Fiesta<span style={{ color: '#ff5d8f' }}>Loco</span>
              </h1>
              <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 sticker-pill text-[10px] uppercase tracking-wider"
                style={{ background: '#ffd93d', color: '#1c1917' }}>
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                <span>
                  {getGameTitle()}
                </span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-bold flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--sticker-ink-soft)' }}>
              <span>
                {getGameSubtitle()}
              </span>
              {activeModule === 'imposter' && phase !== 'LOBBY' && (
                <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                  {t('Tur {a}', { a: currentRound })}</span>
              )}
            </p>
          </div>
        </div>

        {/* Phase Indicator Badge (For Imposter Line) */}
        {activeModule === 'imposter' && phase !== 'LOBBY' && (
          <div className="hidden md:flex items-center gap-2 sticker-pill px-3.5 py-1.5 text-xs"
            style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
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
              className="px-2.5 py-1.5 sm:px-3 sticker-btn flex items-center gap-1.5 text-xs font-black"
              style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)', borderWidth: '2.5px', borderRadius: '999px', boxShadow: '2px 2px 0 var(--sticker-ink)' }}
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
              className="px-2.5 py-1.5 sm:px-3 sticker-btn flex items-center gap-1.5 text-xs font-black"
              style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)', borderWidth: '2.5px', borderRadius: '999px', boxShadow: '2px 2px 0 var(--sticker-ink)' }}
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
                if (window.confirm(t('Lobiye dönüp yeni oyun başlatmak istiyor musunuz?'))) {
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

