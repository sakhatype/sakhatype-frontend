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

  // Animated counter
  let displayWpm = 0;
  let displayAcc = 0;
  let counterFrame = null;
  let mounted = false;

  function calcConsistency(snapshots) {
    const wpms = snapshots.map(s => s.wpm).filter(w => w > 0);
    if (wpms.length < 2) return null;
    const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
    const sd = Math.sqrt(variance);
    // Consistency = 100% - CV (coefficient of variation)
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
    mounted = true;
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
  <div class="flex flex-col items-center text-center mb-8 result-hero">
    <p class="text-[10px] mono font-[800] uppercase tracking-[0.4em] text-slate-600 mb-3 italic">Скорость печати</p>
    <div class="relative">
      <span class="text-[80px] sm:text-[120px] md:text-[150px] font-[800] italic leading-none tracking-tighter text-blue-500 wpm-number"
            style="filter: drop-shadow(0 0 40px rgba(37,99,235,0.3)) drop-shadow(0 0 80px rgba(37,99,235,0.15));">
        {Math.round(displayWpm)}
      </span>
      <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[11px] font-[800] italic uppercase tracking-[0.5em] text-slate-500">
        WPM
      </span>
    </div>
  </div>

  <!-- ═══ KEY STATS ROW ═══ -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 result-stats-row">
    <!-- Accuracy -->
    <div class="premium-border p-4 sm:p-5 rounded-[24px] text-center stat-card" style="animation-delay: 0.1s">
      <p class="text-[8px] mono uppercase tracking-widest text-slate-600 mb-2">Точность</p>
      <p class="text-2xl sm:text-3xl font-[800] italic tracking-tight"
         class:text-emerald-400={accuracy >= 95}
         class:text-yellow-400={accuracy >= 80 && accuracy < 95}
         class:text-red-400={accuracy < 80}>{displayAcc}%</p>
    </div>

    <!-- Raw WPM -->
    <div class="premium-border p-4 sm:p-5 rounded-[24px] text-center stat-card" style="animation-delay: 0.15s">
      <p class="text-[8px] mono uppercase tracking-widest text-slate-600 mb-2">Raw</p>
      <p class="text-2xl sm:text-3xl font-[800] italic tracking-tight"
         class:text-white={theme === 'dark'}
         class:text-slate-900={theme === 'light'}>{rawWpm}</p>
    </div>

    <!-- Peak -->
    <div class="premium-border p-4 sm:p-5 rounded-[24px] text-center stat-card" style="animation-delay: 0.2s">
      <p class="text-[8px] mono uppercase tracking-widest text-slate-600 mb-2">Пик</p>
      <p class="text-2xl sm:text-3xl font-[800] italic tracking-tight text-blue-400">{peakWpm}</p>
    </div>

    <!-- Consistency -->
    <div class="premium-border p-4 sm:p-5 rounded-[24px] text-center stat-card" style="animation-delay: 0.25s">
      {#if consistency !== null}
        <p class="text-[8px] mono uppercase tracking-widest text-slate-600 mb-2">Стабильность</p>
        <p class="text-2xl sm:text-3xl font-[800] italic tracking-tight"
           class:text-emerald-400={consistency >= 80}
           class:text-yellow-400={consistency >= 50 && consistency < 80}
           class:text-red-400={consistency < 50}>{consistency}%</p>
      {:else}
        <p class="text-[8px] mono uppercase tracking-widest text-slate-600 mb-2">Ошибки</p>
        <p class="text-2xl sm:text-3xl font-[800] italic tracking-tight text-red-400">{totalErrors}</p>
      {/if}
    </div>
  </div>

  <!-- ═══ GRAPH ═══ -->
  <div class="result-graph" style="animation-delay: 0.3s">
    <WpmGraph wpmHistory={state.wpmHistory} {wpm} {rawWpm} />
  </div>

  <!-- ═══ DETAIL STATS ═══ -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 result-detail" style="animation-delay: 0.4s">
    <div class="premium-border p-3 sm:p-4 rounded-[20px] text-center">
      <p class="text-[7px] mono uppercase tracking-widest text-slate-600 mb-1">Верные</p>
      <p class="text-lg font-[800] italic text-emerald-500">{state.charsCorrect}</p>
    </div>
    <div class="premium-border p-3 sm:p-4 rounded-[20px] text-center">
      <p class="text-[7px] mono uppercase tracking-widest text-slate-600 mb-1">Неверные</p>
      <p class="text-lg font-[800] italic text-red-400">{state.charsIncorrect}</p>
    </div>
    <div class="premium-border p-3 sm:p-4 rounded-[20px] text-center">
      <p class="text-[7px] mono uppercase tracking-widest text-slate-600 mb-1">Лишние</p>
      <p class="text-lg font-[800] italic text-yellow-500">{state.charsExtra}</p>
    </div>
    <div class="premium-border p-3 sm:p-4 rounded-[20px] text-center">
      <p class="text-[7px] mono uppercase tracking-widest text-slate-600 mb-1">Пропущенные</p>
      <p class="text-lg font-[800] italic text-slate-400">{state.charsMissed}</p>
    </div>
  </div>

  <!-- ═══ XP / ACHIEVEMENTS ═══ -->
  {#if xpEarned > 0}
    <div class="mt-5 result-xp" style="animation-delay: 0.5s">
      <div class="premium-border p-4 sm:p-5 rounded-[24px] flex flex-wrap items-center justify-center gap-4">
        <span class="text-lg sm:text-xl font-[800] italic text-blue-500">+{xpEarned} XP</span>
        {#if levelUp}
          <span class="text-[10px] font-[800] bg-blue-600 text-white px-4 py-1.5 rounded-xl italic tracking-wider uppercase level-up-badge">LVL {result?.new_level}</span>
        {/if}
        {#each newAchievements as ach}
          <span class="text-[10px] font-[800] text-yellow-400 px-3 py-1.5 rounded-xl italic border border-yellow-500/20 bg-yellow-500/5">
            {ach}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ═══ RESTART ═══ -->
  <div class="flex justify-center mt-8 mb-4 result-restart" style="animation-delay: 0.55s">
    <button on:click={onRestart}
            class="group relative px-10 sm:px-14 py-4 rounded-[20px] font-[800] uppercase text-[11px] tracking-[0.25em] italic transition-all duration-300 overflow-hidden
                   {theme === 'dark'
                     ? 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500/50'
                     : 'bg-slate-900/[0.04] border border-slate-900/[0.08] text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-500/50'}">
      <span class="relative z-10">Ещё раз</span>
      <span class="relative z-10 ml-3 text-[9px] opacity-40 not-italic font-normal tracking-normal">(Tab / Esc)</span>
    </button>
  </div>
</div>
{/if}

<style>
  /* Staggered entrance animations */
  .result-hero {
    animation: resultSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .stat-card {
    animation: resultSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .result-graph {
    animation: resultFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
  }
  .result-detail {
    animation: resultFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
  }
  .result-xp {
    animation: resultSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
  }
  .result-restart {
    animation: resultFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
  }
  .result-stats-row {
    animation: none; /* children animate individually */
  }

  .wpm-number {
    animation: wpmPulse 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .level-up-badge {
    animation: badgeBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
  }

  @keyframes resultSlideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes resultFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes wpmPulse {
    0% { opacity: 0; transform: scale(0.5); }
    60% { transform: scale(1.02); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes badgeBounce {
    from { opacity: 0; transform: scale(0); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
