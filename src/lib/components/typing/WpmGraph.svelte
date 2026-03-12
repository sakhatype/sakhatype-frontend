<script>
  import { settingsStore } from '$stores/settings.js';

  export let wpmHistory = [];
  export let rawWpm = 0;
  export let wpm = 0;

  $: theme = $settingsStore.theme;

  // Calculate graph dimensions and points
  $: maxWpm = Math.max(...wpmHistory.map(h => h.raw), rawWpm, 10);
  $: points = wpmHistory.map((h, i) => {
    const x = (i / Math.max(wpmHistory.length - 1, 1)) * 100;
    const y = 100 - ((h.wpm / maxWpm) * 100);
    return `${x},${y}`;
  }).join(' ');

  $: rawPoints = wpmHistory.map((h, i) => {
    const x = (i / Math.max(wpmHistory.length - 1, 1)) * 100;
    const y = 100 - ((h.raw / maxWpm) * 100);
    return `${x},${y}`;
  }).join(' ');
</script>

{#if wpmHistory.length > 0}
<div class="premium-border p-6 sm:p-8 rounded-[35px] mt-8">
  <div class="flex justify-between items-center mb-6">
    <h3 class="text-[10px] mono font-[800] uppercase tracking-[0.3em]"
        class:text-white={theme === 'dark'}
        class:text-slate-900={theme === 'light'}>WPM График</h3>
    <div class="flex gap-4 text-[9px] mono">
      <div class="flex items-center gap-2">
        <div class="w-3 h-0.5 bg-blue-500"></div>
        <span class="text-slate-500">WPM</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-0.5 bg-slate-600"></div>
        <span class="text-slate-500">Raw</span>
      </div>
    </div>
  </div>

  <div class="relative w-full h-48 sm:h-64">
    <svg viewBox="0 0 100 100" class="w-full h-full" preserveAspectRatio="none">
      <!-- Grid lines -->
      <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" class="text-white/5" stroke-width="0.2"/>
      <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" class="text-white/5" stroke-width="0.2"/>
      <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" class="text-white/5" stroke-width="0.2"/>

      <!-- Raw WPM line (background) -->
      {#if rawPoints}
        <polyline
          points={rawPoints}
          fill="none"
          stroke="currentColor"
          class="text-slate-600"
          stroke-width="0.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      {/if}

      <!-- WPM line (foreground) -->
      {#if points}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          class="text-blue-500"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      {/if}
    </svg>

    <!-- Y-axis labels -->
    <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] mono text-slate-600 -translate-x-12">
      <span>{Math.round(maxWpm)}</span>
      <span>{Math.round(maxWpm * 0.75)}</span>
      <span>{Math.round(maxWpm * 0.5)}</span>
      <span>{Math.round(maxWpm * 0.25)}</span>
      <span>0</span>
    </div>
  </div>

  <!-- Stats below graph -->
  <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
    <div>
      <p class="text-[8px] mono uppercase text-slate-600 mb-1">Avg WPM</p>
      <p class="text-xl font-[800] italic text-blue-500">{wpm}</p>
    </div>
    <div>
      <p class="text-[8px] mono uppercase text-slate-600 mb-1">Raw WPM</p>
      <p class="text-xl font-[800] italic text-slate-500">{rawWpm}</p>
    </div>
    <div>
      <p class="text-[8px] mono uppercase text-slate-600 mb-1">Peak WPM</p>
      <p class="text-xl font-[800] italic"
         class:text-white={theme === 'dark'}
         class:text-slate-900={theme === 'light'}>{Math.max(...wpmHistory.map(h => h.wpm))}</p>
    </div>
  </div>
</div>
{/if}
