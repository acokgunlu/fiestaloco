import { useEffect, useState } from 'react';
import { getApiUrl } from './serverUrl';

/**
 * Yönetim panelinden gizlenen oyunlar.
 *
 * Kaynak sunucu (`GET /api/games/visibility`). Son bilinen liste localStorage'da
 * tutuluyor: sayfa açılır açılmaz doğru hub'ı çizmek için — önbellek olmasaydı
 * gizli oyun istek dönene kadar bir an görünüp kaybolurdu. Sunucuya
 * ulaşılamazsa önbellekle devam ediliyor; oyun listesi ağ hatası yüzünden
 * boşalmamalı.
 */

const CACHE_KEY = 'fiestaloco_hidden_games';

function readCache(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeCache(hidden: string[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(hidden));
  } catch {
    /* gizli sekme / depolama kapalı — önbelleksiz devam */
  }
}

/** Aynı anda açılan birden çok bileşen tek istek paylaşsın. */
let inflight: Promise<string[]> | null = null;

export function fetchHiddenGames(): Promise<string[]> {
  if (!inflight) {
    inflight = fetch(getApiUrl('/api/games/visibility'), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        const hidden: string[] = Array.isArray(data?.hidden)
          ? data.hidden.filter((v: unknown): v is string => typeof v === 'string')
          : [];
        writeCache(hidden);
        return hidden;
      })
      .finally(() => {
        setTimeout(() => { inflight = null; }, 0);
      });
  }
  return inflight;
}

/** Panel kaydettikten sonra hub'ın yeniden yüklemeden güncel liste görmesi için. */
export function primeHiddenGames(hidden: string[]): void {
  writeCache(hidden);
}

export function useHiddenGames(): { hidden: Set<string>; loaded: boolean } {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(readCache()));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchHiddenGames()
      .then((h) => {
        if (!alive) return;
        setHidden(new Set(h));
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => { alive = false; };
  }, []);

  return { hidden, loaded };
}
