/**
 * URL для медиа с API (аватары и т.д.).
 * При прокси Vite путь `/api/...` остаётся как есть.
 * Если задан VITE_API_ORIGIN (например https://api.example.com), к нему дописывается относительный путь.
 *
 * @param {string | null | undefined} url
 * @returns {string}
 */
export function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');
  if (origin && url.startsWith('/')) return `${origin}${url}`;
  return url;
}
