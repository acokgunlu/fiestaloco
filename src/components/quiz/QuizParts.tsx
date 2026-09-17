import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Check, Clock, Users, X } from 'lucide-react';
import { quizCategoryLabel, quizCategoryMeta, type QuizCategoryId } from '../../data/quizBank';
import type { PublicQuestion, QuizVote } from '../../types/quizRound';
import { getLang, t, withLang } from '../../i18n';
import { T } from '../../i18n/T';

/**
 * Kale Kuşatması ile İl İl Fetih'in ortak ekran parçaları (Sticker dili).
 * Şeker renkleri açık tonlar olduğu için üzerlerindeki yazı HER İKİ temada
 * koyu mürekkep (#1c1917); kontur ve gölge temaya göre değişiyor.
 */

export const INK = '#1c1917';
export const OPTION_COLORS = ['#ff6b6b', '#4cc9f0', '#ffd93d', '#7bd389'];
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const catLabel = (id: QuizCategoryId) => quizCategoryLabel(id, getLang());

/* ------------------------------------------------------------------ başlık */

export const GameHeader: React.FC<{
  icon: React.ReactNode;
  candy: string;
  title: string;
  subtitle?: string;
  roomCode?: string | null;
  onBack: () => void;
  backLabel?: string;
}> = ({ icon, candy, title, subtitle, roomCode, onBack, backLabel }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <button onClick={onBack} className="sticker-btn px-3 py-2 text-xs font-black flex items-center gap-1.5"
        style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
        <ArrowLeft className="w-4 h-4" /> {backLabel ?? t('Parti Arenası')}
      </button>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="sticker sticker-sm w-11 h-11 flex items-center justify-center shrink-0" style={{ background: candy, color: INK }}>
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-none truncate">{title}</h1>
          {subtitle && <p className="text-xs font-bold truncate" style={{ color: 'var(--sticker-ink-soft)' }}>{subtitle}</p>}
        </div>
      </div>
    </div>
    {roomCode && (
      <span className="sticker-pill px-4 py-1 font-mono text-xl tracking-[0.25em]" style={{ background: '#ffd93d', color: INK }}>
        {roomCode}
      </span>
    )}
  </div>
);

/* --------------------------------------------------------------- QR kartı */

