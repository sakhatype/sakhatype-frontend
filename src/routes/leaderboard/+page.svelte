<script>
  import { onMount } from 'svelte';
  import { api } from '$utils/api.js';
  import { settingsStore } from '$stores/settings.js';
  import Footer from '$components/layout/Footer.svelte';

  $: theme = $settingsStore.theme;

  let leaderboard = [];
  let loading = true;
  let mode = 'time';
  let modeValue = 30;
  const timeValues = [15, 30, 60];
  const wordValues = [10, 25, 50];
  $: currentValues = mode === 'time' ? timeValues : wordValues;
  onMount(() => load());
  async function load() { loading = true; try { leaderboard = await api.getLeaderboard(mode, modeValue, 50); } catch { leaderboard = []; } loading = false; }
  function selMode(m) { mode = m; modeValue = m === 'time' ? 30 : 25; load(); }
  function selVal(v) { modeValue = v; load(); }
  $: rest = leaderboard;
</script>

<svelte:head><title>SAKHATYPE // HALL OF FAME</title></svelte:head>

<div class="flex-1 flex flex-col">
  <main class="container mx-auto px-4 sm:px-6 md:px-12 flex-1 relative z-10 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Left: Your rank + filters -->
    <div class="lg:col-span-4 flex flex-col gap-8">
      <div class="premium-border p-8 rounded-[35px] relative overflow-hidden bg-blue-600/[0.02]">
        <div class="absolute top-0 right-0 p-6 opacity-10">
          <svg class="w-20 h-20 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
        </div>
        <h3 class="text-[10px] mono font-[800] text-blue-500 uppercase tracking-[0.3em] mb-8">Бодоруһук // Leaderboard</h3>
        <p class="text-xs text-slate-500 italic">Билиҥҥи режим:</p>
        <p class="text-2xl font-[800] italic tracking-tighter uppercase mt-2"
           class:text-white={theme === 'dark'}
           class:text-slate-900={theme === 'light'}>
          {mode === 'time' ? 'Бириэмэ' : 'Тыллар'} {modeValue}{mode === 'time' ? 'с' : ''}
        </p>
      </div>

      <div class="premium-border p-6 rounded-[30px] flex flex-col gap-3">
        <div class="flex gap-2">
          <button class="flex-1 px-4 py-3 rounded-2xl text-[10px] font-[800] uppercase tracking-widest italic text-left transition-all
                         {mode === 'time' ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-white'}"
                  on:click={() => selMode('time')}>Бириэмэ</button>
          <button class="flex-1 px-4 py-3 rounded-2xl text-[10px] font-[800] uppercase tracking-widest italic text-left transition-all
                         {mode === 'words' ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-white'}"
                  on:click={() => selMode('words')}>Тыллар</button>
        </div>
        {#each currentValues as val}
          <button class="px-6 py-4 rounded-2xl text-[10px] font-[800] uppercase tracking-widest italic text-left transition-all flex justify-between items-center
                         {modeValue === val ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-white'}"
                  on:click={() => selVal(val)}>
            {val}{mode === 'time' ? ' сөкүүндэ' : ' тыл'}
            {#if modeValue === val}<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>{/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Right: Table -->
    <div class="lg:col-span-8">
      {#if loading}
        <div class="premium-border p-20 rounded-[40px] text-center">
          <p class="text-[10px] mono uppercase tracking-[0.5em] text-slate-600 animate-pulse">Loading_Data...</p>
        </div>
      {:else if rest.length === 0}
        <div class="premium-border p-20 rounded-[40px] text-center">
          <p class="text-xl font-[800] italic uppercase mb-2"
             class:text-white={theme === 'dark'}
             class:text-slate-900={theme === 'light'}>Ыйынньык суох</p>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest italic">Бастакы рекорду тургус!</p>
          <a href="/" class="inline-block mt-8 px-10 py-4 bg-white text-black rounded-[20px] font-[800] uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all">Суруйуу саҕалаа</a>
        </div>
      {:else}
        <div class="premium-border rounded-[40px] overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 bg-white/[0.01]">
                <th class="px-6 sm:px-10 py-6 text-[10px] mono font-[800] uppercase tracking-widest text-slate-600">Rank</th>
                <th class="px-4 sm:px-6 py-6 text-[10px] mono font-[800] uppercase tracking-widest text-slate-600">User</th>
                <th class="px-4 sm:px-6 py-6 text-[10px] mono font-[800] uppercase tracking-widest text-slate-600 text-right">WPM</th>
                <th class="hidden sm:table-cell px-6 py-6 text-[10px] mono font-[800] uppercase tracking-widest text-slate-600 text-right">Accuracy</th>
                <th class="hidden sm:table-cell px-6 py-6 text-[10px] mono font-[800] uppercase tracking-widest text-slate-600 text-center">Level</th>
              </tr>
            </thead>
            <tbody>
              {#each rest as entry, idx}
                <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                  <td class="px-6 sm:px-10 py-6">
                    <div class="flex items-center gap-3">
                      {#if entry.rank <= 3}
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-[800] italic text-sm {entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : entry.rank === 2 ? 'bg-slate-400/20 text-slate-400' : 'bg-orange-600/20 text-orange-600'}">
                          {entry.rank}
                        </div>
                      {:else}
                        <span class="text-slate-600 mono text-sm font-[800] w-8 text-center">{entry.rank}</span>
                      {/if}
                    </div>
                  </td>
                  <td class="px-4 sm:px-6 py-6">
                    <a href="/profile/{entry.username}" class="font-[800] italic uppercase tracking-tight hover:text-blue-500 transition-colors text-sm sm:text-base"
                       class:text-white={theme === 'dark'}
                       class:text-slate-900={theme === 'light'}>
                      {entry.username}
                    </a>
                  </td>
                  <td class="px-4 sm:px-6 py-6 text-right">
                    <span class="text-2xl sm:text-3xl font-[800] italic text-blue-500">{entry.wpm}</span>
                  </td>
                  <td class="hidden sm:table-cell px-6 py-6 text-right">
                    <span class="text-lg font-[800] mono text-slate-400">{entry.accuracy}%</span>
                  </td>
                  <td class="hidden sm:table-cell px-6 py-6 text-center">
                    <span class="px-3 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20 text-[10px] mono font-[800] text-blue-500">
                      LVL {entry.level}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
    </div>
  </main>

  <Footer />
</div>
