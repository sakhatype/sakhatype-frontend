/**
 * Базовый URL API для fetch.
 * Если задан только origin без `/api` (например `https://sakhatype.ru`), дописываем `/api`:
 * роуты FastAPI висят под префиксом `/api`, иначе запросы на `/profile/...` дают 404 за прокси.
 */
function resolveApiBase(raw) {
  const s = String(raw ?? '').trim();
  const base = (s || '/api').replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) {
    return base || '/api';
  }
  if (/\/api$/i.test(base)) return base;
  return `${base}/api`;
}

export const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL);

/**
 * Origin API для абсолютных URL медиа (`/api/uploads/avatars/...` → `https://api…/api/uploads/...`).
 * Если API относительный (`/api`), возвращает пустую строку — браузер грузит с текущего хоста (прокси).
 */
export function apiMediaOrigin() {
  const base = API_BASE;
  if (!/^https?:\/\//i.test(base)) return '';
  return base.replace(/\/api\/?$/i, '').replace(/\/+$/, '') || '';
}

/**
 * FastAPI 422: detail — строка, объект или массив { loc, msg, type }.
 * @param {unknown} detail
 * @param {string} fallback
 */
function formatApiDetail(detail, fallback) {
  if (detail == null) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return (
      detail
        .map((e) => (e && typeof e === 'object' && 'msg' in e ? String(e.msg) : JSON.stringify(e)))
        .filter(Boolean)
        .join(' ') || fallback
    );
  }
  if (typeof detail === 'object' && detail !== null && 'msg' in detail) {
    return String(detail.msg);
  }
  try {
    return JSON.stringify(detail);
  } catch {
    return fallback;
  }
}

/**
 * @param {string} token
 * @returns {Record<string, string>}
 */
function authHeaders(token) {
  /** @type {Record<string, string>} */
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** @type {null | (() => void)} */
let unauthorizedHandler = null;

function handleUnauthorized() {
  unauthorizedHandler?.();
}

async function authorizedFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) handleUnauthorized();
  return res;
}

