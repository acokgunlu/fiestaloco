import React, { useCallback, useRef } from 'react';
import { Hsl } from '../../types/colory';
import { hslToHex } from '../../data/coloryLogic';

import { t } from '../../i18n';
interface Props {
  value: Hsl;
  onChange: (hsl: Hsl) => void;
  disabled?: boolean;
}

/**
 * Renk seçici.
 *
 * Üç RGB kaydırıcısı vermek parti oyununu Photoshop'a çevirirdi. Bunun yerine
 * telefonda tek parmakla çalışan iki kontrol var:
 *   - büyük PAD: yatay = ton (hue), dikey = açıklık (lightness)
 *   - altında doygunluk (saturation) çubuğu
 * Pad'in zemini gerçek renkleri gösteriyor, yani seçim gözle yapılıyor.
 */
export const ColorPicker: React.FC<Props> = ({ value, onChange, disabled }) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const applyFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
      onChange({
        h: Math.round(x * 360) % 360,
        s: value.s,
        // üst = açık, alt = koyu (90 → 12)
        l: Math.round(90 - y * 78),
      });
    },
    [onChange, value.s]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    // setPointerCapture bazi durumlarda firlatabiliyor; patlarsa secim hic
    // uygulanmadan handler oluyordu (dokunus kayboluyordu).
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* yakalama basarisiz olsa da secim calismali */
    }
    applyFromPoint(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || !dragging.current) return;
    applyFromPoint(e.clientX, e.clientY);
  };
  const stop = () => {
    dragging.current = false;
  };

  const markerX = `${(value.h / 360) * 100}%`;
  const markerY = `${((90 - value.l) / 78) * 100}%`;
  const hex = hslToHex(value);

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Önizleme */}
      <div className="flex items-center gap-3">
        <div
          className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-700 shadow-lg shrink-0"
          style={{ backgroundColor: hex }}
        />
        <div className="text-xs font-black text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('Seçtiğin renk')}<div className="font-mono text-sm text-slate-900 dark:text-white">{hex.toUpperCase()}</div>
        </div>
      </div>

      {/* Ton × açıklık pad'i */}
      <div
        ref={padRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 touch-none cursor-crosshair"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0) 42%, rgba(0,0,0,0) 58%, #000 100%),
            linear-gradient(to right,
              hsl(0 ${value.s}% 50%), hsl(60 ${value.s}% 50%), hsl(120 ${value.s}% 50%),
              hsl(180 ${value.s}% 50%), hsl(240 ${value.s}% 50%), hsl(300 ${value.s}% 50%),
              hsl(360 ${value.s}% 50%))
          `,
        }}
      >
        <div
          className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,0.45)] pointer-events-none"
          style={{ left: markerX, top: markerY, backgroundColor: hex }}
        />
      </div>

      {/* Doygunluk */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <span>{t('Soluk')}</span>
          <span>{t('Doygunluk')}</span>
          <span>{t('Canlı')}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value.s)}
          onChange={(e) => onChange({ ...value, s: Number(e.target.value) })}
          className="w-full h-4 rounded-full appearance-none cursor-pointer accent-slate-900 dark:accent-white"
          style={{
            background: `linear-gradient(to right, hsl(${value.h} 0% ${value.l}%), hsl(${value.h} 100% ${value.l}%))`,
          }}
        />
      </div>
    </div>
  );
};
