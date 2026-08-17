/// <reference types="vite/client" />

/**
 * Frontend (Vercel) ile oyun sunucusu (Railway) ayrı origin'lerde çalıştığı için
 * tüm WebSocket ve /api çağrıları buradan geçer.
 *
 * VITE_SERVER_URL tanımlıysa  -> o origin kullanılır (ör. https://fiestaloco.up.railway.app)
 * Tanımlı değilse             -> same-origin (yerel `npm run dev` davranışı korunur)
 */

function normalizeBase(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  // ws:// veya wss:// verilmişse http muadiline çevir, protokolsüzse https varsay.
  if (trimmed.startsWith('ws://')) return `http://${trimmed.slice(5)}`;
  if (trimmed.startsWith('wss://')) return `https://${trimmed.slice(6)}`;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

const BASE = normalizeBase((import.meta.env?.VITE_SERVER_URL as string | undefined) ?? '');

/** Ayrı bir oyun sunucusu yapılandırılmış mı? */
export const hasRemoteServer = BASE.length > 0;

/** Yapılandırılmış sunucunun http(s) origin'i; same-origin modda boş string. */
export const serverOrigin = BASE;

function withLeadingSlash(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

/** `/api/...` yolunu tam URL'e çevirir. */
export function getApiUrl(path: string): string {
  const p = withLeadingSlash(path);
  return hasRemoteServer ? `${BASE}${p}` : p;
}

/** WebSocket bağlantı URL'ini üretir. */
export function getWsUrl(path = ''): string {
  const p = withLeadingSlash(path);

  if (hasRemoteServer) {
    const url = new URL(BASE);
    const scheme = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const basePath = url.pathname.replace(/\/+$/, '');
    return `${scheme}//${url.host}${basePath}${p}`;
  }

  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${window.location.host}${p}`;
}
