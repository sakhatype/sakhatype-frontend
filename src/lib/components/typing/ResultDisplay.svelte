<script>
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';
  import { uiStore } from '$stores/ui.js';
  import WpmGraph from './WpmGraph.svelte';
  import { onMount, onDestroy, tick } from 'svelte';

  export let result = null;
  export let onRestart = () => {};

  $: state = $typingStore;
  $: theme = $settingsStore.theme;
  $: wpm = result?.result?.wpm || state.wpm || 0;
  $: rawWpm = result?.result?.raw_wpm || state.rawWpm || 0;
  $: accuracy = result?.result?.accuracy || state.accuracy || 0;
  $: xpEarned = result?.xp_earned || 0;
  $: levelUp = result?.level_up || false;
  $: newAchievements = result?.new_achievements || [];
  $: shareMode = result?.result?.mode || result?.mode || state.mode || 'time';
  $: shareModeValueRaw =
    result?.result?.mode_value ??
    result?.result?.modeValue ??
    result?.mode_value ??
    result?.modeValue ??
    state.modeValue;
  $: shareModeValue =
    Math.max(1, Math.floor(Number(shareModeValueRaw)) || (shareMode === 'time' ? 30 : 25));
  $: shareDifficulty =
    result?.result?.difficulty || result?.difficulty || $settingsStore.difficulty || 'normal';
  $: shareModeLabel = shareMode === 'words' ? `${shareModeValue} слов` : `${shareModeValue} сек`;
  $: shareDifficultyLabel = shareDifficulty === 'expert' ? 'Сложный' : 'Лёгкий';
  $: totalErrors = state._totalErrors || 0;
  $: peakWpm = state.secondSnapshots?.length > 0
    ? Math.round(Math.max(...state.secondSnapshots.map(d => d.wpm)))
    : wpm;
  $: consistency = state.secondSnapshots?.length > 2
    ? calcConsistency(state.secondSnapshots)
    : null;

  let displayWpm = 0;
  let displayAcc = 0;
  let counterFrame = null;
  let shareState = 'idle';
  let shareTimer = null;
  let xpToastTimer = null;
  let restartButtonEl = null;
  let shareButtonEl = null;
  let lastXpToastKey = '';

  function calcConsistency(snapshots) {
    const wpms = snapshots.map(s => s.wpm).filter(w => w > 0);
    if (wpms.length < 2) return null;
    const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
    const sd = Math.sqrt(variance);
    const cv = mean > 0 ? (sd / mean) * 100 : 0;
    return Math.max(0, Math.round(100 - cv));
  }

  function animateCounters() {
    const startTime = performance.now();
    const duration = 800;
    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      displayWpm = Math.round(wpm * ease * 100) / 100;
      displayAcc = Math.round(accuracy * ease * 100) / 100;
      if (t < 1) {
        counterFrame = requestAnimationFrame(tick);
      } else {
        displayWpm = wpm;
        displayAcc = accuracy;
      }
    }
    counterFrame = requestAnimationFrame(tick);
  }

  function handleKey(e) {
    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault();
      onRestart();
    }
  }

  function setShareState(next, delay = 1800) {
    shareState = next;
    if (shareTimer) clearTimeout(shareTimer);
    if (next !== 'idle') {
      shareTimer = setTimeout(() => {
        shareState = 'idle';
      }, delay);
    }
  }

  function showProfileXpToast() {
    if (xpEarned <= 0) return;
    const toastKey = `${xpEarned}:${levelUp}:${result?.new_level ?? ''}`;
    if (lastXpToastKey === toastKey) return;
    lastXpToastKey = toastKey;

    uiStore.update(s => ({
      ...s,
      profileXpToast: {
        amount: xpEarned,
      },
      profileLevelToast: levelUp ? { newLevel: result?.new_level ?? null } : null,
    }));

    if (xpToastTimer) clearTimeout(xpToastTimer);
    xpToastTimer = setTimeout(() => {
      uiStore.update(s => ({ ...s, profileXpToast: null, profileLevelToast: null }));
      xpToastTimer = null;
    }, 5000);
  }

  async function handleShare() {
    const shareUrl = 'https://sakhatype.ru';
    const shareText =
      'Только что прошел тест в SakhaType.\n' +
      `Результат: ${Math.round(wpm)} WPM и ${Math.round(accuracy)}% точности.\n` +
      `Режим: ${shareModeLabel}, ${shareDifficultyLabel.toLowerCase()}.\n` +
      `Сможешь быстрее?\n${shareUrl}`;
    const shareData = {
      title: 'SakhaType',
      text: shareText
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareState('done');
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setShareState('copied');
    } catch (err) {
      // Ignore user-cancelled native share sheet.
      if (err?.name === 'AbortError') return;
      setShareState('error', 2200);
    }
  }

  async function syncActionButtonsWidth() {
    await tick();
    if (!restartButtonEl || !shareButtonEl) return;
    restartButtonEl.style.width = 'auto';
    shareButtonEl.style.width = 'auto';
    const maxWidth = Math.max(restartButtonEl.offsetWidth, shareButtonEl.offsetWidth);
    restartButtonEl.style.width = `${maxWidth}px`;
    shareButtonEl.style.width = `${maxWidth}px`;
  }

  $: if (state.status === 'finished') {
    syncActionButtonsWidth();
  }

  $: if (state.status === 'finished' && xpEarned > 0) {
    showProfileXpToast();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKey);
    animateCounters();
    window.addEventListener('resize', syncActionButtonsWidth);
  });
  onDestroy(() => {
    window.removeEventListener('keydown', handleKey);
    window.removeEventListener('resize', syncActionButtonsWidth);
    if (counterFrame) cancelAnimationFrame(counterFrame);
    if (shareTimer) clearTimeout(shareTimer);
    if (xpToastTimer) clearTimeout(xpToastTimer);
    uiStore.update(s => ({ ...s, profileXpToast: null, profileLevelToast: null }));
  });
