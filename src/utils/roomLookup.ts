import { getApiUrl } from './serverUrl';

/**
 * Oda kodunun hangi oyuna ait olduğunu sunucudan sorar.
 * Dönüş: URL'deki ?game= değeri ('imposter' dahil), kod yoksa null,
 * sunucuya ulaşılamazsa undefined (çağıran eski davranışa düşsün).
 */
export async function lookupRoomGame(code: string): Promise<string | null | undefined> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  try {
    const res = await fetch(getApiUrl(`/api/room/${encodeURIComponent(clean)}`), { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    const data = await res.json();
    return typeof data?.game === 'string' ? data.game : undefined;
  } catch {
    return undefined;
  }
}

/** ?room=KOD adresine oyunu ekler; imposter kendi başına ?room= ile açılıyor. */
export function roomJoinHref(code: string, game: string | null | undefined): string {
  const url = new URL(window.location.href);
  url.searchParams.set('room', code.trim().toUpperCase());
  if (game && game !== 'imposter') url.searchParams.set('game', game);
  else url.searchParams.delete('game');
  return `${url.pathname}${url.search}`;
}
