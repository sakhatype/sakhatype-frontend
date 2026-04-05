const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

export const api = {
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
      throw new Error(formatApiDetail(err.detail, 'Registration failed'));
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
      throw new Error(formatApiDetail(err.detail, 'Login failed'));
    }
    return res.json();
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
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
      throw new Error('Backend not available');
    }
    return res.json();
  },

  // Results
  async submitResult(data, token) {
    const res = await fetch(`${API_BASE}/typing/result`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error('Failed to submit result');
    }
    return res.json();
  },

  async getHistory(token, limit = 50) {
    const res = await fetch(`${API_BASE}/typing/history?limit=${limit}`, {
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
  async getProfile(username) {
    const res = await fetch(`${API_BASE}/profile/${username}`);
    if (!res.ok) return null;
    return res.json();
  },

  async updateProfile(updates, token) {
    const res = await fetch(`${API_BASE}/profile/update`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatApiDetail(err.detail, 'Failed to update profile'));
    }
    return res.json();
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
