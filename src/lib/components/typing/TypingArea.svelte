<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';
  import { mapToSakha, getSakhaHint } from '$utils/sakha.js';
  import { api } from '$utils/api.js';
  import { userStore } from '$stores/user.js';
  import { soundManager } from '$utils/sound.js';

  let wordsContainer;
  let hiddenInput;
  let caretRef;
  let timerInterval = null;
  let isFocused = true;
  let finishCalled = false;

  // Export event for parent
  /** @type {(data: any) => void} */
  export let onTestComplete = () => {};

  $: state = $typingStore;
  $: settings = $settingsStore;
  $: theme = settings.theme;

  // Update sound manager when settings change
  $: soundManager.setEnabled(settings.soundEnabled);

  // Load words on settings change
  $: if (settings) {
    loadWords();
  }

  async function loadWords() {
    finishCalled = false;
    const count = settings.mode === 'words' ? settings.modeValue : 100;
    try {
      const data = await api.getWords(settings.language, count);
      typingStore.init(data.words, settings.mode, settings.modeValue, settings.language);
    } catch {
      // Fallback words
      typingStore.init(
        ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'],
        settings.mode, settings.modeValue, settings.language
      );
    }
  }

  function handleKeyDown(e) {
    if (state.status === 'finished') return;

    // Focus the hidden input
    if (hiddenInput) hiddenInput.focus();

    // Start on first keypress
    if (state.status === 'idle' && e.key.length === 1) {
      typingStore.start();
      startTimer();
    }

    if (state.status !== 'running' && state.status !== 'idle') return;

    // Sakha binds
    if (settings.sakhaBinds && settings.language === 'sakha') {
      const mapped = mapToSakha(e.key, settings.customBindings);
      if (mapped) {
        e.preventDefault();
        typingStore.setInput(state.currentInput + mapped);
        updateCaret();
        return;
      }
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (state.currentInput.length > 0) {
        const word = state.words[state.currentWordIndex];
        const isCorrect = state.currentInput === word;
        typingStore.commitWord();
        updateCaret();

        // Play sound
        if (settings.soundEnabled) {
          if (isCorrect) {
            soundManager.playCorrect();
          } else {
            soundManager.playIncorrect();
          }
        }
      }
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (state.currentInput.length > 0) {
        typingStore.setInput(state.currentInput.slice(0, -1));
        updateCaret();
      }
      return;
    }

    // Tab or Esc to restart
    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault();
      restart();
      return;
    }

    // Ignore control keys
    if (e.key.length > 1) return;

    // Expert mode: stop on wrong char
    if (settings.difficulty === 'expert') {
      const word = state.words[state.currentWordIndex];
      const pos = state.currentInput.length;
      if (pos < word.length && e.key !== word[pos]) {
        // Flash red? For now just don't add
        return;
      }
    }

    typingStore.setInput(state.currentInput + e.key);
    updateCaret();

    // Play keystroke sound
    if (settings.soundEnabled) {
      soundManager.playKeystroke();
    }
  }

  function startTimer() {
    if (settings.mode === 'time') {
      let timeLeft = settings.modeValue;
      timerInterval = setInterval(() => {
        timeLeft--;
        typingStore.tick(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          finishTest();
        }
      }, 1000);
    }
  }

  async function finishTest() {
    if (finishCalled) return;
    finishCalled = true;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Wait for state to update
    await tick();

    const s = $typingStore;

    const resultData = {
      wpm: s.wpm,
      raw_wpm: s.rawWpm,
      accuracy: s.accuracy,
      mode: s.mode,
      mode_value: s.modeValue,
      language: s.language,
      difficulty: settings.difficulty,
      chars_correct: s.charsCorrect,
      chars_incorrect: s.charsIncorrect,
      chars_extra: s.charsExtra,
      chars_missed: s.charsMissed,
    };

    try {
      const token = $userStore.token;
      const response = await api.submitResult(resultData, token);
      if (response.level_up || response.new_achievements?.length > 0) {
        userStore.refresh();
      }

      // Play completion sound
      if (settings.soundEnabled) {
        soundManager.playComplete();
      }

      onTestComplete(response);
    } catch (err) {
      console.error('Failed to submit result:', err);
      onTestComplete(resultData);
    }
  }

  function restart() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    loadWords();
  }

  async function updateCaret() {
    await tick();
    if (!wordsContainer || !caretRef) return;

    const wordIndex = $typingStore.currentWordIndex;
    const charIndex = $typingStore.currentInput.length;

    const wordEl = wordsContainer.querySelector(`[data-word="${wordIndex}"]`);
    if (!wordEl) return;

    const charEl = wordEl.querySelector(`[data-char="${charIndex}"]`);
    const containerRect = wordsContainer.getBoundingClientRect();

    if (charEl) {
      const charRect = charEl.getBoundingClientRect();
      caretRef.style.left = `${charRect.left - containerRect.left}px`;
      caretRef.style.top = `${charRect.top - containerRect.top}px`;
      caretRef.style.height = `${charRect.height}px`;

      // Auto-scroll to keep caret visible
      const caretTop = charRect.top - containerRect.top;
      const caretBottom = caretTop + charRect.height;
      if (caretBottom > containerRect.height - 40) {
        wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // After last char of the word
      const lastChar = wordEl.querySelector(`[data-char="${charIndex - 1}"]`);
      if (lastChar) {
        const rect = lastChar.getBoundingClientRect();
        caretRef.style.left = `${rect.right - containerRect.left}px`;
        caretRef.style.top = `${rect.top - containerRect.top}px`;
        caretRef.style.height = `${rect.height}px`;
      }
    }
  }

  function handleFocus() { isFocused = true; }
  function handleBlur() { isFocused = false; }

  // Watch for test finish
  $: if (state.status === 'finished' && state.endTime > 0) {
    finishTest();
  }

  onMount(() => {
    if (hiddenInput) hiddenInput.focus();
    updateCaret();
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  /**
   * @param {string} word
   * @param {number} wordIndex
   * @param {string[]} typedChars
   * @returns {Array<{char: string, class: string, hint: string|null}>}
   */
  function getCharDisplay(word, wordIndex, typedChars) {
    const result = [];

    // For current word, include currentInput length in calculation
    let maxLen;
    if (wordIndex === state.currentWordIndex) {
      maxLen = Math.max(word.length, state.currentInput.length);
    } else {
      maxLen = Math.max(word.length, typedChars?.length || 0);
    }

    for (let i = 0; i < maxLen; i++) {
      const expected = word[i];
      const typed = typedChars?.[i];

      if (wordIndex < state.currentWordIndex) {
        // Already typed word
        if (i < word.length && typed !== undefined) {
          result.push({
            char: expected,
            class: typed === expected ? 'word-correct' : 'word-incorrect',
            hint: null,
          });
        } else if (i >= word.length && typed !== undefined) {
          result.push({ char: typed, class: 'word-extra', hint: null });
        } else {
          result.push({ char: expected, class: 'word-incorrect', hint: null });
        }
      } else if (wordIndex === state.currentWordIndex) {
        // Current word being typed
        const currentInput = state.currentInput;
        const typedChar = currentInput[i];
        if (i < currentInput.length) {
          if (i < word.length) {
            result.push({
              char: expected,
              class: typedChar === expected ? 'word-correct' : 'word-incorrect',
              hint: null,
            });
          } else {
            result.push({ char: typedChar, class: 'word-extra', hint: null });
          }
        } else if (i < word.length) {
          const hint = settings.showHints && settings.language === 'sakha'
            ? getSakhaHint(expected, settings.customBindings)
            : null;
          result.push({ char: expected, class: 'word-active', hint });
        }
      } else {
        // Future word
        if (i < word.length) {
          result.push({ char: expected, class: 'word-ghost', hint: null });
        }
      }
    }
    return result;
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="w-full animate-fade-in">
  <!-- Stats row -->
  {#if state.status === 'running'}
    <div class="flex flex-wrap gap-6 sm:gap-10 mb-6 opacity-40 hover:opacity-100 transition-opacity duration-500 justify-center sm:justify-start">
      <div class="flex flex-col">
        <span class="text-[9px] mono uppercase text-blue-500">Speed_WPM</span>
        <span class="text-3xl sm:text-4xl font-[800] italic tracking-tighter"
              class:text-white={theme === 'dark'}
              class:text-slate-900={theme === 'light'}>{state.wpm}</span>
      </div>
      <div class="flex flex-col">
        <span class="text-[9px] mono uppercase text-slate-500">Accuracy</span>
        <span class="text-xl sm:text-2xl font-[800] italic tracking-tighter"
              class:text-slate-300={theme === 'dark'}
              class:text-slate-700={theme === 'light'}>{state.accuracy}%</span>
      </div>
      <div class="flex flex-col">
        <span class="text-[9px] mono uppercase text-slate-500">{settings.mode === 'time' ? 'Timer' : 'Progress'}</span>
        <span class="text-xl sm:text-2xl font-[800] italic text-blue-500 tracking-tighter">
          {#if settings.mode === 'time'}
            {String(Math.floor(state.timeLeft / 60)).padStart(2,'0')}:{String(state.timeLeft % 60).padStart(2,'0')}
          {:else}
            {state.currentWordIndex}/{state.words.length}
          {/if}
        </span>
      </div>
    </div>
  {/if}

  <!-- Typing area -->
  <div class="relative cursor-text"
       class:opacity-30={!isFocused && state.status === 'running'}
       on:click={() => hiddenInput?.focus()}
       role="textbox" tabindex="-1">

    <input bind:this={hiddenInput} class="absolute opacity-0 w-0 h-0"
           on:focus={handleFocus} on:blur={handleBlur}
           autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />

    {#if !isFocused && state.status !== 'finished'}
      <div class="absolute inset-0 flex items-center justify-center z-20 rounded-3xl backdrop-blur-sm {theme === 'dark' ? 'bg-[#030303]/70' : 'bg-slate-50/70'}">
        <span class="text-[9px] mono uppercase tracking-[0.3em] text-slate-600 animate-pulse">Click to focus...</span>
      </div>
    {/if}

    <!-- Caret -->
    {#if state.status !== 'finished'}
      <div bind:this={caretRef}
           class="absolute w-[2px] bg-blue-600 rounded-full transition-all duration-75 cursor-blink"
           style="height: 1.5em; z-index: 10;"></div>
    {/if}

    <!-- Words -->
    <div bind:this={wordsContainer}
         class="relative mono leading-relaxed select-none
                text-2xl sm:text-3xl md:text-4xl
                px-2 sm:px-0"
         class:text-slate-700={theme === 'dark'}
         class:text-slate-400={theme === 'light'}
         style="min-height: 8rem; max-height: 12rem; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; padding-top: 2rem;">
      {#each state.words as word, wIdx}
        <span data-word={wIdx} class="inline-block mr-[0.4em] leading-[1.7]">
          {#each getCharDisplay(word, wIdx, state.typedHistory[wIdx]) as { char, class: cls, hint }, cIdx}
            <span data-char={cIdx}
                  class="relative inline-block
                    {cls === 'word-correct' ? (theme === 'dark' ? 'text-white font-[800]' : 'text-slate-900 font-[800]') : ''}
                    {cls === 'word-incorrect' ? 'text-red-500 border-b-2 border-red-500' : ''}
                    {cls === 'word-extra' ? 'text-yellow-500 line-through' : ''}
                    {cls === 'word-ghost' ? '' : ''}
                    {cls === 'word-active' ? (theme === 'dark' ? 'text-slate-500' : 'text-slate-400') : ''}">
              {char}
              {#if hint && cls === 'word-active'}
                <span class="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] mono px-2 py-1 rounded-lg bg-blue-600 border border-blue-500 text-white whitespace-nowrap pointer-events-none shadow-lg z-50">
                  {hint}
                </span>
              {/if}
            </span>
          {/each}
        </span>
      {/each}
    </div>
  </div>

  <!-- Restart + Hints -->
  <div class="mt-10 flex flex-col items-center gap-4">
    <button class="flex items-center gap-3 text-slate-600 hover:text-blue-500 transition-all group"
            on:click={restart}>
      <div class="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-600/5 transition-all">
        <svg class="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </div>
      <span class="text-[9px] font-[800] uppercase tracking-[0.2em] italic">Рестарт (Tab или Esc)</span>
    </button>

    <!-- Sakha Hints -->
    <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-5 opacity-20 hover:opacity-50 transition-opacity duration-500 select-none">
      {#each Object.entries(settings.customBindings || {}) as [key, char]}
        <div class="flex items-center gap-1.5">
          <span class="mono text-[9px] px-1 py-0.5 rounded border bg-white/5 text-slate-500 {theme === 'dark' ? 'border-white/10' : 'border-slate-300'}">{key}</span>
          <span class="text-[9px] mono text-slate-600">→</span>
          <span class="text-[10px] font-[800] italic text-slate-400">{char}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
