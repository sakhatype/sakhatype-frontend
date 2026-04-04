<script>
  import { onMount } from 'svelte';
  import { api } from '$utils/api.js';
  import { settingsStore } from '$stores/settings.js';
  import Footer from '$components/layout/Footer.svelte';

  $: theme = $settingsStore.theme;

  /** @type {any[]} */
  let leaderboardEasy = [];
  /** @type {any[]} */
  let leaderboardHard = [];
  let loading = true;
  let mode = 'time';
  let modeValue = 30;
  const timeValues = [15, 30, 60];
  const wordValues = [10, 25, 50];
  $: currentValues = mode === 'time' ? timeValues : wordValues;

  onMount(() => load());

  async function load() {
    loading = true;
    try {
      const [easy, hard] = await Promise.all([
        api.getLeaderboard(mode, modeValue, 50, 'normal'),
        api.getLeaderboard(mode, modeValue, 50, 'expert'),
      ]);
      leaderboardEasy = easy;
      leaderboardHard = hard;
    } catch {
      leaderboardEasy = [];
      leaderboardHard = [];
    }
    loading = false;
  }

  function selMode(m) {
    mode = m;
    modeValue = m === 'time' ? 30 : 25;
    load();
  }

  function selVal(v) {
    modeValue = v;
    load();
  }

  /** @param {string} d */
  function difficultyLabel(d) {
    return d === 'expert' ? 'Сложный' : 'Легкий';
  }

  const leaderboardSkeletonRows = 6;
</script>

<svelte:head><title>Sakhatype — Лидерборд</title></svelte:head>

