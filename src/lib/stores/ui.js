import { writable } from 'svelte/store';

/** Эфемерный UI-состояние (не в localStorage). */
export const uiStore = writable({
  /** Модалка назначения клавиш открыта — TypingArea не должен перехватывать ввод. */
  keyBindingsModalOpen: false,
});
