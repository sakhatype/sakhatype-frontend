/**
 * URL для медиа с API (аватары и т.д.).
 * При прокси Vite путь `/api/...` остаётся как есть.
 * VITE_API_ORIGIN — явный хост бэкенда; иначе берётся из VITE_API_URL (без суффикса /api).
 *
 * @param {string | null | undefined} url
 * @returns {string}
 */
function inferredApiOrigin() {
  const raw = String(import.meta.env.VITE_API_URL ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(raw)) return '';
  if (/\/api$/i.test(raw)) return raw.replace(/\/api$/i, '');
  return raw;
}

export function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = (import.meta.env.VITE_API_ORIGIN || inferredApiOrigin() || '').replace(/\/$/, '');
  if (origin && url.startsWith('/')) return `${origin}${url}`;
  return url;
}
