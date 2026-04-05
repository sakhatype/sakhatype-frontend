import { apiMediaOrigin } from './api.js';

function inferredApiOrigin() {
  const raw = String(import.meta.env.VITE_API_URL ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(raw)) return '';
  if (/\/api$/i.test(raw)) return raw.replace(/\/api$/i, '');
  return raw;
}

/**
 * Медиа с API: при абсолютном VITE_API_URL — полный URL (`https://api…/api/uploads/…`);
 * при `/api` — относительный путь. Override: VITE_API_ORIGIN.
 *
 * @param {string | null | undefined} url
 * @returns {string}
 */
export function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = (
    import.meta.env.VITE_API_ORIGIN ||
    apiMediaOrigin() ||
    inferredApiOrigin() ||
    ''
  ).replace(/\/+$/, '');
  if (origin && url.startsWith('/')) return `${origin}${url}`;
  return url;
}
