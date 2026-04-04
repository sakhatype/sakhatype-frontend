import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const defaults = {
  mode: 'time',       // 'time' | 'words'
  modeValue: 30,       // time: 15,30,60 | words: 10,25,50
  language: 'sakha',   // only sakha
  difficulty: 'normal', // 'normal' | 'expert'
  sakhaBinds: true,     // enable number → sakha char mapping
  smoothCaret: true,
  showHints: true,      // show key hints for sakha chars
  theme: 'dark',        // 'dark' | 'light' - default is dark
  soundEnabled: true,   // sound effects on/off
  customBindings: {     // custom key bindings for sakha chars
    '4': 'ҥ',
    '5': 'ҕ',
    '6': 'ө',
    '7': 'ү',
    '8': 'һ',
  },
};

function createSettingsStore() {
  const stored = browser ? localStorage.getItem('dotx_settings') : null;
  const initial = stored ? { ...defaults, ...JSON.parse(stored) } : defaults;

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set(value) {
      set(value);
      if (browser) localStorage.setItem('dotx_settings', JSON.stringify(value));
    },
    update(fn) {
      update((s) => {
        const newVal = fn(s);
        if (browser) localStorage.setItem('dotx_settings', JSON.stringify(newVal));
        return newVal;
      });
    },
    reset() {
      set(defaults);
      if (browser) localStorage.setItem('dotx_settings', JSON.stringify(defaults));
    },
  };
}

export const settingsStore = createSettingsStore();
