import { writable } from 'svelte/store';

/** Эфемерный UI-состояние (не в localStorage). */
export const uiStore = writable({
  /** Модалка назначения клавиш открыта — TypingArea не должен перехватывать ввод. */
  keyBindingsModalOpen: false,
  /** Временная подпись под иконкой профиля в хедере. */
  profileXpToast: null,
  /** Временная подпись о повышении уровня под попапом опыта в хедере. */
  profileLevelToast: null,
});