export const JoinCard: React.FC<{ slug: string; roomCode: string }> = ({ slug, roomCode }) => {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = withLang(`${window.location.origin}${window.location.pathname}?game=${slug}&room=${roomCode}`);
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [slug, roomCode]);

  return (
    <div className="sticker p-5 flex flex-col items-center text-center gap-3">
      <h3 className="font-display text-lg">{t('Telefondan Katılın')}</h3>
      {qr
        ? <img src={qr} alt={t('Katılma QR kodu')} className="w-48 h-48 rounded-xl" style={{ border: '3px solid var(--sticker-ink)' }} />
        : <div className="w-48 h-48 rounded-xl" style={{ background: 'var(--sticker-paper)' }} />}
      <p className="text-xs font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>
        <T k="Kamerayla okutun veya {host} adresine girip {code} yazın."
          v={{ host: <strong style={{ color: 'var(--sticker-ink)' }}>{window.location.host}</strong>, code: <strong>{roomCode}</strong> }} />
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ sayaç */

export const TimerPill: React.FC<{ seconds: number; urgentAt?: number }> = ({ seconds, urgentAt = 5 }) => {
  const urgent = seconds > 0 && seconds <= urgentAt;
  return (
    <span className="sticker-pill inline-flex items-center gap-1.5 px-3 py-1 text-lg tabular-nums"
      style={{ background: urgent ? '#ff6b6b' : 'var(--sticker-surface)', color: urgent ? INK : 'var(--sticker-ink)' }}>
      <Clock className="w-4 h-4" /> {Math.max(0, seconds)}
    </span>
  );
};

export const CategoryChip: React.FC<{ id: QuizCategoryId; size?: 'sm' | 'md' }> = ({ id, size = 'md' }) => (
  <span className={`sticker-pill inline-block ${size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'} uppercase tracking-wide`}
    style={{ background: quizCategoryMeta(id).color, color: INK }}>
    {catLabel(id)}
  </span>
);

/* --------------------------------------------------------- kategori oyu */

/** TV: üç kategori ve canlı oy sayıları. */
export const VoteBoard: React.FC<{ vote: QuizVote; seconds: number; total: number; compact?: boolean }> = ({ vote, seconds, total, compact }) => {
  const counts = vote.options.map((o) => Object.values(vote.votes).filter((v) => v === o).length);
  const voted = Object.keys(vote.votes).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`font-display ${compact ? 'text-2xl' : 'text-3xl'}`}>{t('Hangi kategori?')}</h2>
        <TimerPill seconds={seconds} />
      </div>
      {compact ? (
        <div className="space-y-2.5">
          {vote.options.map((o, i) => (
            <div key={o} className="sticker sticker-sm px-4 py-3 flex items-center justify-between gap-3" style={{ background: quizCategoryMeta(o).color, color: INK }}>
              <span className="font-display text-xl leading-tight">{catLabel(o)}</span>
              <span className="font-display text-3xl tabular-nums">{counts[i]}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {vote.options.map((o, i) => (
            <div key={o} className="sticker p-5 flex flex-col items-center gap-2 text-center" style={{ background: quizCategoryMeta(o).color, color: INK, transform: `rotate(${[-1.5, 1, -0.5][i]}deg)` }}>
              <span className="font-display text-2xl leading-tight">{catLabel(o)}</span>
              <span className="font-display text-5xl tabular-nums">{counts[i]}</span>
              <span className="text-xs font-black uppercase">{t('oy')}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--sticker-ink-soft)' }}>
        <Users className="w-4 h-4" /> {t('{a}/{b} oyuncu oy verdi · en çok oyu alan gelir, eşitlikte kura', { a: voted, b: total })}
      </p>
    </div>
  );
};

/** Telefon: üç büyük buton. */
export const VotePad: React.FC<{ vote: QuizVote; myId: string; onVote: (c: QuizCategoryId) => void }> = ({ vote, myId, onVote }) => {
  const mine = vote.votes[myId];
  return (
    <div className="space-y-3">
      <p className="font-display text-xl text-center">{t('Bir kategori seç')}</p>
      {vote.options.map((o) => {
        const count = Object.values(vote.votes).filter((v) => v === o).length;
        const selected = mine === o;
        return (
          <button key={o} onClick={() => onVote(o)}
            className="sticker-btn w-full px-4 py-4 flex items-center justify-between gap-3 text-left"
            style={{ background: quizCategoryMeta(o).color, color: INK, outline: selected ? '4px solid var(--sticker-ink)' : 'none', outlineOffset: 3 }}>
            <span className="font-display text-xl">{catLabel(o)}</span>
            <span className="flex items-center gap-2 font-black">
              {selected && <Check className="w-5 h-5" />}
              <span className="tabular-nums">{count}</span>
            </span>
          </button>
        );
      })}
      {mine && <p className="text-xs font-bold text-center" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Herkes oy verince ya da süre bitince sayılır.')}</p>}
    </div>
  );
};

/* ------------------------------------------------------------------ soru */

/** TV: soru ve şıklar. `correct` verilirse açıklama görünümü. */
export const QuestionBoard: React.FC<{
  question: PublicQuestion;
  seconds?: number;
  correct?: number | null;
  fact?: string;
  footer?: React.ReactNode;
  compact?: boolean;
}> = ({ question, seconds, correct = null, fact, footer, compact }) => {
  const revealed = correct !== null && correct !== undefined;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <CategoryChip id={question.category} />
        {seconds !== undefined && !revealed && <TimerPill seconds={seconds} />}
      </div>
      <h2 className={`font-display leading-snug ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`} style={{ textWrap: 'balance' } as React.CSSProperties}>{question.q}</h2>
      <div className={`grid grid-cols-1 ${compact ? 'gap-2' : 'sm:grid-cols-2 gap-3'}`}>
        {question.o.map((opt, i) => {
          const isCorrect = revealed && i === correct;
          const dim = revealed && !isCorrect;
          return (
            <div key={i} className={`sticker sticker-sm flex items-center gap-3 transition-opacity ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
              style={{ background: isCorrect ? '#7bd389' : 'var(--sticker-surface)', opacity: dim ? 0.45 : 1 }}>
              <span className="sticker-pill w-8 h-8 shrink-0 flex items-center justify-center text-sm" style={{ background: OPTION_COLORS[i], color: INK }}>
                {OPTION_LETTERS[i]}
              </span>
              <span className="font-black text-base sm:text-lg leading-tight" style={{ color: isCorrect ? INK : 'var(--sticker-ink)' }}>{opt}</span>
              {isCorrect && <Check className="w-6 h-6 ml-auto shrink-0" style={{ color: INK }} />}
            </div>
          );
        })}
      </div>
      {revealed && fact && (
        <p className="text-sm font-bold px-1" style={{ color: 'var(--sticker-ink-soft)' }}>{fact}</p>
      )}
      {footer}
    </div>
  );
};

/** Telefon: soru metni ve 4 cevap tuşu. */
export const AnswerPad: React.FC<{
  question: PublicQuestion;
  answered: boolean;
  onAnswer: (i: number) => void;
  seconds: number;
}> = ({ question, answered, onAnswer, seconds }) => {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => { setPicked(null); }, [question.id]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <CategoryChip id={question.category} size="sm" />
        <TimerPill seconds={seconds} />
      </div>
      <p className="font-display text-xl leading-snug">{question.q}</p>
      <div className="grid grid-cols-1 gap-2.5">
        {question.o.map((opt, i) => (
          <button key={i} disabled={answered} onClick={() => { setPicked(i); onAnswer(i); }}
            className="sticker-btn w-full px-3 py-3.5 flex items-center gap-3 text-left"
            style={{
              background: OPTION_COLORS[i], color: INK,
              opacity: answered && picked !== null && picked !== i ? 0.4 : 1,
              outline: picked === i ? '4px solid var(--sticker-ink)' : 'none', outlineOffset: 3,
            }}>
            <span className="font-display text-xl w-6 shrink-0">{OPTION_LETTERS[i]}</span>
            <span className="font-black text-base leading-tight">{opt}</span>
          </button>
        ))}
      </div>
      {answered && <p className="text-sm font-black text-center">{t('Cevabın kilitlendi — sonucu bekle.')}</p>}
    </div>
  );
};

/** Telefonda açıklama anında: doğru mu yanlış mı. */
export const AnswerVerdict: React.FC<{ correct: boolean; answered: boolean; rightAnswer: string; detail?: React.ReactNode }> = ({ correct, answered, rightAnswer, detail }) => (
  <div className="sticker p-5 text-center space-y-2" style={{ background: correct ? '#7bd389' : answered ? '#ff6b6b' : 'var(--sticker-surface)', color: correct || answered ? INK : 'var(--sticker-ink)' }}>
    <div className="flex justify-center">
      {correct ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
    </div>
    <p className="font-display text-2xl">{correct ? t('Doğru!') : answered ? t('Yanlış') : t('Cevap vermedin')}</p>
    <p className="text-sm font-bold">{t('Doğru cevap: {a}', { a: rightAnswer })}</p>
    {detail}
  </div>
);

/* ----------------------------------------------------------- oyuncu çipi */

export const PlayerChip: React.FC<{ name: string; color: string; avatar?: string; dim?: boolean; suffix?: React.ReactNode }> = ({ name, color, avatar, dim, suffix }) => (
  <span className="sticker-pill inline-flex items-center gap-1.5 px-2.5 py-1 text-sm"
    style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)', opacity: dim ? 0.45 : 1 }}>
    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color, border: '2px solid var(--sticker-ink)' }} />
    {avatar && <span aria-hidden>{avatar}</span>}
    <span className="truncate max-w-[9rem]">{name}</span>
    {suffix}
  </span>
);

export const Panel: React.FC<{ className?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ className = '', children, style }) => (
  <div className={`sticker p-5 ${className}`} style={style}>{children}</div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { candy?: string }> = ({ candy = '#ffd93d', className = '', style, children, ...rest }) => (
  <button {...rest} className={`sticker-btn px-5 py-3.5 font-display text-lg flex items-center justify-center gap-2 ${className}`}
    style={{ background: candy, color: INK, ...style }}>
    {children}
  </button>
);
