import type { KusatmaPlayer, KusatmaTeam } from '../types/kusatma';

/**
 * Kale Kuşatması — saf kurallar (sunucu da istemci de buradan okuyor).
 */

export const KUSATMA_WALL = 100;
export const KUSATMA_TIMES = { vote: 10, question: 15, reveal: 7 } as const;

/**
 * Takım çarpanı. Takım hasarı üyelerin katkısının ORTALAMASI × bu çarpan.
 * Ortalama alınıyor çünkü toplam alınsaydı kalabalık takım her zaman
 * kazanırdı; 3'e 2 bölünmüş bir odada adalet ortalamayla sağlanıyor.
 * 2,5 ile kusursuz bir tur 25 can götürüyor: sur en erken 4 turda düşüyor,
 * ortalama bir oyunda 8-10 turda.
 */
export const KUSATMA_TEAM_MULT = 2.5;

export const TEAM_LABEL: Record<KusatmaTeam, string> = { red: 'Kızıl Kale', blue: 'Mavi Kale' };
export const TEAM_COLOR: Record<KusatmaTeam, string> = { red: '#ff6b6b', blue: '#4cc9f0' };

export function otherTeam(team: KusatmaTeam): KusatmaTeam {
  return team === 'red' ? 'blue' : 'red';
}

/** Doğru cevabın gücü: anında cevap 10, son saniyede 6. */
export function hitDamage(ms: number, questionSec: number = KUSATMA_TIMES.question): number {
  const t = Math.max(0, Math.min(questionSec, ms / 1000));
  return 6 + Math.round(4 * (1 - t / questionSec));
}

export function teamDamage(memberDamages: number[], catapult: boolean): number {
  if (memberDamages.length === 0) return 0;
  const avg = memberDamages.reduce((a, b) => a + b, 0) / memberDamages.length;
  const d = Math.round(avg * KUSATMA_TEAM_MULT);
  return catapult ? d * 2 : d;
}

/** Yeni gelen oyuncunun takımı: kalabalık olmayan taraf (eşitse kızıl). */
export function smallerTeam(players: Pick<KusatmaPlayer, 'team'>[]): KusatmaTeam {
  const red = players.filter((p) => p.team === 'red').length;
  const blue = players.length - red;
  return red <= blue ? 'red' : 'blue';
}

/**
 * Oyun başlarken takımlardan biri boşsa ya da fark 1'den büyükse dengeler.
 * Oyuncunun kendi seçtiği takıma mümkün olduğunca dokunulmuyor: yalnızca
 * kalabalık taraftan, en son gelenler karşıya geçiyor.
 */
export function rebalanceTeams<T extends Pick<KusatmaPlayer, 'team'>>(players: T[]): void {
  for (let guard = 0; guard < players.length; guard++) {
    const red = players.filter((p) => p.team === 'red');
    const blue = players.filter((p) => p.team === 'blue');
    if (Math.abs(red.length - blue.length) <= 1) return;
    const from = red.length > blue.length ? red : blue;
    from[from.length - 1].team = otherTeam(from[from.length - 1].team);
  }
}
