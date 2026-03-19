<script>
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';
  import TypingHistory from './TypingHistory.svelte';
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

  function handleKey(e) {
    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault();
      onRestart();
    }
  }

  onMount(() => { window.addEventListener('keydown', handleKey); });
  onDestroy(() => { window.removeEventListener('keydown', handleKey); });
</script>

{#if state.status === 'finished'}
<div class="w-full max-w-5xl mx-auto animate-fade-in relative z-10 px-4 sm:px-0">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <!-- WPM -->
    <div class="lg:col-span-4 premium-border p-6 sm:p-8 rounded-[35px]">
      <p class="text-[9px] mono font-[800] text-slate-500 uppercase tracking-widest mb-1 italic">Speed</p>
      <div class="text-6xl sm:text-8xl font-[800] italic leading-none tracking-tighter text-blue-500 godzilla-glow">{wpm}</div>
      <p class="text-sm font-[800] italic uppercase tracking-widest text-slate-400 mt-1">WPM</p>
      <p class="text-[9px] mono text-slate-600 mt-4">Raw: {rawWpm}</p>
    </div>

    <!-- Right stats -->
    <div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-5">
      <div class="col-span-2 sm:col-span-3 premium-border p-4 sm:p-6 rounded-[30px] bento-item">
        <p class="text-[9px] mono text-slate-500 uppercase mb-2">Accuracy</p>
        <p class="text-2xl sm:text-3xl font-[800] italic"
           class:text-white={theme === 'dark'}
           class:text-slate-900={theme === 'light'}>{accuracy}%</p>
      </div>
      <div class="premium-border p-4 sm:p-6 rounded-[30px] bento-item">
        <p class="text-[9px] mono text-slate-500 uppercase mb-2">Correct</p>
        <p class="text-2xl sm:text-3xl font-[800] italic"
           class:text-white={theme === 'dark'}
           class:text-slate-900={theme === 'light'}>{state.charsCorrect}</p>
      </div>
      <div class="premium-border p-4 sm:p-6 rounded-[30px] bento-item col-span-2 sm:col-span-1">
        <p class="text-[9px] mono text-blue-500 uppercase mb-2">Errors</p>
        <p class="text-2xl sm:text-3xl font-[800] italic text-blue-500">{state.charsIncorrect + state.charsExtra}</p>
      </div>

      {#if xpEarned > 0}
        <div class="col-span-2 sm:col-span-3 premium-border p-4 sm:p-5 rounded-[25px] flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 sm:gap-4">
            <span class="text-lg sm:text-xl font-[800] italic text-blue-500">+{xpEarned} XP</span>
            {#if levelUp}
              <span class="text-[10px] font-[800] bg-blue-600 text-white px-3 py-1 rounded-lg italic">LVL {result?.new_level}</span>
            {/if}
            {#each newAchievements as ach}
              <span class="text-[10px] font-[800] text-yellow-400 px-3 py-1 rounded-lg italic border border-yellow-500/20">🏆 {ach}</span>
            {/each}
          </div>
        </div>
      {/if}

      <div class="col-span-2 sm:col-span-3 flex justify-center mt-2">
        <button on:click={onRestart}
                class="w-full sm:w-auto px-8 sm:px-10 py-4 bg-white text-black rounded-[18px] font-[800] uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all">
          Repeat_Test <span class="text-slate-400 ml-2">(Tab / Esc)</span>
        </button>
      </div>
    </div>
  </div>

  <!-- WPM Graph -->
  <WpmGraph wpmHistory={state.wpmHistory} {wpm} {rawWpm} />

  <!-- Typing History -->
  <TypingHistory visible={true} />
</div>
{/if}
