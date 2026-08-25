import React, { useEffect, useRef, useState } from 'react';
import { VirajCar, VirajPlayer } from '../../types/viraj';

interface Props {
  /** Sunucunun ürettiği kapalı SVG eğrisi. */
  path: string;
  cars: VirajCar[];
  players: VirajPlayer[];
  highlightPlayerId?: string;
  compact?: boolean;
}

/**
 * Tepeden görünen pist ve üzerindeki arabalar.
 *
 * Arabalar eğrinin üzerine `getPointAtLength()` ile oturuyor — pist her
 * yarışta yeniden üretildiği için konumları elle hesaplamak mümkün değil,
 * tarayıcının kendi eğri matematiğini kullanmak hem doğru hem ucuz.
 *
 * Hareket CSS geçişiyle: durum yalnızca viraj çözüldüğünde güncelleniyor,
 * geçiş olmasa arabalar zıplardı. Geçiş SADECE transform üzerinde —
 * opaklığa dokunulmuyor, çünkü sekme arka plana düşüp animasyon donduğunda
 * araba görünmez kalırdı (Colory ve zaman çizgisinde bu hatayı bir kez yaptık).
 */
export const VirajTrackView: React.FC<Props> = ({ path, cars, players, highlightPlayerId, compact }) => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [path]);

  const pointAt = (p: number): { x: number; y: number } => {
    const el = pathRef.current;
    if (!el || !len) return { x: 300, y: 170 };
    const pt = el.getPointAtLength(Math.max(0, Math.min(1, p)) * len);
    return { x: pt.x, y: pt.y };
  };

  /**
   * Arabayı pist GENİŞLİĞİNE de yayar.
   *
   * Yalnızca ilerleme ekseninde ayırmak yetmiyordu: yakın mücadelede arabalar
   * yine üst üste biniyor. Gerçek yarışta da yan yana giderler — teğetin
   * dikine küçük bir kaydırma hem sorunu çözüyor hem daha doğru görünüyor.
   */
  const pointOffset = (p: number, side: number): { x: number; y: number } => {
    const el = pathRef.current;
    if (!el || !len) return { x: 300, y: 170 };
    const at = Math.max(0, Math.min(1, p)) * len;
    const a = el.getPointAtLength(Math.max(0, at - 2));
    const b = el.getPointAtLength(Math.min(len, at + 2));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const m = Math.hypot(dx, dy) || 1;
    // Teğetin dikine birim vektör
    const nx = -dy / m;
    const ny = dx / m;
    const mid = el.getPointAtLength(at);
    return { x: mid.x + nx * side, y: mid.y + ny * side };
  };

  const start = pointAt(0);
  const r = compact ? 6 : 9;

  return (
    <svg viewBox="0 0 600 340" className="w-full" style={{ height: compact ? '30vh' : '46vh' }}>
      <defs>
        <filter id="vj-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Asfalt — kalın koyu şerit */}
      <path d={path} fill="none" stroke="#1e293b" strokeWidth={compact ? 22 : 30} strokeLinejoin="round" />
      <path ref={pathRef} d={path} fill="none" stroke="#334155" strokeWidth={compact ? 18 : 25} strokeLinejoin="round" />
      {/* Orta çizgi */}
      <path d={path} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="7 11" opacity="0.55" />

      {/* Başlangıç/bitiş çizgisi */}
      {len > 0 && (
        <g transform={`translate(${start.x}, ${start.y})`}>
          <rect x={-2} y={compact ? -11 : -14} width={4} height={compact ? 22 : 28} fill="#f8fafc" opacity="0.9" />
          <rect x={-2} y={compact ? -11 : -14} width={4} height={compact ? 5 : 7} fill="#0f172a" />
          <rect x={-2} y={compact ? -1 : -1} width={4} height={compact ? 5 : 7} fill="#0f172a" />
        </g>
      )}

      {/* Arabalar — arkadakiler önce çizilir ki lider üstte kalsın */}
      {[...cars].sort((a, b) => b.position - a.position).map((c) => {
        const p = players.find((x) => x.id === c.playerId);
        // Sıraya göre şeride yay: 1. içeride, 2. dışarıda, 3. içeride…
        const lane = ((c.position - 1) % 2 === 0 ? -1 : 1) * (compact ? 4 : 6);
        const pos = pointOffset(c.progress, lane);
        const mine = c.playerId === highlightPlayerId;
        const off = c.lastMistake !== 'NONE';
        return (
          <g
            key={c.playerId}
            transform={`translate(${pos.x}, ${pos.y})`}
            style={{ transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {off && <circle r={r + 6} fill="none" stroke="#f43f5e" strokeWidth="2.5" opacity="0.9" />}
            <circle
              r={r}
              fill={p?.color || '#64748b'}
              stroke={mine ? '#38bdf8' : '#0f172a'}
              strokeWidth={mine ? 3 : 2}
              filter={c.position === 1 ? 'url(#vj-glow)' : undefined}
            />
            {/*
              Etiket, arabanin bulundugu seride gore ALTA ya da USTE.
              Hepsi altta oldugunda yan yana giden arabalarin isimleri
              birbirinin ustune biniyor ve hicbiri okunmuyordu.
            */}
            <text
              x={0}
              y={lane < 0 ? -(r + (compact ? 5 : 7)) : r + (compact ? 10 : 13)}
              textAnchor="middle"
              className="font-black"
              style={{ fontSize: compact ? 8 : 10, fill: '#e2e8f0', paintOrder: 'stroke', stroke: '#0f172a', strokeWidth: 3 }}
            >
              {p?.name?.slice(0, 8)}
            </text>
            {c.position === 1 && (
              <text x={r + 4} y={-r + 2} textAnchor="middle" style={{ fontSize: compact ? 9 : 11 }}>👑</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
