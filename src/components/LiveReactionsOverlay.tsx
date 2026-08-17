import React, { useState, useEffect } from 'react';
import { playPopSound } from '../utils/audio';
import { SmilePlus, Flame, Laugh, Eye, HelpCircle, Palette, Sparkles } from 'lucide-react';

export interface FloatingEmoji {
  id: string;
  emoji: string;
  xPercent: number;
  rotation: number;
}

const REACTION_OPTIONS = [
  { emoji: '🔥', label: 'Alev!', icon: Flame, color: 'from-amber-500 to-orange-600' },
  { emoji: '😂', label: 'Kahkaha', icon: Laugh, color: 'from-yellow-400 to-amber-500' },
  { emoji: '🕵️‍♂️', label: 'Şüpheli!', icon: Eye, color: 'from-rose-500 to-red-600' },
  { emoji: '🎨', label: 'Sanat!', icon: Palette, color: 'from-indigo-500 to-purple-600' },
  { emoji: '❓', label: 'Ne Bu?', icon: HelpCircle, color: 'from-teal-500 to-cyan-600' },
  { emoji: '😱', label: 'Şok!', icon: Sparkles, color: 'from-pink-500 to-rose-600' },
];

interface LiveReactionsOverlayProps {
  onSendReaction?: (emoji: string) => void;
  className?: string;
  floatingContainerClassName?: string;
}

export const LiveReactionsOverlay: React.FC<LiveReactionsOverlayProps> = ({
  onSendReaction,
  className = '',
  floatingContainerClassName = 'absolute inset-0 pointer-events-none overflow-hidden z-30',
}) => {
  const [activeEmojis, setActiveEmojis] = useState<FloatingEmoji[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  const spawnReaction = (emoji: string) => {
    playPopSound();
    const newReaction: FloatingEmoji = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      emoji,
      xPercent: 15 + Math.random() * 70, // Float between 15% and 85% width
      rotation: (Math.random() - 0.5) * 30,
    };

    setActiveEmojis((prev) => [...prev.slice(-15), newReaction]);

    if (onSendReaction) {
      onSendReaction(emoji);
    }
  };

  // Clean up emoji after animation completes (1.8s)
  useEffect(() => {
    if (activeEmojis.length === 0) return;
    const timer = setTimeout(() => {
      setActiveEmojis((prev) => prev.slice(1));
    }, 1800);
    return () => clearTimeout(timer);
  }, [activeEmojis]);

  return (
    <>
      {/* Floating Emojis Stage */}
      <div className={floatingContainerClassName}>
        {activeEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-6 select-none animate-reaction pointer-events-none drop-shadow-2xl"
            style={{
              left: `${item.xPercent}%`,
              transform: `rotate(${item.rotation}deg)`,
            }}
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
              {item.emoji}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Reactions Bar */}
      <div
        className={`flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md ${className}`}
      >
        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase px-2 hidden sm:inline flex items-center gap-1">
          <SmilePlus className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>Tepki Ver:</span>
        </span>

        <div className="flex items-center gap-1">
          {REACTION_OPTIONS.map((item) => (
            <button
              key={item.emoji}
              type="button"
              id={`reaction-btn-${item.emoji}`}
              onClick={() => spawnReaction(item.emoji)}
              title={item.label}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-125 hover:scale-110 flex items-center justify-center text-base sm:text-lg transition-all border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer"
            >
              {item.emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
