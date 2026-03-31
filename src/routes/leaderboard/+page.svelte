<script>
  import { onMount } from 'svelte';
  import { api } from '$utils/api.js';
  import { settingsStore } from '$stores/settings.js';
  import Footer from '$components/layout/Footer.svelte';

  $: theme = $settingsStore.theme;

  let leaderboard = []; let loading = true; let mode = 'time'; let modeValue = 30;
  const timeValues = [15, 30, 60]; const wordValues = [10, 25, 50];
  $: currentValues = mode === 'time' ? timeValues : wordValues;
  onMount(() => load());
  async function load() { loading = true; try { leaderboard = await api.getLeaderboard(mode, modeValue, 50); } catch { leaderboard = []; } loading = false; }
  function selMode(m) { mode = m; modeValue = m === 'time' ? 30 : 25; load(); }
  function selVal(v) { modeValue = v; load(); }
</script>

<svelte:head><title>SAKHATYPE // LEADERBOARD</title></svelte:head>

<div class="flex-1 flex flex-col">
  <main class="container mx-auto px-4 sm:px-6 md:px-10 flex-1 relative z-10 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left sidebar -->
      <div class="lg:col-span-4 flex flex-col gap-6">
        <div class="s-card p-8 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-6 opacity-10">
            <svg class="w-20 h-20 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
          </div>
          <h3 class="mono text-[10px] font-bold text-primary-400 uppercase tracking-[0.25em] mb-6">Лидерборд</h3>
          <p class="text-xs text-surface-400">Режим:</p>
          <p class="text-2xl font-heading font-extrabold tracking-tight mt-2"
             class:text-surface-50={theme === 'dark'}
             class:text-surface-900={theme === 'light'}>
            {mode === 'time' ? 'Время' : 'Слова'} {modeValue}{mode === 'time' ? 'с' : ''}
          </p>
        </div>

        <div class="s-card p-5 flex flex-col gap-2">
          <div class="flex gap-2">
            <button class="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all
                           {mode === 'time' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-100'}"
                    on:click={() => selMode('time')}>Время</button>
            <button class="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all
                           {mode === 'words' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-100'}"
                    on:click={() => selMode('words')}>Слова</button>
          </div>
          {#each currentValues as val}
            <button class="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all flex justify-between items-center
                           {modeValue === val ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-100'}"
                    on:click={() => selVal(val)}>
              {val}{mode === 'time' ? ' сек' : ' слов'}
              {#if modeValue === val}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Table -->
      <div class="lg:col-span-8">
        {#if loading}
          <div class="s-card p-20 text-center">
            <p class="mono text-xs uppercase tracking-[0.3em] text-surface-400 animate-pulse">Loading_Data...</p>
          </div>
        {:else if leaderboard.length === 0}
          <div class="s-card p-20 text-center">
            <p class="text-xl font-heading font-extrabold uppercase mb-2"
               class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>Лидерборд</p>
            <p class="text-xs text-surface-400 uppercase tracking-wider">Будьте первыми в лидерборде!</p>
            <a href="/" class="inline-block mt-8 px-10 py-4 bg-primary-500 text-white rounded-2xl font-heading font-bold uppercase text-xs tracking-wider hover:bg-primary-400 transition-all glow-primary">Начать печатать</a>
          </div>
        {:else}
          <div class="s-card overflow-hidden !rounded-2xl">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-surface-600/30">
                  <th class="px-6 sm:px-8 py-5 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">Rank</th>
                  <th class="px-4 sm:px-6 py-5 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">User</th>
                  <th class="px-4 sm:px-6 py-5 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">WPM</th>
                  <th class="hidden sm:table-cell px-6 py-5 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">Accuracy</th>
                  <th class="hidden sm:table-cell px-6 py-5 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-center">Level</th>
                </tr>
              </thead>
              <tbody>
                {#each leaderboard as entry, idx}
                  <tr class="border-b border-surface-700/30 hover:bg-surface-700/20 transition-all">
                    <td class="px-6 sm:px-8 py-5">
                      {#if entry.rank <= 3}
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm
                             {entry.rank === 1 ? 'bg-warning-500/15 text-warning-400' : entry.rank === 2 ? 'bg-surface-300/15 text-surface-300' : 'bg-tertiary-600/15 text-tertiary-500'}">
                          {entry.rank}
                        </div>
                      {:else}
                        <span class="mono text-sm font-bold text-surface-400 w-8 text-center block">{entry.rank}</span>
                      {/if}
                    </td>
                    <td class="px-4 sm:px-6 py-5">
                      <a href="/profile/{entry.username}" class="font-heading font-bold uppercase tracking-tight hover:text-primary-400 transition-colors text-sm sm:text-base"
                         class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>
                        {entry.username}
                      </a>
                    </td>
                    <td class="px-4 sm:px-6 py-5 text-right">
                      <span class="text-2xl sm:text-3xl font-heading font-extrabold text-primary-400">{entry.wpm}</span>
                    </td>
                    <td class="hidden sm:table-cell px-6 py-5 text-right">
                      <span class="text-lg font-bold mono text-surface-300">{entry.accuracy}%</span>
                    </td>
                    <td class="hidden sm:table-cell px-6 py-5 text-center">
                      <span class="badge-sakha bg-primary-500/10 border border-primary-500/20 text-primary-400">
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
