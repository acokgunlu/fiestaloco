import React from 'react';
import { CodenamesCard } from '../../data/codenamesWords';
import { Shield, Skull, UserCheck, Coffee, Check, AlertTriangle } from 'lucide-react';
import { playCardFlipSound } from '../../utils/audio';
import { RedAgentArt, BlueAgentArt, CivilianArt, AssassinArt } from './AgentIllustrations';

export interface CodenamesCardItemProps {
  card: CodenamesCard;
  isSpymasterView: boolean;
  onSelectCard: (card: CodenamesCard) => void;
  disabled?: boolean;
  isCurrentTurnTeam?: boolean;
}

export const CodenamesCardItem: React.FC<CodenamesCardItemProps> = ({
  card,
  isSpymasterView,
  onSelectCard,
  disabled = false,
  isCurrentTurnTeam = true,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (card.revealed || disabled) return;
    playCardFlipSound();
    onSelectCard(card);
  };

  // Spymaster indicator glow / badge styling when card is UNREVEALED
  const getSpymasterFrontGlow = () => {
    if (!isSpymasterView || card.revealed) return '';
    switch (card.type) {
      case 'red':
        return 'ring-3 ring-rose-500 bg-rose-50/90 text-rose-950 border-rose-500 shadow-md shadow-rose-500/20';
      case 'blue':
        return 'ring-3 ring-blue-500 bg-blue-50/90 text-blue-950 border-blue-500 shadow-md shadow-blue-500/20';
      case 'neutral':
        return 'ring-2 ring-stone-400 bg-stone-100/90 text-stone-700 border-stone-400';
      case 'assassin':
        return 'ring-3 ring-rose-700 bg-slate-900/95 text-white border-rose-600 shadow-lg shadow-rose-900/50';
    }
  };

  return (
    <div className="w-full aspect-[16/11] perspective-1000 select-none">
      <div
        id={`codenames-card-${card.id}`}
        onClick={handleClick}
        className={`w-full h-full relative rounded-2xl transform-style-3d ${
          card.revealed ? 'rotate-y-180 cursor-default' : disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98]'
        }`}
      >
        {/* =========================================================================
            FRONT FACE: UNREVEALED PHYSICAL WORD TILE
            ========================================================================= */}
        <div
          className={`card-face card-face-front rounded-2xl p-2 sm:p-3 flex flex-col justify-between items-center text-center transition-all ${
            isSpymasterView
              ? getSpymasterFrontGlow()
              : 'codenames-tile-paper text-slate-900 dark:text-slate-100 hover:border-indigo-400'
          }`}
        >
          {/* Top upside-down mini word for table opposite players */}
          <div className="w-full flex justify-between items-center opacity-40 text-[9px] sm:text-[10px] font-black rotate-180">
            <span>{card.word}</span>
            {isSpymasterView && (
              <span className="text-[10px]">
                {card.type === 'red' && '🔴'}
                {card.type === 'blue' && '🔵'}
                {card.type === 'assassin' && '☠️'}
                {card.type === 'neutral' && '⚪'}
              </span>
            )}
          </div>

          {/* Centered Secret Word */}
          <div className="my-auto px-1 w-full text-center">
            <span
              className={`text-xs sm:text-sm md:text-base font-black tracking-wide uppercase break-words line-clamp-2 ${
                isSpymasterView && card.type === 'assassin' ? 'text-rose-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {card.word}
            </span>
          </div>

          {/* Bottom Card Index & Spymaster Role Tag */}
          <div className="w-full flex justify-between items-center text-[9px] sm:text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500">#{card.orderIndex + 1}</span>

            {isSpymasterView ? (
              <span
                className={`px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                  card.type === 'red'
                    ? 'bg-rose-600 text-white'
                    : card.type === 'blue'
                    ? 'bg-blue-600 text-white'
                    : card.type === 'assassin'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-stone-300 text-stone-800'
                }`}
              >
                {card.type === 'red' && '🔴 KIRMIZI'}
                {card.type === 'blue' && '🔵 MAVİ'}
                {card.type === 'assassin' && '☠️ SUİKASTÇI'}
                {card.type === 'neutral' && '⚪ SİVİL'}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-medium tracking-wider text-[8px] uppercase">
                GİZLİ KOD
              </span>
            )}
          </div>
        </div>

        {/* =========================================================================
            BACK FACE: REVEALED AGENT TILE WITH REAL AGENT ARTWORK
            ========================================================= */}
        <div
          className={`card-face card-face-back rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between items-center text-center overflow-hidden ${
            card.type === 'red'
              ? 'agent-tile-red text-white'
              : card.type === 'blue'
              ? 'agent-tile-blue text-white'
              : card.type === 'neutral'
              ? 'agent-tile-neutral text-slate-800 dark:text-slate-200'
              : 'agent-tile-assassin text-white animate-assassin-alarm'
          }`}
        >
          {/* Top Title Bar */}
          <div className="w-full flex items-center justify-between z-10">
            <span
              className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                card.type === 'red'
                  ? 'bg-rose-900/80 text-rose-100 border border-rose-300/40'
                  : card.type === 'blue'
                  ? 'bg-blue-900/80 text-blue-100 border border-blue-300/40'
                  : card.type === 'neutral'
                  ? 'bg-stone-300/90 text-stone-800 border border-stone-400/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/60'
              }`}
            >
              {card.type === 'red' && 'KIRMIZI AJAN'}
              {card.type === 'blue' && 'MAVİ AJAN'}
              {card.type === 'neutral' && 'MASUM SİVİL'}
              {card.type === 'assassin' && 'KARA SUİKASTÇI'}
            </span>

            <div className="w-4 h-4 flex items-center justify-center">
              {card.type === 'assassin' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-80" />
              )}
            </div>
          </div>

          {/* Central Real Agent Character Artwork */}
          <div className="my-auto flex flex-col items-center justify-center relative z-10 py-0.5">
            {card.type === 'red' && <RedAgentArt size="md" className="sm:w-14 sm:h-14" />}
            {card.type === 'blue' && <BlueAgentArt size="md" className="sm:w-14 sm:h-14" />}
            {card.type === 'neutral' && <CivilianArt size="md" className="sm:w-14 sm:h-14" />}
            {card.type === 'assassin' && <AssassinArt size="md" className="sm:w-14 sm:h-14" />}

            {/* Revealed Original Word Stamp */}
            <span
              className={`mt-1 text-[10px] sm:text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                card.type === 'red'
                  ? 'bg-rose-950/60 text-rose-100 line-through decoration-rose-300 decoration-2'
                  : card.type === 'blue'
                  ? 'bg-blue-950/60 text-blue-100 line-through decoration-blue-300 decoration-2'
                  : card.type === 'neutral'
                  ? 'bg-stone-300/80 text-stone-900 line-through decoration-stone-600 decoration-2'
                  : 'bg-black/80 text-rose-400 line-through decoration-rose-500 decoration-2'
              }`}
            >
              {card.word}
            </span>
          </div>

          {/* Bottom Card Index */}
          <div className="w-full flex justify-between items-center text-[8px] sm:text-[9px] font-bold opacity-75 z-10">
            <span>#{card.orderIndex + 1}</span>
            <span className="uppercase tracking-widest font-black">AÇILDI ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
};
