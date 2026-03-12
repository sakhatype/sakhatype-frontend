import { writable, derived, get } from 'svelte/store';

/**
 * @typedef {'idle' | 'running' | 'finished'} TestStatus
 */

function createTypingStore() {
  const { subscribe, set, update } = writable({
    /** @type {string[]} */ words: [],
    /** @type {string} */ language: 'sakha',
    /** @type {string} */ mode: 'time',
    /** @type {number} */ modeValue: 30,
    /** @type {TestStatus} */ status: 'idle',
    /** @type {number} */ currentWordIndex: 0,
    /** @type {string} */ currentInput: '',
    /** @type {string[][]} */ typedHistory: [],   // array of char arrays per word
    /** @type {boolean[]} */ wordCorrectness: [],  // true/false per completed word
    /** @type {number} */ startTime: 0,
    /** @type {number} */ endTime: 0,
    /** @type {number} */ timeLeft: 0,
    /** @type {number} */ wpm: 0,
    /** @type {number} */ rawWpm: 0,
    /** @type {number} */ accuracy: 100,
    /** @type {number} */ charsCorrect: 0,
    /** @type {number} */ charsIncorrect: 0,
    /** @type {number} */ charsExtra: 0,
    /** @type {number} */ charsMissed: 0,
    /** @type {number|null} */ timerInterval: null,
    /** @type {Array<{time: number, wpm: number, raw: number}>} */ wpmHistory: [],
  });

  return {
    subscribe,

    /**
     * @param {string[]} words
     * @param {string} mode
     * @param {number} modeValue
     * @param {string} language
     */
    init(words, mode, modeValue, language) {
      set({
        words,
        language,
        mode,
        modeValue,
        status: 'idle',
        currentWordIndex: 0,
        currentInput: '',
        typedHistory: [],
        wordCorrectness: [],
        startTime: 0,
        endTime: 0,
        timeLeft: mode === 'time' ? modeValue : 0,
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        charsCorrect: 0,
        charsIncorrect: 0,
        charsExtra: 0,
        charsMissed: 0,
        timerInterval: null,
        wpmHistory: [],
      });
    },

    start() {
      update((s) => {
        if (s.status !== 'idle') return s;
        const now = Date.now();
        return { ...s, status: 'running', startTime: now };
      });
    },

    /** @param {string} input */
    setInput(input) {
      update((s) => ({ ...s, currentInput: input }));
    },

    /**
     * Process space press → commit current word
     */
    commitWord() {
      update((s) => {
        if (s.status !== 'running') return s;
        const word = s.words[s.currentWordIndex];
        const typed = s.currentInput;

        const chars = typed.split('');
        const wordChars = word.split('');

        let correct = 0, incorrect = 0, extra = 0, missed = 0;

        for (let i = 0; i < Math.max(chars.length, wordChars.length); i++) {
          if (i < chars.length && i < wordChars.length) {
            if (chars[i] === wordChars[i]) correct++;
            else incorrect++;
          } else if (i >= wordChars.length) {
            extra++;
          } else {
            missed++;
          }
        }

        const isCorrect = typed === word;
        const newHistory = [...s.typedHistory, chars];
        const newCorrectness = [...s.wordCorrectness, isCorrect];
        const nextIndex = s.currentWordIndex + 1;

        // Check if words mode is complete
        if (s.mode === 'words' && nextIndex >= s.words.length) {
          const elapsed = (Date.now() - s.startTime) / 1000 / 60;
          const totalCorrect = s.charsCorrect + correct;
          const totalAll = totalCorrect + s.charsIncorrect + incorrect + extra;
          const wpm = elapsed > 0 ? (totalCorrect / 5) / elapsed : 0;
          const rawWpm = elapsed > 0 ? (totalAll / 5) / elapsed : 0;
          const acc = totalAll > 0 ? (totalCorrect / totalAll) * 100 : 100;

          const newWpmHistory = [...s.wpmHistory, {
            time: elapsed * 60,
            wpm: Math.round(wpm * 100) / 100,
            raw: Math.round(rawWpm * 100) / 100,
          }];

          return {
            ...s,
            currentWordIndex: nextIndex,
            currentInput: '',
            typedHistory: newHistory,
            wordCorrectness: newCorrectness,
            charsCorrect: s.charsCorrect + correct,
            charsIncorrect: s.charsIncorrect + incorrect,
            charsExtra: s.charsExtra + extra,
            charsMissed: s.charsMissed + missed,
            status: 'finished',
            endTime: Date.now(),
            wpm: Math.round(wpm * 100) / 100,
            rawWpm: Math.round(rawWpm * 100) / 100,
            accuracy: Math.round(acc * 100) / 100,
            wpmHistory: newWpmHistory,
          };
        }

        // Calculate live WPM
        const elapsed = (Date.now() - s.startTime) / 1000 / 60;
        const totalCorrect = s.charsCorrect + correct;
        const totalAll = totalCorrect + s.charsIncorrect + incorrect + extra;
        const wpm = elapsed > 0 ? (totalCorrect / 5) / elapsed : 0;
        const rawWpm = elapsed > 0 ? (totalAll / 5) / elapsed : 0;
        const acc = totalAll > 0 ? (totalCorrect / totalAll) * 100 : 100;

        const newWpmHistory = [...s.wpmHistory, {
          time: elapsed * 60,
          wpm: Math.round(wpm * 100) / 100,
          raw: Math.round(rawWpm * 100) / 100,
        }];

        return {
          ...s,
          currentWordIndex: nextIndex,
          currentInput: '',
          typedHistory: newHistory,
          wordCorrectness: newCorrectness,
          charsCorrect: s.charsCorrect + correct,
          charsIncorrect: s.charsIncorrect + incorrect,
          charsExtra: s.charsExtra + extra,
          charsMissed: s.charsMissed + missed,
          wpm: Math.round(wpm * 100) / 100,
          rawWpm: Math.round(rawWpm * 100) / 100,
          accuracy: Math.round(acc * 100) / 100,
          wpmHistory: newWpmHistory,
        };
      });
    },

    /** @param {number} timeLeft */
    tick(timeLeft) {
      update((s) => {
        if (timeLeft <= 0 && s.mode === 'time') {
          const elapsed = s.modeValue / 60;
          const wpm = elapsed > 0 ? (s.charsCorrect / 5) / elapsed : 0;
          const totalAll = s.charsCorrect + s.charsIncorrect + s.charsExtra;
          const rawWpm = elapsed > 0 ? (totalAll / 5) / elapsed : 0;
          const acc = totalAll > 0 ? (s.charsCorrect / totalAll) * 100 : 100;

          return {
            ...s,
            timeLeft: 0,
            status: 'finished',
            endTime: Date.now(),
            wpm: Math.round(wpm * 100) / 100,
            rawWpm: Math.round(rawWpm * 100) / 100,
            accuracy: Math.round(acc * 100) / 100,
            wpmHistory: s.wpmHistory,
          };
        }
        return { ...s, timeLeft };
      });
    },

    finish() {
      update((s) => {
        if (s.status !== 'running') return s;
        const elapsed = (Date.now() - s.startTime) / 1000 / 60;
        const totalAll = s.charsCorrect + s.charsIncorrect + s.charsExtra;
        const wpm = elapsed > 0 ? (s.charsCorrect / 5) / elapsed : 0;
        const rawWpm = elapsed > 0 ? (totalAll / 5) / elapsed : 0;
        const acc = totalAll > 0 ? (s.charsCorrect / totalAll) * 100 : 100;

        return {
          ...s,
          status: 'finished',
          endTime: Date.now(),
          wpm: Math.round(wpm * 100) / 100,
          rawWpm: Math.round(rawWpm * 100) / 100,
          accuracy: Math.round(acc * 100) / 100,
          wpmHistory: s.wpmHistory,
        };
      });
    },

    reset() {
      update((s) => ({
        ...s,
        status: 'idle',
        currentWordIndex: 0,
        currentInput: '',
        typedHistory: [],
        wordCorrectness: [],
        startTime: 0,
        endTime: 0,
        timeLeft: s.mode === 'time' ? s.modeValue : 0,
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        charsCorrect: 0,
        charsIncorrect: 0,
        charsExtra: 0,
        charsMissed: 0,
        wpmHistory: [],
      }));
    },
  };
}

export const typingStore = createTypingStore();
