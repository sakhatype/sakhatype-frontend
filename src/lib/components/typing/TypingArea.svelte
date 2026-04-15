<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';
  import { mapToSakha, getSakhaHint } from '$utils/sakha.js';
  import { api } from '$utils/api.js';
  import { getOfflineWords } from '$utils/wordDifficulty.js';
  import { userStore } from '$stores/user.js';
  import { uiStore } from '$stores/ui.js';
  import { soundManager } from '$utils/sound.js';

  let canvasEl;
  let containerEl;
  let hiddenInput;
  let timerInterval = null;
  let isFocused = true;
  let finishCalled = false;
  let isMobile = false;

  // Canvas state
  let dpr = 1;
  let canvasW = 0;
  let canvasH = 0;
  let fontSize = 32;
  let lineHeight = 0;
  let visibleLines = 3;
  let scrollLine = 0;
  let targetScrollLine = 0;
  const PAD_TOP = 48; // reserved space above text for hints

  // Precomputed layout
  let layout = [];
  let totalLines = 0;

  // Caret
  let caretX = 0;
  let caretY = 0;
  let caretVisible = true;
  let caretBlinkTimer = null;

  // Smooth caret animation
  let caretDisplayX = 0;
  let caretDisplayY = 0;
  let animRunning = false;

  // Char pop animation: { x, y, char, cls, startTime }
  let charPops = [];

  // Track settings for word reload
  let prevMode = '';
  let prevModeValue = 0;
  let prevLanguage = '';
  let prevDifficulty = '';

  export let onTestComplete = () => {};

  /** Минимум «запаса» слов впереди; ниже — догружаем с API / офлайн */
  const WORD_BUFFER_MIN = 45;
  const WORD_FETCH_BATCH = 90;

  let wordPrefetchPromise = null;

  $: state = $typingStore;
  $: settings = $settingsStore;
  $: theme = settings.theme;

  $: soundManager.setEnabled(settings.soundEnabled);

  // Sakha hint for next relevant char in current word
  $: currentHint = (() => {
    if (!settings.showHints || settings.language !== 'sakha') return null;
    if (state.status === 'finished') return null;
    const word = state.words[state.currentWordIndex];
    if (!word) return null;

    for (let charIdx = state.currentInput.length; charIdx < word.length; charIdx++) {
      const hint = getSakhaHint(word[charIdx], settings.customBindings);
      if (hint) {
        return {
          text: hint,
          wordIdx: state.currentWordIndex,
          charIdx
        };
      }
    }

    return null;
  })();

  // Reload words when mode/value/language/difficulty change
  $: {
    const m = settings.mode;
    const mv = settings.modeValue;
    const l = settings.language;
    const d = settings.difficulty;
    if (m !== prevMode || mv !== prevModeValue || l !== prevLanguage || d !== prevDifficulty) {
      prevMode = m;
      prevModeValue = mv;
      prevLanguage = l;
      prevDifficulty = d;
      loadWords();
    }
  }

  // Redraw on any state change
  $: if (canvasEl && state) {
    requestAnimationFrame(() => {
      computeLayout();
      updateCaret();
      draw();
    });
  }

  async function loadWords() {
    finishCalled = false;
    scrollLine = 0;
    targetScrollLine = 0;
    caretDisplayX = 0;
    caretDisplayY = 0;
    charPops = [];
    // Снимок до await — иначе после ответа API могут уйти уже другие mode/modeValue из настроек
    const modeSnap = settings.mode;
    const modeValSnap = Number(settings.modeValue);
    const langSnap = settings.language;
    const diffSnap = settings.difficulty;
    const targetWords = modeSnap === 'words' ? Math.max(1, Math.floor(modeValSnap) || 1) : 100;
    const count =
      modeSnap === 'words'
        ? Math.max(targetWords, WORD_BUFFER_MIN + 25)
        : targetWords;
    try {
      const data = await api.getWords(langSnap, count, diffSnap);
      typingStore.init(data.words, modeSnap, modeValSnap, langSnap);
    } catch {
      typingStore.init(
        getOfflineWords(diffSnap, count),
        modeSnap, modeValSnap, langSnap
      );
    }
    await tick();
    resizeCanvas();
    void ensureWordBuffer();
  }

  /** Синхронно добить буфер офлайн, если закончились слова (пока ждём сеть) */
  function topUpWordsIfEmptySync() {
    let guard = 0;
    while (guard++ < 24) {
      const s = get(typingStore);
      if (s.status === 'finished') return;
      if (s.currentWordIndex < s.words.length) return;
      if (s.mode === 'words') {
        const g = s.wordsGoal || Math.max(1, Math.floor(Number(s.modeValue)) || 1);
        if (s.currentWordIndex >= g) return;
      }
      const batch = getOfflineWords(settings.difficulty, WORD_FETCH_BATCH);
      if (!batch.length) return;
      typingStore.appendWords(batch);
    }
  }

  /** Фоновая подгрузка, пока в буфере мало слов впереди */
  function ensureWordBuffer() {
    const s = get(typingStore);
    if (s.status !== 'running' && s.status !== 'idle') return;
    if (s.status === 'finished') return;

    const ahead = s.words.length - s.currentWordIndex;
    if (s.mode === 'words') {
      const g = s.wordsGoal || Math.max(1, Math.floor(Number(s.modeValue)) || 1);
      if (s.currentWordIndex >= g) return;
      if (s.words.length >= g && ahead >= WORD_BUFFER_MIN) return;
    } else if (ahead >= WORD_BUFFER_MIN) {
      return;
    }

    if (wordPrefetchPromise) return;
    wordPrefetchPromise = (async () => {
      try {
        const data = await api.getWords(settings.language, WORD_FETCH_BATCH, settings.difficulty);
        if (data?.words?.length) typingStore.appendWords(data.words);
      } catch {
        typingStore.appendWords(getOfflineWords(settings.difficulty, WORD_FETCH_BATCH));
      } finally {
        wordPrefetchPromise = null;
        topUpWordsIfEmptySync();
      }
    })();
  }

  function detectMobile() {
    isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  function focusInput() {
    if (hiddenInput) hiddenInput.focus({ preventScroll: true });
  }

  // ─── CANVAS SETUP ────────────────────────────────────────────────
  function resizeCanvas() {
    if (!canvasEl || !containerEl) return;
    dpr = window.devicePixelRatio || 1;

    const rect = containerEl.getBoundingClientRect();
    const w = rect.width;

    // Responsive font size
    if (w < 400) fontSize = 18;
    else if (w < 640) fontSize = 22;
    else if (w < 768) fontSize = 26;
    else if (w < 1024) fontSize = 30;
    else fontSize = 34;

    lineHeight = Math.round(fontSize * 1.75);
    canvasH = PAD_TOP + lineHeight * visibleLines;
    canvasW = Math.floor(w);

    canvasEl.width = canvasW * dpr;
    canvasEl.height = canvasH * dpr;
    canvasEl.style.width = canvasW + 'px';
    canvasEl.style.height = canvasH + 'px';

    computeLayout();
    updateCaret();
    draw();
  }

  // ─── TEXT LAYOUT ─────────────────────────────────────────────────
  function computeLayout() {
    if (!canvasEl || !state.words.length) { layout = []; return; }
    const ctx = canvasEl.getContext('2d');
    ctx.font = `500 ${fontSize}px 'JetBrains Mono', monospace`;

    const wordGap = Math.round(fontSize * 0.45);
    const maxWidth = canvasW - 8;

    layout = [];
    let x = 0;
    let y = 0;
    let currentLine = 0;

    const wordsGoalUi =
      state.mode === 'words'
        ? (state.wordsGoal > 0
            ? state.wordsGoal
            : Math.max(1, Math.floor(Number(state.modeValue)) || 1))
        : state.words.length;
    const layoutWordCount =
      state.mode === 'words' ? Math.min(state.words.length, wordsGoalUi) : state.words.length;

    for (let wIdx = 0; wIdx < layoutWordCount; wIdx++) {
      const word = state.words[wIdx];
      const displayChars = getDisplayChars(word, wIdx);

      // Measure word
      let wordWidth = 0;
      const charLayouts = [];
      for (const dc of displayChars) {
        const cw = ctx.measureText(dc.char).width;
        charLayouts.push({ ...dc, w: cw });
        wordWidth += cw;
      }

      // Wrap
      if (x > 0 && x + wordWidth > maxWidth) {
        x = 0;
        y += lineHeight;
        currentLine++;
      }

      let cx = x;
      for (const cl of charLayouts) {
        cl.x = cx;
        cl.y = y;
        cl.lineIdx = currentLine;
        cx += cl.w;
      }

      layout.push({
        wordIdx: wIdx,
        word,
        chars: charLayouts,
        x, y,
        lineIdx: currentLine,
        width: wordWidth,
      });

      x += wordWidth + wordGap;
    }

    totalLines = (layout.length > 0 ? layout[layout.length - 1].lineIdx : 0) + 1;
  }

  function getDisplayChars(word, wordIdx) {
    const result = [];

    if (wordIdx < state.currentWordIndex) {
      const typedArr = state.typedHistory[wordIdx];
      const maxLen = Math.max(word.length, typedArr?.length || 0);
      for (let i = 0; i < maxLen; i++) {
        const expected = word[i];
        const t = typedArr?.[i];
        if (i < word.length && t !== undefined) {
          result.push({ char: expected, cls: t === expected ? 'c' : 'i' });
        } else if (i >= word.length && t !== undefined) {
          result.push({ char: t, cls: 'x' });
        } else {
          result.push({ char: expected, cls: 'i' });
        }
      }
    } else if (wordIdx === state.currentWordIndex) {
      const ci = state.currentInput;
      const maxLen = Math.max(word.length, ci.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < ci.length) {
          if (i < word.length) {
            result.push({ char: word[i], cls: ci[i] === word[i] ? 'c' : 'i' });
          } else {
            result.push({ char: ci[i], cls: 'x' });
          }
        } else if (i < word.length) {
          result.push({ char: word[i], cls: 'a' });
        }
      }
    } else {
      for (let i = 0; i < word.length; i++) {
        result.push({ char: word[i], cls: 'g' });
      }
    }
    return result;
  }

  // ─── CARET ───────────────────────────────────────────────────────
  function updateCaret() {
    if (!layout.length) return;
    const wIdx = state.currentWordIndex;
    const cIdx = state.currentInput.length;
    const wordLayout = layout.find(l => l.wordIdx === wIdx);
    if (!wordLayout) return;

    if (cIdx < wordLayout.chars.length) {
      const ch = wordLayout.chars[cIdx];
      caretX = ch.x;
      caretY = ch.y;
    } else if (wordLayout.chars.length > 0) {
      const last = wordLayout.chars[wordLayout.chars.length - 1];
      caretX = last.x + last.w;
      caretY = last.y;
    } else {
      caretX = wordLayout.x;
      caretY = wordLayout.y;
    }

    // Init display pos on first call
    if (caretDisplayX === 0 && caretDisplayY === 0) {
      caretDisplayX = caretX;
      caretDisplayY = caretY;
    }

    // Scroll: keep caret on visible line 1 (second row) when possible
    const caretLine = wordLayout.lineIdx;
    if (caretLine >= 2) {
      targetScrollLine = caretLine - 1;
    } else {
      targetScrollLine = 0;
    }
    scrollLine = targetScrollLine;

    startAnimLoop();
  }

  function startAnimLoop() {
    if (animRunning) return;
    animRunning = true;
    requestAnimationFrame(animTick);
  }

  function animTick(now) {
    // Lerp caret toward target
    const lerpFactor = 0.3;
    caretDisplayX += (caretX - caretDisplayX) * lerpFactor;
    caretDisplayY += (caretY - caretDisplayY) * lerpFactor;

    // Snap if close enough
    if (Math.abs(caretX - caretDisplayX) < 0.5) caretDisplayX = caretX;
    if (Math.abs(caretY - caretDisplayY) < 0.5) caretDisplayY = caretY;

    // Expire old char pops (keep last 300ms)
    charPops = charPops.filter(p => now - p.startTime < 300);

    draw();

    // Keep running if caret is still moving or pops are active
    const caretMoving = Math.abs(caretX - caretDisplayX) > 0.5 || Math.abs(caretY - caretDisplayY) > 0.5;
    if (caretMoving || charPops.length > 0) {
      requestAnimationFrame(animTick);
    } else {
      animRunning = false;
    }
  }

  function pushCharPop(x, y, char, cls) {
    // Measure char width
    let w = fontSize * 0.6; // fallback
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      ctx.font = `500 ${fontSize}px 'JetBrains Mono', monospace`;
      w = ctx.measureText(char).width;
    }
    charPops.push({ x, y, w, char, cls, startTime: performance.now() });
    startAnimLoop();
  }

  function startCaretBlink() {
    if (caretBlinkTimer) clearInterval(caretBlinkTimer);
    caretVisible = true;
    caretBlinkTimer = setInterval(() => {
      caretVisible = !caretVisible;
      draw();
    }, 530);
  }

  function resetCaretBlink() {
    caretVisible = true;
    if (caretBlinkTimer) clearInterval(caretBlinkTimer);
    caretBlinkTimer = setInterval(() => {
      caretVisible = !caretVisible;
      draw();
    }, 530);
  }

  // ─── DRAW ────────────────────────────────────────────────────────
  function draw() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const d = dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, canvasW, canvasH);

    if (!layout.length) return;

    const isDark = theme === 'dark';
    const scrollY = scrollLine * lineHeight;

    const colors = {
      c: isDark ? '#fafafa' : '#18181b',
      i: '#ef4444',
      x: '#f59e0b',
      a: isDark ? '#a1a1aa' : '#71717a',
      g: isDark ? '#52525b' : '#d4d4d8',
    };

    ctx.textBaseline = 'alphabetic';
    const baseline = Math.round(fontSize * 1.25); // baseline within line

    // Draw characters (offset by PAD_TOP)
    for (const wl of layout) {
      const wy = wl.y - scrollY;
      if (wy + lineHeight < -5 || wy > canvasH + 5) continue;

      for (const ch of wl.chars) {
        const drawY = PAD_TOP + ch.y - scrollY + baseline;
        const drawX = ch.x;

        // Bold for correct chars
        if (ch.cls === 'c') {
          ctx.font = `800 ${fontSize}px 'JetBrains Mono', monospace`;
        } else {
          ctx.font = `500 ${fontSize}px 'JetBrains Mono', monospace`;
        }

        ctx.fillStyle = colors[ch.cls] || colors.g;
        ctx.fillText(ch.char, drawX, drawY);

        // Underline for incorrect
        if (ch.cls === 'i') {
          const underY = drawY + 3;
          ctx.fillStyle = colors.i;
          ctx.fillRect(drawX, underY, ch.w, 2);
        }

        // Strikethrough for extra
        if (ch.cls === 'x') {
          const strikeY = drawY - fontSize * 0.35;
          ctx.fillStyle = 'rgba(245,158,11,0.45)';
          ctx.fillRect(drawX, strikeY, ch.w, 1.5);
        }
      }
    }

    // Caret (offset by PAD_TOP, using smooth display position)
    if (state.status !== 'finished' && caretVisible && isFocused) {
      const cy = PAD_TOP + caretDisplayY - scrollY + baseline - fontSize - 2;
      const ch = fontSize + 6;

      // Glow layer
      ctx.save();
      ctx.shadowColor = isDark ? 'rgba(161,161,170,0.55)' : 'rgba(82,82,91,0.45)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = isDark ? '#a1a1aa' : '#52525b';
      ctx.fillRect(Math.round(caretDisplayX) - 1, cy, 2.5, ch);
      ctx.restore();

      // Solid caret
      ctx.fillStyle = isDark ? '#a1a1aa' : '#52525b';
      ctx.fillRect(Math.round(caretDisplayX) - 1, cy, 2.5, ch);
    }

    // ─── CHAR POP ANIMATIONS ──────────────────────────────────────
    const now = performance.now();
    for (const pop of charPops) {
      const elapsed = now - pop.startTime;
      const t = Math.min(elapsed / 250, 1); // 250ms animation
      const easeOut = 1 - Math.pow(1 - t, 3); // cubic ease-out

      const scale = 1 + 0.2 * (1 - easeOut); // starts 1.2x, settles to 1x
      const alpha = 1 - t * 0.6; // fades slightly

      const drawY = PAD_TOP + pop.y - scrollY + baseline;
      const drawX = pop.x;
      const centerX = drawX + pop.w / 2;
      const centerY = drawY - fontSize / 2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      if (pop.cls === 'c') {
        ctx.font = `800 ${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = isDark ? '#fafafa' : '#18181b';
      } else {
        ctx.font = `500 ${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = colors.i;
      }
      ctx.fillText(pop.char, drawX, drawY);
      ctx.restore();
    }

    // ─── HINT BUBBLE above current char ───────────────────────────
    if (currentHint && state.status !== 'finished') {
      const hintWordLayout = layout.find(l => l.wordIdx === currentHint.wordIdx);
      const hintCharLayout = hintWordLayout?.chars?.[currentHint.charIdx];
      if (hintCharLayout) {
        const hintFontSize = Math.round(fontSize * 0.55);
        ctx.font = `700 ${hintFontSize}px 'JetBrains Mono', monospace`;
        const hintText = currentHint.text;
        const hintMetrics = ctx.measureText(hintText);
        const hintW = hintMetrics.width + hintFontSize * 1.8;
        const hintH = hintFontSize * 2.4;
        const hintR = hintFontSize * 0.6;

        // Position: centered above hinted letter (not caret)
        const hintCenterX = Math.round(hintCharLayout.x + hintCharLayout.w / 2);
        let hintX = hintCenterX - hintW / 2;
        if (hintX < 4) hintX = 4;
        if (hintX + hintW > canvasW - 4) hintX = canvasW - 4 - hintW;

        let hintTopY = PAD_TOP + hintCharLayout.y - scrollY - hintH - 6;
        // Keep hint visible (don't let it go above canvas)
        if (hintTopY < 2) hintTopY = 2;

        // Background pill (opaque for readability)
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = isDark ? '#3f3f46' : '#e4e4e7';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(hintX, hintTopY, hintW, hintH, hintR);
        } else {
          // Fallback for older browsers
          ctx.moveTo(hintX + hintR, hintTopY);
          ctx.arcTo(hintX + hintW, hintTopY, hintX + hintW, hintTopY + hintH, hintR);
          ctx.arcTo(hintX + hintW, hintTopY + hintH, hintX, hintTopY + hintH, hintR);
          ctx.arcTo(hintX, hintTopY + hintH, hintX, hintTopY, hintR);
          ctx.arcTo(hintX, hintTopY, hintX + hintW, hintTopY, hintR);
          ctx.closePath();
        }
        ctx.fill();

        // Border
        ctx.strokeStyle = isDark ? '#71717a' : '#a1a1aa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(hintX, hintTopY, hintW, hintH, hintR);
        } else {
          ctx.moveTo(hintX + hintR, hintTopY);
          ctx.arcTo(hintX + hintW, hintTopY, hintX + hintW, hintTopY + hintH, hintR);
          ctx.arcTo(hintX + hintW, hintTopY + hintH, hintX, hintTopY + hintH, hintR);
          ctx.arcTo(hintX, hintTopY + hintH, hintX, hintTopY, hintR);
          ctx.arcTo(hintX, hintTopY, hintX + hintW, hintTopY, hintR);
          ctx.closePath();
        }
        ctx.stroke();

        // Hint text
        ctx.fillStyle = isDark ? '#fafafa' : '#18181b';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${hintFontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(hintText, hintX + hintFontSize * 0.8, hintTopY + hintH / 2);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
      }
    }

    // Bottom gradient fade
    const gradH = Math.round(lineHeight * 0.6);
    const grad = ctx.createLinearGradient(0, canvasH - gradH, 0, canvasH);
    grad.addColorStop(0, isDark ? 'rgba(9,9,11,0)' : 'rgba(250,250,250,0)');
    grad.addColorStop(1, isDark ? 'rgba(9,9,11,1)' : 'rgba(250,250,250,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, canvasH - gradH, canvasW, gradH);
  }

  // ─── DESKTOP INPUT ──────────────────────────────────────────────
  function handleKeyDown(e) {
    if (get(uiStore).keyBindingsModalOpen) return;
    if (state.status === 'finished') return;
    focusInput();

    if (isMobile) {
      if (e.key === 'Tab' || e.key === 'Escape') { e.preventDefault(); restart(); }
      return;
    }

    if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') {
      e.preventDefault();
    }

    if (e.key === ' ')         { commitCurrentWord(); return; }
    if (e.key === 'Backspace') { if (state.currentInput.length > 0) { typingStore.setInput(state.currentInput.slice(0,-1)); syncHiddenInput(); resetCaretBlink(); } return; }
    if (e.key === 'Tab' || e.key === 'Escape') { e.preventDefault(); restart(); return; }
    if (e.key.length > 1) return;

    if (state.status === 'idle') { typingStore.start(); startTimer(); }
    if (state.status !== 'running' && state.status !== 'idle') return;

    if (state.status === 'running') topUpWordsIfEmptySync();
    if (state.currentWordIndex >= state.words.length) return;
    if (state.mode === 'words') {
      const g = state.wordsGoal > 0 ? state.wordsGoal : Math.max(1, Math.floor(Number(state.modeValue)) || 1);
      if (state.currentWordIndex >= g) return;
    }

    if (settings.sakhaBinds && settings.language === 'sakha') {
      const mapped = mapToSakha(e.key, settings.customBindings);
      if (mapped) {
        const word = state.words[state.currentWordIndex];
        const pos = state.currentInput.length;
        const isError = pos < word.length && mapped !== word[pos];
        if (isError) typingStore.recordError();
        typingStore.recordChar();
        pushCharPop(caretX, caretY, mapped, isError ? 'i' : 'c');
        typingStore.setInput(state.currentInput + mapped);
        syncHiddenInput();
        resetCaretBlink();
        if (settings.soundEnabled) soundManager.playKeystroke();
        return;
      }
    }

    const word = state.words[state.currentWordIndex];
    const pos = state.currentInput.length;

    const isError = pos < word.length && e.key !== word[pos];
    if (isError) typingStore.recordError();
    typingStore.recordChar();
    pushCharPop(caretX, caretY, e.key, isError ? 'i' : 'c');
    typingStore.setInput(state.currentInput + e.key);
    syncHiddenInput();
    resetCaretBlink();
    if (settings.soundEnabled) soundManager.playKeystroke();
  }

  // ─── MOBILE INPUT ───────────────────────────────────────────────
  let lastHiddenValue = '';

  function handleMobileInput() {
    if (!isMobile) return;
    if (get(uiStore).keyBindingsModalOpen) return;
    if (state.status === 'finished') return;
    const val = hiddenInput?.value || '';

    if (state.status === 'idle' && val.length > 0) { typingStore.start(); startTimer(); }
    if (state.status !== 'running' && state.status !== 'idle') return;

    const oldInput = state.currentInput;
    if (state.status === 'running') topUpWordsIfEmptySync();
    if (state.currentWordIndex >= state.words.length) return;
    if (state.mode === 'words') {
      const g = state.wordsGoal > 0 ? state.wordsGoal : Math.max(1, Math.floor(Number(state.modeValue)) || 1);
      if (state.currentWordIndex >= g) return;
    }
    if (val.length < lastHiddenValue.length) {
      if (oldInput.length > 0) { typingStore.setInput(oldInput.slice(0,-1)); lastHiddenValue = val; resetCaretBlink(); }
      return;
    }
    const newChars = val.slice(lastHiddenValue.length);
    if (!newChars) { lastHiddenValue = val; return; }

    for (const ch of newChars) {
      if (ch === ' ') {
        commitCurrentWord();
        if (hiddenInput) hiddenInput.value = '';
        lastHiddenValue = '';
        if (get(typingStore).status === 'finished') break;
        continue;
      }
      const cs = get(typingStore);
      if (cs.status === 'finished' || cs.currentWordIndex >= cs.words.length) break;
      if (cs.mode === 'words') {
        const g = cs.wordsGoal > 0 ? cs.wordsGoal : Math.max(1, Math.floor(Number(cs.modeValue)) || 1);
        if (cs.currentWordIndex >= g) break;
      }
      let mc = ch;
      if (settings.sakhaBinds && settings.language === 'sakha') { const m = mapToSakha(ch, settings.customBindings); if (m) mc = m; }
      typingStore.setInput(cs.currentInput + mc);
      const mw = cs.words[cs.currentWordIndex];
      const mp = get(typingStore).currentInput.length - 1;
      if (mp >= 0 && mp < mw.length && mc !== mw[mp]) typingStore.recordError();
      typingStore.recordChar();
      if (settings.soundEnabled) soundManager.playKeystroke();
    }
    lastHiddenValue = hiddenInput?.value || '';
    resetCaretBlink();
  }

  // ─── WORD COMMIT ────────────────────────────────────────────────
  /** Пробел всегда переходит к следующему слову (в т.ч. пустой ввод = пропуск), удержание пробела — повторные keydown. */
  function commitCurrentWord() {
    topUpWordsIfEmptySync();
    let s = get(typingStore);
    if (s.status === 'finished') return;
    if (s.currentWordIndex >= s.words.length) return;
    if (s.mode === 'words') {
      const g = s.wordsGoal > 0 ? s.wordsGoal : Math.max(1, Math.floor(Number(s.modeValue)) || 1);
      if (s.currentWordIndex >= g) return;
    }

    if (s.status === 'idle') {
      typingStore.start();
      startTimer();
      s = get(typingStore);
    }

    if (s.status !== 'running') return;

    const expected = s.words[s.currentWordIndex];
    const hadInput = s.currentInput.length > 0;
    const isCorrect = hadInput && s.currentInput === expected;

    typingStore.commitWord();
    if (hiddenInput) hiddenInput.value = '';
    lastHiddenValue = '';
    resetCaretBlink();
    if (settings.soundEnabled) {
      if (isCorrect) soundManager.playCorrect();
      else if (hadInput) soundManager.playIncorrect();
    }
    const after = get(typingStore);
    if (after.status === 'finished') void finishTest();
    else void ensureWordBuffer();
  }

  function syncHiddenInput() { if (hiddenInput) hiddenInput.value = $typingStore.currentInput; }

  // ─── TIMER ──────────────────────────────────────────────────────
  function startTimer() {
    if (timerInterval) return;
    let timeLeft = settings.mode === 'time' ? settings.modeValue : 9999;
    timerInterval = setInterval(() => {
      if (settings.mode === 'time') {
        timeLeft--;
        typingStore.tick(timeLeft);
        if (timeLeft <= 0) { clearInterval(timerInterval); timerInterval = null; finishTest(); }
      } else {
        typingStore.tick(timeLeft);
      }
    }, 1000);
  }

  // ─── FINISH ─────────────────────────────────────────────────────
  async function finishTest() {
    if (finishCalled) return;
    finishCalled = true;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    await tick();
    const s = $typingStore;
    const resultData = {
      wpm: s.wpm, raw_wpm: s.rawWpm, accuracy: s.accuracy,
      mode: s.mode, mode_value: s.modeValue, language: s.language,
      difficulty: settings.difficulty,
      chars_correct: s.charsCorrect, chars_incorrect: s.charsIncorrect,
      chars_extra: s.charsExtra, chars_missed: s.charsMissed,
    };
    try {
      const token = $userStore.token;
      const response = await api.submitResult(resultData, token);
      if (response.level_up || response.new_achievements?.length > 0) userStore.refresh();
      if (settings.soundEnabled) soundManager.playComplete();
      onTestComplete(response);
    } catch (err) {
      console.error('Failed to submit result:', err);
      onTestComplete(resultData);
    }
  }

  function restart() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (hiddenInput) hiddenInput.value = '';
    lastHiddenValue = '';
    loadWords();
  }

  // ─── FOCUS / BLUR ───────────────────────────────────────────────
  function handleFocus() { isFocused = true; draw(); }
  function handleBlur() { isFocused = false; draw(); }
  function handleTap() { focusInput(); }

  $: if (state.status === 'finished' && state.endTime > 0) { finishTest(); }
  $: if (state.currentWordIndex === 0) { scrollLine = 0; targetScrollLine = 0; }

  function handleResize() { resizeCanvas(); }

  onMount(() => {
    detectMobile();
    if (document.fonts) {
      document.fonts.ready.then(() => {
        resizeCanvas();
        startCaretBlink();
        focusInput();
      });
    } else {
      resizeCanvas();
      startCaretBlink();
      focusInput();
    }
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (caretBlinkTimer) clearInterval(caretBlinkTimer);
    window.removeEventListener('resize', handleResize);
  });
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="w-full animate-fade-in">
  <!-- Timer only during running -->
  {#if state.status === 'running'}
    <div class="flex justify-center mb-6">
      <div class="s-card px-6 py-3 flex flex-col items-center glow-primary">
        <span class="mono text-[9px] uppercase tracking-widest text-surface-400">{settings.mode === 'time' ? 'Timer' : 'Progress'}</span>
        <span class="text-2xl sm:text-3xl font-heading font-extrabold text-primary-400 tracking-tight">
          {#if settings.mode === 'time'}
            {String(Math.floor(state.timeLeft / 60)).padStart(2,'0')}:{String(state.timeLeft % 60).padStart(2,'0')}
          {:else}
            {state.typedHistory.length}/{state.wordsGoal > 0 ? state.wordsGoal : state.modeValue}
          {/if}
        </span>
      </div>
    </div>
  {/if}

  <!-- Canvas typing area -->
  <div bind:this={containerEl}
       class="relative cursor-text"
       on:click={handleTap}
       on:keydown={(e) => {
         if (e.key === 'Enter') {
           e.preventDefault();
           handleTap();
         }
       }}
       on:touchend|preventDefault={handleTap}
       role="textbox" tabindex="0">

    <input bind:this={hiddenInput}
           style="position:absolute;top:0;left:0;width:1px;height:1px;opacity:0.01;border:none;outline:none;padding:0;margin:0;font-size:16px;caret-color:transparent;color:transparent;background:transparent;z-index:-1;"
           on:focus={handleFocus} on:blur={handleBlur} on:input={handleMobileInput}
           autocomplete="off" autocapitalize="off" autocorrect="off"
           spellcheck="false" inputmode="text" enterkeyhint="next" />

    {#if !isFocused && state.status !== 'finished'}
      <div class="absolute inset-0 flex items-center justify-center z-20 rounded-none {theme === 'dark' ? 'bg-surface-900' : 'bg-surface-50'}"
           style="-webkit-backdrop-filter: blur(22px) saturate(110%); backdrop-filter: blur(22px) saturate(110%);">
        <span class="mono text-xs uppercase tracking-[0.25em] text-surface-400 animate-pulse">
          {isMobile ? 'Нажмите для начала...' : ' Нажмите и начните печатать '}
        </span>
      </div>
    {/if}

    <canvas bind:this={canvasEl}
            class="block w-full"
            style="height:{canvasH > 0 ? canvasH + 'px' : (isMobile ? '7rem' : '10rem')};"></canvas>
  </div>

  <!-- Restart + key bindings (hidden during typing) -->
  {#if state.status !== 'running'}
    <div class="mt-8 sm:mt-10 flex justify-center">
      <button class="flex items-center gap-3 text-surface-400 hover:text-primary-400 transition-all group" on:click={restart} aria-label="Перезапустить">
        <div class="s-card w-10 h-10 !rounded-lg flex items-center justify-center group-hover:!border-primary-500/40 transition-all">
          <svg class="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </div>
        <span class="mono text-[10px] font-bold uppercase tracking-wider"></span>
      </button>
    </div>

    <div class="mt-[75px] sm:mt-[75px] h-[72px] hidden sm:flex flex-wrap items-center justify-center gap-3 sm:gap-5 select-none {theme === 'dark' ? 'opacity-50' : 'opacity-100'}">
      {#if settings.sakhaBinds}
        {#each Object.entries(settings.customBindings || {}) as [key, char]}
          <div class="flex items-center gap-1.5">
            <span class="mono text-[10px] px-2 py-0 rounded-md border text-surface-400 {theme === 'dark' ? 'bg-surface-800/50 border-surface-600/50' : 'bg-white border-surface-300'}">{key}</span>
            <span class="text-[14px] mono text-surface-500">→</span>
            <span class="text-[14px] font-normal text-primary-400/70">{char}</span>
          </div>
        {/each}
      {/if}
      <div class="w-full flex items-center justify-center gap-3 sm:gap-5 mt-0">
        <div class="flex items-center gap-1.5">
          <span class="mono text-[10px] px-2 py-0 rounded-md border text-surface-400 {theme === 'dark' ? 'bg-surface-800/50 border-surface-600/50' : 'bg-white border-surface-300'}">Tab</span>
          <span class="text-[14px] mono text-surface-500">→</span>
          <span class="text-[14px] font-normal text-primary-400/70">обновить</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="mono text-[10px] px-2 py-0 rounded-md border text-surface-400 {theme === 'dark' ? 'bg-surface-800/50 border-surface-600/50' : 'bg-white border-surface-300'}">Esc</span>
          <span class="text-[14px] mono text-surface-500">→</span>
          <span class="text-[14px] font-normal text-primary-400/70">отмена</span>
        </div>
      </div>
    </div>
  {/if}
</div>