</script>

{#if state.status === 'finished'}
<div class="w-full max-w-5xl mx-auto relative z-10 px-4 sm:px-0">

  <!-- ═══ HERO WPM ═══ -->
  <div class="flex flex-col items-center text-center mb-8 animate-scale-in">
    <p class="mono text-[10px] font-bold uppercase tracking-[0.3em] text-surface-400 mb-3">Скорость печати</p>
    <div class="relative">
      <span class="text-[80px] sm:text-[120px] md:text-[150px] font-heading font-black leading-none text-primary-400"
            style="filter: drop-shadow(0 0 40px rgba(113,113,122,0.22)) drop-shadow(0 0 80px rgba(113,113,122,0.12));">
        {Math.round(displayWpm)}
      </span>
      <span class="absolute -bottom-4 left-1/2 -translate-x-1/2 mono text-[11px] font-bold uppercase text-surface-400 inline-flex items-center gap-2">
        <span>W</span>
        <span>P</span>
        <span>M</span>
      </span>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-3 mt-7 w-full sm:w-auto">
      <button on:click={onRestart}
              bind:this={restartButtonEl}
              class="group relative px-8 sm:px-10 py-3 rounded-2xl font-heading font-bold uppercase text-[11px] tracking-[0.2em] transition-all duration-300 overflow-hidden s-card hover:!bg-primary-500 hover:!text-white hover:!border-primary-400/50 hover:glow-primary-strong"
              class:text-surface-300={theme === 'dark'}
              class:text-surface-600={theme === 'light'}>
        <span class="relative z-10">Ещё раз</span>
      </button>

      <button on:click={handleShare}
              bind:this={shareButtonEl}
              class="group relative px-8 sm:px-10 py-3 rounded-2xl font-heading font-bold uppercase text-[11px] tracking-[0.2em] transition-all duration-300 overflow-hidden s-card hover:!border-surface-400/70"
              class:text-surface-300={theme === 'dark'}
              class:text-surface-600={theme === 'light'}>
        <span class="relative z-10">
          {#if shareState === 'done'}
            Отправлено
          {:else if shareState === 'copied'}
            Скопировано
          {:else if shareState === 'error'}
            Не удалось
          {:else}
            Поделиться
          {/if}
        </span>
      </button>
    </div>
  </div>

  <!-- ═══ KEY STATS ROW ═══ -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
    <div class="s-card p-4 sm:p-5 text-center animate-fade-up" style="animation-delay: 0.1s">
      <p class="mono text-[8px] uppercase tracking-widest text-surface-400 mb-2">Точность</p>
      <p class="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight"
         class:text-success-400={accuracy >= 95}
         class:text-warning-400={accuracy >= 80 && accuracy < 95}
         class:text-error-400={accuracy < 80}>{displayAcc}%</p>
    </div>

    <div class="s-card p-4 sm:p-5 text-center animate-fade-up" style="animation-delay: 0.15s">
      <p class="mono text-[8px] uppercase tracking-widest text-surface-400 mb-2">Raw</p>
      <p class="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight"
         class:text-surface-100={theme === 'dark'}
         class:text-surface-800={theme === 'light'}>{rawWpm}</p>
    </div>

    <div class="s-card p-4 sm:p-5 text-center animate-fade-up" style="animation-delay: 0.2s">
      <p class="mono text-[8px] uppercase tracking-widest text-surface-400 mb-2">Пик</p>
      <p class="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-primary-300">{peakWpm}</p>
    </div>

    <div class="s-card p-4 sm:p-5 text-center animate-fade-up" style="animation-delay: 0.25s">
      {#if consistency !== null}
        <p class="mono text-[8px] uppercase tracking-widest text-surface-400 mb-2">Стабильность</p>
        <p class="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight"
           class:text-success-400={consistency >= 80}
           class:text-warning-400={consistency >= 50 && consistency < 80}
           class:text-error-400={consistency < 50}>{consistency}%</p>
      {:else}
        <p class="mono text-[8px] uppercase tracking-widest text-surface-400 mb-2">Ошибки</p>
        <p class="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-error-400">{totalErrors}</p>
      {/if}
    </div>
  </div>

  {#if newAchievements.length > 0}
    <div class="mb-6 animate-fade-up" style="animation-delay: 0.28s">
      <div class="s-card p-4 sm:p-5 flex flex-wrap items-center justify-center gap-3">
        {#each newAchievements as ach}
          <span class="badge-sakha border border-warning-500/30 bg-warning-500/10 text-warning-400">
            {ach}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ═══ GRAPH ═══ -->
  <div class="animate-fade-in" style="animation-delay: 0.3s">
    <WpmGraph wpmHistory={state.wpmHistory} {wpm} {rawWpm} />
  </div>

  <!-- ═══ DETAIL STATS ═══ -->
  <!-- <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 animate-fade-in" style="animation-delay: 0.4s">
    <div class="s-card p-3 sm:p-4 text-center">
      <p class="mono text-[7px] uppercase tracking-widest text-surface-400 mb-1">Верные</p>
      <p class="text-lg font-heading font-extrabold text-success-400">{state.charsCorrect}</p>
    </div>
    <div class="s-card p-3 sm:p-4 text-center">
      <p class="mono text-[7px] uppercase tracking-widest text-surface-400 mb-1">Неверные</p>
      <p class="text-lg font-heading font-extrabold text-error-400">{state.charsIncorrect}</p>
    </div>
    <div class="s-card p-3 sm:p-4 text-center">
      <p class="mono text-[7px] uppercase tracking-widest text-surface-400 mb-1">Лишние</p>
      <p class="text-lg font-heading font-extrabold text-warning-400">{state.charsExtra}</p>
    </div>
    <div class="s-card p-3 sm:p-4 text-center">
      <p class="mono text-[7px] uppercase tracking-widest text-surface-400 mb-1">Пропущенные</p>
      <p class="text-lg font-heading font-extrabold text-surface-400">{state.charsMissed}</p>
    </div>
  </div> -->

</div>
{/if}