export const api = {
  setUnauthorizedHandler(handler) {
    unauthorizedHandler = typeof handler === 'function' ? handler : null;
  },

  // Auth
  async register(username, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: String(username ?? '').trim(),
        password: password ?? '',
        email: null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatApiDetail(err.detail, 'Не удалось зарегистрироваться'));
    }
    return res.json();
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatApiDetail(err.detail, 'Не удалось войти'));
    }
    return res.json();
  },

  async getMe(token) {
    const res = await authorizedFetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Words
  async getWords(language = 'sakha', count = 50, difficulty = 'normal') {
    const res = await fetch(`${API_BASE}/typing/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, count, difficulty }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error('Сервер недоступен');
    }
    return res.json();
  },

  // Results
  async submitResult(data, token) {
    const res = await authorizedFetch(`${API_BASE}/typing/result`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error('Не удалось отправить результат');
    }
    return res.json();
  },

  async getHistory(token, limit = 50) {
    const res = await authorizedFetch(`${API_BASE}/typing/history?limit=${limit}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    return res.json();
  },

  // Leaderboard
  async getLeaderboard(mode = 'time', modeValue = 30, limit = 50, difficulty = 'normal') {
    const res = await fetch(
      `${API_BASE}/leaderboard/?mode=${mode}&mode_value=${modeValue}&limit=${limit}&difficulty=${difficulty}`,
    );
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    return res.json();
  },

  // Profile
  /**
   * @param {string} username
   * @param {{ page?: number, page_size?: number, period?: string, mode?: string } | null} [testsList] если задан — в query уйдёт tests_page и в JSON придут tests, total, page, page_size (тот же путь, что и обычный профиль).
   */
  async getProfile(username, testsList = null) {
    let url = `${API_BASE}/profile/${encodeURIComponent(username)}`;
    if (testsList) {
      const q = new URLSearchParams({
        tests_page: String(testsList.page ?? 1),
        tests_page_size: String(testsList.page_size ?? 40),
        period: testsList.period ?? 'all',
        mode: testsList.mode ?? 'all',
      });
      url += `?${q}`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  },

  /**
   * Профиль + список тестов: сначала ?tests_page=… на том же URL, если в ответе нет tests — второй запрос на /profile/{user}/tests.
   * @param {string} username
   * @param {{ page?: number, page_size?: number, period?: string, mode?: string }} [testsList]
   */
  async getProfileWithTestList(username, testsList = null) {
    const tl = testsList ?? { page: 1, page_size: 40, period: 'all', mode: 'all' };
    const data = await api.getProfile(username, tl);
    if (!data) return null;
    if (Array.isArray(data.tests)) return data;

    const q = new URLSearchParams({
      period: tl.period ?? 'all',
      mode: tl.mode ?? 'all',
      page: String(tl.page ?? 1),
      page_size: String(tl.page_size ?? 40),
    });
    let res = await fetch(
      `${API_BASE}/profile/${encodeURIComponent(username)}/tests?${q}`,
    );
    if (res.status === 404) {
      const qFlat = new URLSearchParams({
        username,
        period: tl.period ?? 'all',
        mode: tl.mode ?? 'all',
        page: String(tl.page ?? 1),
        page_size: String(tl.page_size ?? 40),
      });
      res = await fetch(`${API_BASE}/typing/user-tests?${qFlat}`);
    }
    if (res.status === 404) {
      const qLb = new URLSearchParams({
        username,
        period: tl.period ?? 'all',
        mode: tl.mode ?? 'all',
        page: String(tl.page ?? 1),
        page_size: String(tl.page_size ?? 40),
      });
      res = await fetch(`${API_BASE}/leaderboard/user-tests?${qLb}`);
    }
    if (!res.ok) {
      return {
        ...data,
        tests: [],
        total: 0,
        page: tl.page ?? 1,
        page_size: tl.page_size ?? 40,
      };
    }
    const extra = await res.json();
    return {
      ...data,
      tests: extra.tests ?? [],
      total: extra.total ?? 0,
      page: extra.page ?? tl.page ?? 1,
      page_size: extra.page_size ?? tl.page_size ?? 40,
    };
  },

  /**
   * Пагинированная история (только блок tests).
   * @param {string} username
   * @param {{ period?: string, mode?: string, page?: number, page_size?: number }} [opts]
   */
  async getProfileTests(username, opts = {}) {
    const period = opts.period ?? 'all';
    const mode = opts.mode ?? 'all';
    const page = opts.page ?? 1;
    const page_size = opts.page_size ?? 40;

    const data = await api.getProfileWithTestList(username, { page, page_size, period, mode });
    if (!data) return { tests: [], total: 0, page: 1, page_size };
    return {
      tests: data.tests ?? [],
      total: data.total ?? 0,
      page: data.page ?? page,
      page_size: data.page_size ?? page_size,
    };
  },

  async updateProfile(updates, token) {
    const res = await authorizedFetch(`${API_BASE}/profile/update`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatApiDetail(err.detail, 'Не удалось сохранить профиль'));
    }
    return res.json();
  },

  /**
   * Загрузка аватара (WebP 128×128, обработка на сервере).
   * @param {File} file
   * @param {string} token
   */
  async uploadAvatar(file, token) {
    /** @type {Record<string, string>} */
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const urls = [
      `${API_BASE}/auth/avatar`,
      `${API_BASE}/typing/avatar`,
      `${API_BASE}/profile/me/avatar`,
      `${API_BASE}/profile/_/avatar`,
    ];
    for (const url of urls) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authorizedFetch(url, { method: 'POST', headers, body: fd });
      if (res.ok) return res.json();
      if (res.status !== 404 && res.status !== 405) {
        const err = await res.json().catch(() => ({}));
        throw new Error(formatApiDetail(err.detail, 'Не удалось загрузить аватар'));
      }
    }
    throw new Error('Не удалось загрузить аватар');
  },

  async getAchievements() {
    const res = await fetch(`${API_BASE}/profile/achievements`);
    return res.json();
  },

  // Arena
  async createRoom(mode = 'time', mode_value = 30, language = 'sakha') {
    const res = await fetch(`${API_BASE}/arena/create?mode=${mode}&mode_value=${mode_value}&language=${language}`, {
      method: 'POST',
    });
    return res.json();
  },

  async listRooms() {
    const res = await fetch(`${API_BASE}/arena/rooms`);
    return res.json();
  },
};
