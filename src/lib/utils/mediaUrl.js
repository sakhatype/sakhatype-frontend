import { API_BASE, apiMediaOrigin } from './api.js';

function inferredApiOrigin() {
  const raw = String(import.meta.env.VITE_API_URL ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(raw)) return '';
  if (/\/api$/i.test(raw)) return raw.replace(/\/api$/i, '');
  return raw;
}

/**
 * Медиа с API: при абсолютном API_BASE — тот же origin/путь, что и у fetch (через `new URL`),
 * чтобы не расходилось с `resolveApiBase` в api.js. При относительном `/api` — путь от текущего хоста
 * (прокси Vite / nginx). Override: VITE_API_ORIGIN.
 *
 * @param {string | null | undefined} url
 * @returns {string}
 */
export function mediaUrl(url) {
  if (url == null) return '';
  const s = String(url).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  const path = s.startsWith('/') ? s : `/${s}`;

  if (/^https?:\/\//i.test(API_BASE)) {
    try {
      const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
      return new URL(path, base).href;
    } catch {
      /* fall through */
    }
  }

  const origin = (
    import.meta.env.VITE_API_ORIGIN ||
    apiMediaOrigin() ||
    inferredApiOrigin() ||
    ''
  ).replace(/\/+$/, '');
  if (origin) return `${origin}${path}`;
  return path;
}
