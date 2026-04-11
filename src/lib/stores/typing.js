import { writable } from 'svelte/store';

function createTypingStore() {
  const { subscribe, set, update } = writable({
    words: [],
    language: 'sakha',
    mode: 'time',
    modeValue: 30,
    status: 'idle',        // 'idle' | 'running' | 'finished'
    currentWordIndex: 0,
    currentInput: '',
    typedHistory: [],       // array of char arrays per word
    wordCorrectness: [],    // true/false per completed word
    startTime: 0,
    endTime: 0,
    timeLeft: 0,
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    charsCorrect: 0,
    charsIncorrect: 0,
    charsExtra: 0,
    charsMissed: 0,
    timerInterval: null,
    // wordsGoal: в режиме «слова» — целевое число слов (задаётся в init)
    wordsGoal: 0,
    // Per-word WPM history (recorded on each word commit)
    wpmHistory: [],
    // Per-second snapshots for the detailed graph
    // { sec, wpm, raw, burst, errors }
    secondSnapshots: [],
    // Tracking for per-second error counting
    _errorsThisSecond: 0,
    _totalErrors: 0,
    _charsThisSecond: 0,
    _lastSnapshotSec: 0,
  });

  return {
    subscribe,

    init(words, mode, modeValue, language) {
      const mv = Number(modeValue);
      const modeValueNum = Number.isFinite(mv) ? mv : mode === 'time' ? 30 : 25;
      const wordsGoal =
        mode === 'words' ? Math.max(1, Math.floor(modeValueNum) || 1) : 0;
      set({
        words, language, mode, modeValue: modeValueNum, wordsGoal,
        status: 'idle',
        currentWordIndex: 0,
        currentInput: '',
        typedHistory: [],
        wordCorrectness: [],
        startTime: 0,
        endTime: 0,
        timeLeft: mode === 'time' ? modeValueNum : 0,
        wpm: 0, rawWpm: 0, accuracy: 100,
        charsCorrect: 0, charsIncorrect: 0,
        charsExtra: 0, charsMissed: 0,
        timerInterval: null,
        wpmHistory: [],
        secondSnapshots: [],
        _errorsThisSecond: 0,
        _totalErrors: 0,
        _charsThisSecond: 0,
        _lastSnapshotSec: 0,
      });
    },

    start() {
      update(s => {
        if (s.status !== 'idle') return s;
        return { ...s, status: 'running', startTime: Date.now() };
      });
    },

    setInput(input) {
      update(s => ({ ...s, currentInput: input }));
    },

    // Call this when the user types a wrong character (even if they backspace to fix it)
    recordError() {
      update(s => ({
        ...s,
        _errorsThisSecond: s._errorsThisSecond + 1,
        _totalErrors: s._totalErrors + 1,
      }));
    },

    // Called every second by the timer — records a snapshot
    tick(timeLeft) {
      update(s => {
        const elapsed = (Date.now() - s.startTime) / 1000;
        const elapsedMin = elapsed / 60;
        const sec = Math.round(elapsed);

        // WPM at this moment
        const wpm = elapsedMin > 0 ? (s.charsCorrect / 5) / elapsedMin : 0;
        const totalAll = s.charsCorrect + s.charsIncorrect + s.charsExtra;
        const rawWpm = elapsedMin > 0 ? (totalAll / 5) / elapsedMin : 0;

        // Burst = chars typed this second * 12 (chars/sec → chars/5sec/min approx)
        // More accurate: (charsThisSecond / 5) * 60
        const burst = (s._charsThisSecond / 5) * 60;

        const snapshot = {
          sec,
          wpm: Math.round(wpm * 100) / 100,
          raw: Math.round(rawWpm * 100) / 100,
          burst: Math.round(burst * 100) / 100,
          errors: s._errorsThisSecond,
        };

        const newSnapshots = [...s.secondSnapshots, snapshot];

        if (timeLeft <= 0 && s.mode === 'time') {
          const finalElapsed = s.modeValue / 60;
          const finalWpm = finalElapsed > 0 ? (s.charsCorrect / 5) / finalElapsed : 0;
          const finalRaw = finalElapsed > 0 ? (totalAll / 5) / finalElapsed : 0;
          const acc = totalAll > 0 ? (s.charsCorrect / totalAll) * 100 : 100;

          return {
            ...s,
            timeLeft: 0,
            status: 'finished',
            endTime: Date.now(),
            wpm: Math.round(finalWpm * 100) / 100,
            rawWpm: Math.round(finalRaw * 100) / 100,
            accuracy: Math.round(acc * 100) / 100,
            secondSnapshots: newSnapshots,
            _errorsThisSecond: 0,
            _charsThisSecond: 0,
            _lastSnapshotSec: sec,
          };
        }

        return {
          ...s,
          timeLeft,
          secondSnapshots: newSnapshots,
          _errorsThisSecond: 0,
          _charsThisSecond: 0,
          _lastSnapshotSec: sec,
        };
      });
    },

    // Track chars typed this second (for burst calculation)
    recordChar() {
      update(s => ({ ...s, _charsThisSecond: s._charsThisSecond + 1 }));
    },

    commitWord() {
      update(s => {
        if (s.status !== 'running') return s;
        const word = s.words[s.currentWordIndex];
        if (word == null) return s;
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

        // Режим «слова»: конец только после коммита последнего слова (nextIndex === числу набранных слов)
        const goal = s.wordsGoal > 0 ? s.wordsGoal : Math.max(1, Math.floor(Number(s.modeValue)) || 1);
        if (s.mode === 'words' && nextIndex >= goal) {
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

    finish() {
      update(s => {
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
        };
      });
    },

    /** Добавить слова в конец (бесконечная лента / подгрузка) */
    appendWords(moreWords) {
      if (!moreWords?.length) return;
      update(s => ({ ...s, words: [...s.words, ...moreWords] }));
    },

    reset() {
      update(s => ({
        ...s,
        status: 'idle',
        currentWordIndex: 0,
        currentInput: '',
        typedHistory: [],
        wordCorrectness: [],
        startTime: 0,
        endTime: 0,
        wordsGoal: s.mode === 'words' ? Math.max(1, Math.floor(Number(s.modeValue)) || 1) : 0,
        timeLeft: s.mode === 'time' ? s.modeValue : 0,
        wpm: 0, rawWpm: 0, accuracy: 100,
        charsCorrect: 0, charsIncorrect: 0,
        charsExtra: 0, charsMissed: 0,
        wpmHistory: [],
        secondSnapshots: [],
        _errorsThisSecond: 0,
        _totalErrors: 0,
        _charsThisSecond: 0,
        _lastSnapshotSec: 0,
      }));
    },
  };
}

export const typingStore = createTypingStore();