<div class="flex-1 flex flex-col">
  <main class="container mx-auto px-4 sm:px-6 md:px-10 flex-1 relative z-10 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-y-6 gap-x-3">
      <!-- Left sidebar -->
      <div class="lg:col-span-4 flex flex-col gap-3">
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
          <p class="text-xs text-surface-500 mt-4 leading-relaxed">
            Два отдельных топа: лучший WPM на <span class="text-success-400">легкой</span> и на <span class="text-error-400">сложной</span> сложности для выбранного режима.
          </p>
        </div>

        <div class="s-card p-5 flex flex-col gap-2">
          <div class="flex gap-2">
            <button class="flex-1 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-all
                           {mode === 'time' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-100'}"
                    type="button"
                    on:click={() => selMode('time')}>Время</button>
            <button class="flex-1 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-all
                           {mode === 'words' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-100'}"
                    type="button"
                    on:click={() => selMode('words')}>Слова</button>
          </div>
          {#each currentValues as val}
            <button class="px-6 py-4 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-all flex justify-between items-center
                           {modeValue === val ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-100'}"
                    type="button"
                    on:click={() => selVal(val)}>
              {val}{mode === 'time' ? ' сек' : ' слов'}
              {#if modeValue === val}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Two leaderboards -->
      <div class="lg:col-span-8 flex flex-col gap-6">
        {#if loading}
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {#each [1, 2] as _}
              <div class="s-card overflow-hidden !rounded-2xl">
                <div class="px-6 py-4 border-b border-surface-600/30">
                  <div class="skeleton h-5 w-32 rounded-md"></div>
                </div>
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-surface-600/30">
                      <th class="px-4 sm:px-6 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">#</th>
                      <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">User</th>
                      <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">Сложн.</th>
                      <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">WPM</th>
                      <th class="hidden sm:table-cell px-4 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">Точн.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each Array.from({ length: leaderboardSkeletonRows }) as _, i (i)}
                      <tr class="border-b border-surface-700/30">
                        <td class="px-4 sm:px-6 py-4"><div class="skeleton w-8 h-8 rounded-xl"></div></td>
                        <td class="px-3 py-4">
                          <div class="skeleton h-5 w-[min(10rem,35vw)] rounded-md"></div>
                        </td>
                        <td class="px-3 py-4"><div class="skeleton h-6 w-16 rounded-lg"></div></td>
                        <td class="px-3 py-4 text-right"><div class="skeleton h-8 w-12 ml-auto rounded-lg"></div></td>
                        <td class="hidden sm:table-cell px-4 py-4 text-right"><div class="skeleton h-6 w-10 ml-auto rounded-md"></div></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/each}
          </div>
        {:else if leaderboardEasy.length === 0 && leaderboardHard.length === 0}
          <div class="s-card p-20 text-center">
            <p class="text-xl font-heading font-extrabold uppercase mb-2"
               class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>Лидерборд</p>
            <p class="text-xs text-surface-400 uppercase tracking-wider">Пока нет результатов для этого режима.</p>
            <a href="/" class="inline-block mt-8 px-10 py-4 bg-primary-500 text-white rounded-2xl font-heading font-bold uppercase text-xs tracking-wider hover:bg-primary-400 transition-all glow-primary">Начать печатать</a>
          </div>
        {:else}
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <!-- Легкий -->
            <div class="s-card overflow-hidden flex flex-col min-h-[200px]">
              <div class="px-5 py-4 border-b border-surface-600/30 flex items-center justify-between gap-2">
                <h4 class="font-heading font-extrabold uppercase text-sm tracking-wide text-success-400">Легкий</h4>
                <span class="mono text-[10px] text-surface-500 uppercase">лучший WPM</span>
              </div>
              {#if leaderboardEasy.length === 0}
                <p class="p-8 text-center text-sm text-surface-500">Нет записей на легкой сложности.</p>
              {:else}
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse min-w-[320px]">
                    <thead>
                      <tr class="border-b border-surface-600/30">
                        <th class="px-4 sm:px-5 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">Rank</th>
                        <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">User</th>
                        <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">Сложность</th>
                        <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">WPM</th>
                        <th class="hidden sm:table-cell px-4 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">Точн.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each leaderboardEasy as entry}
                        <tr class="border-b border-surface-700/30 hover:bg-surface-700/20 transition-all">
                          <td class="px-4 sm:px-5 py-4">
                            {#if entry.rank <= 3}
                              <div class="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm
                                   {entry.rank === 1 ? 'bg-warning-500/15 text-warning-400' : entry.rank === 2 ? 'bg-surface-300/15 text-surface-300' : 'bg-tertiary-600/15 text-tertiary-500'}">
                                {entry.rank}
                              </div>
                            {:else}
                              <span class="mono text-sm font-bold text-surface-400 w-8 text-center block">{entry.rank}</span>
                            {/if}
                          </td>
                          <td class="px-3 py-4">
                            <div class="flex flex-wrap items-center gap-2">
                              <a href="/profile/{entry.username}" class="font-heading font-bold uppercase tracking-tight hover:text-primary-400 transition-colors text-sm"
                                 class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>
                                {entry.username}
                              </a>
                              <span class="badge-sakha bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px]">
                                Ур. {String(entry.level ?? 0).padStart(2, '0')}
                              </span>
                            </div>
                          </td>
                          <td class="px-3 py-4">
                            <span class="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-success-500/15 text-success-400 border border-success-500/25">
                              {difficultyLabel(entry.difficulty ?? 'normal')}
                            </span>
                          </td>
                          <td class="px-3 py-4 text-right">
                            <span class="text-xl font-heading font-extrabold text-primary-400">{entry.wpm}</span>
                          </td>
                          <td class="hidden sm:table-cell px-4 py-4 text-right">
                            <span class="text-base font-bold mono text-surface-300">{entry.accuracy}%</span>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>

            <!-- Сложный -->
            <div class="s-card overflow-hidden flex flex-col min-h-[200px]">
              <div class="px-5 py-4 border-b border-surface-600/30 flex items-center justify-between gap-2">
                <h4 class="font-heading font-extrabold uppercase text-sm tracking-wide text-error-400">Сложный</h4>
                <span class="mono text-[10px] text-surface-500 uppercase">лучший WPM</span>
              </div>
              {#if leaderboardHard.length === 0}
                <p class="p-8 text-center text-sm text-surface-500">Нет записей на сложной сложности.</p>
              {:else}
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse min-w-[320px]">
                    <thead>
                      <tr class="border-b border-surface-600/30">
                        <th class="px-4 sm:px-5 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">Rank</th>
                        <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">User</th>
                        <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400">Сложность</th>
                        <th class="px-3 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">WPM</th>
                        <th class="hidden sm:table-cell px-4 py-4 mono text-[10px] font-bold uppercase tracking-wider text-surface-400 text-right">Точн.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each leaderboardHard as entry}
                        <tr class="border-b border-surface-700/30 hover:bg-surface-700/20 transition-all">
                          <td class="px-4 sm:px-5 py-4">
                            {#if entry.rank <= 3}
                              <div class="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm
                                   {entry.rank === 1 ? 'bg-warning-500/15 text-warning-400' : entry.rank === 2 ? 'bg-surface-300/15 text-surface-300' : 'bg-tertiary-600/15 text-tertiary-500'}">
                                {entry.rank}
                              </div>
                            {:else}
                              <span class="mono text-sm font-bold text-surface-400 w-8 text-center block">{entry.rank}</span>
                            {/if}
                          </td>
                          <td class="px-3 py-4">
                            <div class="flex flex-wrap items-center gap-2">
                              <a href="/profile/{entry.username}" class="font-heading font-bold uppercase tracking-tight hover:text-primary-400 transition-colors text-sm"
                                 class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>
                                {entry.username}
                              </a>
                              <span class="badge-sakha bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px]">
                                Ур. {String(entry.level ?? 0).padStart(2, '0')}
                              </span>
                            </div>
                          </td>
                          <td class="px-3 py-4">
                            <span class="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-error-500/15 text-error-400 border border-error-500/25">
                              {difficultyLabel(entry.difficulty ?? 'expert')}
                            </span>
                          </td>
                          <td class="px-3 py-4 text-right">
                            <span class="text-xl font-heading font-extrabold text-primary-400">{entry.wpm}</span>
                          </td>
                          <td class="hidden sm:table-cell px-4 py-4 text-right">
                            <span class="text-base font-bold mono text-surface-300">{entry.accuracy}%</span>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </main>
  <Footer />
</div>
