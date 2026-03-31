<script>
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';
  import WpmGraph from './WpmGraph.svelte';
  import { onMount, onDestroy } from 'svelte';

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

  onMount(() => {
    window.addEventListener('keydown', handleKey);
    animateCounters();
  });
  onDestroy(() => {
    window.removeEventListener('keydown', handleKey);
    if (counterFrame) cancelAnimationFrame(counterFrame);
  });
</script>

{#if state.status === 'finished'}
<div class="w-full max-w-5xl mx-auto relative z-10 px-4 sm:px-0">

  <!-- ═══ HERO WPM ═══ -->
  <div class="flex flex-col items-center text-center mb-8 animate-scale-in">
    <p class="mono text-[10px] font-bold uppercase tracking-[0.3em] text-surface-400 mb-3">Скорость печати</p>
    <div class="relative">
      <span class="text-[80px] sm:text-[120px] md:text-[150px] font-heading font-black leading-none tracking-tighter text-primary-400"
            style="filter: drop-shadow(0 0 40px rgba(113,113,122,0.22)) drop-shadow(0 0 80px rgba(113,113,122,0.12));">
        {Math.round(displayWpm)}
      </span>
      <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 mono text-[11px] font-bold uppercase tracking-[0.5em] text-surface-400">
        WPM
      </span>
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

  <!-- ═══ GRAPH ═══ -->
  <div class="animate-fade-in" style="animation-delay: 0.3s">
    <WpmGraph wpmHistory={state.wpmHistory} {wpm} {rawWpm} />
  </div>

  <!-- ═══ DETAIL STATS ═══ -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 animate-fade-in" style="animation-delay: 0.4s">
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
  </div>

  <!-- ═══ XP / ACHIEVEMENTS ═══ -->
  {#if xpEarned > 0}
    <div class="mt-5 animate-fade-up" style="animation-delay: 0.5s">
      <div class="s-card p-4 sm:p-5 flex flex-wrap items-center justify-center gap-4 glow-primary">
        <span class="text-lg sm:text-xl font-heading font-extrabold text-primary-400">+{xpEarned} XP</span>
        {#if levelUp}
          <span class="badge-sakha bg-primary-500 text-white animate-scale-in">Ур. {result?.new_level}</span>
        {/if}
        {#each newAchievements as ach}
          <span class="badge-sakha border border-warning-500/30 bg-warning-500/10 text-warning-400">
            {ach}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ═══ RESTART ═══ -->
  <div class="flex justify-center mt-8 mb-4 animate-fade-in" style="animation-delay: 0.55s">
    <button on:click={onRestart}
            class="group relative px-10 sm:px-14 py-4 rounded-2xl font-heading font-bold uppercase text-[11px] tracking-[0.2em] transition-all duration-300 overflow-hidden s-card hover:!bg-primary-500 hover:!text-white hover:!border-primary-400/50 hover:glow-primary-strong"
            class:text-surface-300={theme === 'dark'}
            class:text-surface-600={theme === 'light'}>
      <span class="relative z-10">Ещё раз</span>
      <span class="relative z-10 ml-3 text-[9px] opacity-40 font-normal tracking-normal">(Tab / Esc)</span>
    </button>
  </div>
</div>
{/if}
