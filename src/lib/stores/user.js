import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { api } from '$utils/api';

function createUserStore() {
  const stored = browser ? localStorage.getItem('dotx_user') : null;
  const storedToken = browser ? localStorage.getItem('dotx_token') : null;

  const { subscribe, set, update } = writable({
    user: stored ? JSON.parse(stored) : null,
    token: storedToken || null,
    loading: false,
  });

  return {
    subscribe,

    async register(username, password) {
      update((s) => ({ ...s, loading: true }));
      try {
        const data = await api.register(username, password);
        const state = { user: data.user, token: data.access_token, loading: false };
        set(state);
        if (browser) {
          localStorage.setItem('dotx_user', JSON.stringify(data.user));
          localStorage.setItem('dotx_token', data.access_token);
        }
        return { success: true };
      } catch (err) {
        update((s) => ({ ...s, loading: false }));
        return { success: false, error: err.message };
      }
    },

    async login(username, password) {
      update((s) => ({ ...s, loading: true }));
      try {
        const data = await api.login(username, password);
        const state = { user: data.user, token: data.access_token, loading: false };
        set(state);
        if (browser) {
          localStorage.setItem('dotx_user', JSON.stringify(data.user));
          localStorage.setItem('dotx_token', data.access_token);
        }
        return { success: true };
      } catch (err) {
        update((s) => ({ ...s, loading: false }));
        return { success: false, error: err.message };
      }
    },

    async refresh() {
      const storedToken = browser ? localStorage.getItem('dotx_token') : null;
      if (!storedToken) return;
      try {
        const user = await api.getMe(storedToken);
        if (user) {
          update((s) => ({ ...s, user, token: storedToken }));
          if (browser) localStorage.setItem('dotx_user', JSON.stringify(user));
        }
      } catch {
        // Token invalid
      }
    },

    updateUser(userData) {
      update((s) => {
        const newUser = { ...s.user, ...userData };
        if (browser) localStorage.setItem('dotx_user', JSON.stringify(newUser));
        return { ...s, user: newUser };
      });
    },

    logout() {
      set({ user: null, token: null, loading: false });
      if (browser) {
        localStorage.removeItem('dotx_user');
        localStorage.removeItem('dotx_token');
      }
    },
  };
}

export const userStore = createUserStore();
