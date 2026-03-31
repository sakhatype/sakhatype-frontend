<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$utils/api.js';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import Footer from '$components/layout/Footer.svelte';
  import ProfileEditModal from '$components/modals/ProfileEditModal.svelte';

  $: theme = $settingsStore.theme;

  let profile = null; let loading = true; let showEditModal = false;

  $: username = $page.params.username;
  $: currentUser = $userStore.user;
  $: isOwnProfile = currentUser && currentUser.username === username;

  onMount(() => loadProfile());
  async function loadProfile() { loading = true; try { profile = await api.getProfile(username); } catch { profile = null; } loading = false; }
  $: user = profile?.user;
  $: history = profile?.history || [];
  $: xpPercent = user ? (user.xp / user.xp_to_next) * 100 : 0;

  function formatYakutskTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      const yakutskOffset = 9 * 60;
      const localOffset = date.getTimezoneOffset();
      const totalOffset = yakutskOffset + localOffset;
      const yakutskTime = new Date(date.getTime() + totalOffset * 60 * 1000);
      const day = String(yakutskTime.getDate()).padStart(2, '0');
      const month = String(yakutskTime.getMonth() + 1).padStart(2, '0');
      const year = yakutskTime.getFullYear();
      const hours = String(yakutskTime.getHours()).padStart(2, '0');
      const minutes = String(yakutskTime.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (e) { return 'N/A'; }
  }

  function getModeLabel(mode, modeValue) {
    if (mode === 'time') return `${modeValue}с`;
    if (mode === 'words') return `${modeValue} тыл`;
    return mode;
  }
</script>

<svelte:head><title>{username} // SAKHATYPE</title></svelte:head>

<ProfileEditModal isOpen={showEditModal} onClose={() => showEditModal = false} />

<div class="flex-1 flex flex-col">
{#if loading}
  <div class="flex items-center justify-center flex-1">
    <p class="mono text-xs uppercase tracking-[0.3em] text-surface-400 animate-pulse">Loading_Profile...</p>
  </div>
{:else if !profile}
  <div class="flex items-center justify-center flex-1">
    <div class="text-center">
      <p class="text-2xl font-heading font-extrabold uppercase mb-4"
         class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Киһи табыллыбата</p>
      <a href="/" class="px-10 py-4 bg-primary-500 text-white rounded-2xl font-heading font-bold uppercase text-xs tracking-wider hover:bg-primary-400 transition-all inline-block">Terminal</a>
    </div>
  </div>
{:else}
<main class="container mx-auto px-6 md:px-10 flex-1 relative z-20 py-8">
  <div class="grid grid-cols-12 gap-6">
    <!-- Profile card -->
    <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
      <div class="s-card p-8 relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style="background: rgb(30 130 230);"></div>
        <div class="relative z-10">
          <div class="w-24 h-24 rounded-2xl border-2 border-primary-500/30 flex items-center justify-center mb-6 bg-gradient-to-br from-primary-500/15 to-transparent">
            <span class="text-4xl font-heading font-black text-primary-400">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <h2 class="text-3xl font-heading font-extrabold tracking-tight uppercase mb-1"
              class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>{user.username}</h2>
          <p class="text-primary-400 mono text-xs font-bold tracking-wider uppercase mb-4">Level {user.level}</p>

          <div class="mt-6 space-y-2">
            <div class="flex justify-between mono text-[9px] text-surface-400 uppercase">
              <span>XP Progress</span>
              <span>{user.xp} / {user.xp_to_next}</span>
            </div>
            <div class="w-full h-2 bg-surface-700/50 rounded-full overflow-hidden">
              <div class="h-full bg-primary-500 rounded-full transition-all" style="width: {xpPercent}%; box-shadow: 0 0 12px rgba(30,130,230,0.4);"></div>
            </div>
          </div>

          {#if isOwnProfile}
            <button on:click={() => showEditModal = true}
              class="w-full mt-6 px-6 py-3 s-card !rounded-xl hover:!border-primary-500/40 font-heading font-bold uppercase text-xs tracking-wider text-surface-400 hover:text-surface-100 transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Управление аккаунтом
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Stats + History -->
    <div class="col-span-12 lg:col-span-8 flex flex-col gap-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="s-card p-6">
          <span class="mono text-[9px] font-bold text-primary-400 uppercase tracking-wider mb-3 block">Средний WPM</span>
          <span class="text-4xl font-heading font-extrabold"
                class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>{user.avg_wpm}</span>
        </div>
        <div class="s-card p-6">
          <span class="mono text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-3 block">Тестов</span>
          <span class="text-4xl font-heading font-extrabold"
                class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>{user.total_tests}</span>
        </div>
        <div class="s-card p-6 glow-primary">
          <span class="mono text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-3 block">Лучший WPM</span>
          <span class="text-4xl font-heading font-extrabold text-primary-400">{user.best_wpm}</span>
        </div>
      </div>

      {#if history.length > 0}
        <!-- WPM bar chart -->
        <div class="s-card p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-heading font-bold text-xs uppercase tracking-[0.2em]"
                class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>WPM История</h3>
            <span class="mono text-[9px] text-surface-400 uppercase tracking-wider">{history.length} тестов</span>
          </div>
          <div class="flex items-end gap-[3px] h-32">
            {#each history.slice(0, 50).reverse() as entry}
              {@const maxW = Math.max(...history.map(h => h.wpm), 1)}
              {@const pct = (entry.wpm / maxW) * 100}
              <div class="w-full rounded-t transition-all {pct > 70 ? 'bg-primary-500' : pct > 40 ? 'bg-primary-500/40' : 'bg-primary-500/15'}"
                   style="height: {pct}%" title="{entry.wpm} WPM"></div>
            {/each}
          </div>
        </div>

        <!-- Test history -->
        <div class="s-card p-6">
          <div class="flex justify-between items-center mb-5">
            <h3 class="font-heading font-bold text-xs uppercase tracking-[0.2em]"
                class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>Пройденные тесты</h3>
            <span class="mono text-[9px] text-surface-400 uppercase tracking-wider">Всего: {history.length}</span>
          </div>

          <div class="space-y-2.5 max-h-[600px] overflow-y-auto pr-2">
            {#each history as test, idx}
              <div class="s-card p-4 !rounded-xl group">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <span class="mono text-[9px] text-surface-500">#{history.length - idx}</span>
                    <div class="flex gap-3 mono text-[9px]">
                      <span class="text-success-400">✓ {test.chars_correct}</span>
                      <span class="text-error-400">✗ {test.chars_incorrect || 0}</span>
                      {#if test.chars_extra}<span class="text-warning-400">+ {test.chars_extra}</span>{/if}
                      {#if test.chars_missed}<span class="text-surface-500">− {test.chars_missed}</span>{/if}
                    </div>
                  </div>
                  <span class="badge-sakha bg-primary-500/10 border border-primary-500/20 text-primary-400">
                    {getModeLabel(test.mode, test.mode_value)}
                  </span>
                </div>
                <div class="grid grid-cols-4 gap-4">
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">WPM</span>
                    <span class="text-xl font-heading font-extrabold"
                          class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>{test.wpm}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">Raw</span>
                    <span class="text-lg font-heading font-bold text-surface-300">{test.raw_wpm || test.wpm}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">Accuracy</span>
                    <span class="text-lg font-bold mono text-primary-400">{test.accuracy}%</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">Дата</span>
                    <span class="text-[10px] font-bold mono text-surface-300">{formatYakutskTime(test.timestamp || test.created_at)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>
{/if}
<Footer />
</div>
