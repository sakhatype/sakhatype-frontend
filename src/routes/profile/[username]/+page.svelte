<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$utils/api.js';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import Footer from '$components/layout/Footer.svelte';
  import ProfileEditModal from '$components/modals/ProfileEditModal.svelte';

  $: theme = $settingsStore.theme;

  let profile = null;
  let loading = true;
  let showEditModal = false;

  $: username = $page.params.username;
  $: currentUser = $userStore.user;
  $: isOwnProfile = currentUser && currentUser.username === username;

  onMount(() => loadProfile());
  async function loadProfile() { loading = true; try { profile = await api.getProfile(username); } catch { profile = null; } loading = false; }
  $: user = profile?.user;
  $: history = profile?.history || [];
  $: xpPercent = user ? (user.xp / user.xp_to_next) * 100 : 0;

  // Format date to Yakutsk timezone (UTC+9)
  function formatYakutskTime(timestamp) {
    if (!timestamp) return 'N/A';

    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';

      // Get time in Yakutsk timezone (UTC+9)
      const yakutskOffset = 9 * 60; // 9 hours in minutes
      const localOffset = date.getTimezoneOffset(); // Local timezone offset in minutes
      const totalOffset = yakutskOffset + localOffset;

      const yakutskTime = new Date(date.getTime() + totalOffset * 60 * 1000);

      const day = String(yakutskTime.getDate()).padStart(2, '0');
      const month = String(yakutskTime.getMonth() + 1).padStart(2, '0');
      const year = yakutskTime.getFullYear();
      const hours = String(yakutskTime.getHours()).padStart(2, '0');
      const minutes = String(yakutskTime.getMinutes()).padStart(2, '0');

      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (e) {
      console.error('Error formatting time:', e, timestamp);
      return 'N/A';
    }
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
    <p class="text-[10px] mono uppercase tracking-[0.5em] text-slate-600 animate-pulse">Loading_Profile...</p>
  </div>
{:else if !profile}
  <div class="flex items-center justify-center flex-1">
    <div class="text-center">
      <p class="text-2xl font-[800] italic text-white uppercase mb-4">Киһи табыллыбата</p>
      <a href="/" class="px-10 py-4 bg-white text-black rounded-[20px] font-[800] uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all inline-block">Terminal</a>
    </div>
  </div>
{:else}
<main class="container mx-auto px-6 md:px-12 flex-1 relative z-20 py-8">
  <div class="grid grid-cols-12 gap-8">
    <!-- Left: Profile card -->
    <div class="col-span-12 lg:col-span-4 flex flex-col gap-8">
      <div class="premium-border p-10 rounded-[40px] relative overflow-hidden bg-white/[0.01]">
        <div class="relative z-10">
          <div class="w-28 h-28 rounded-[32px] border-2 border-blue-500/30 flex items-center justify-center mb-8 bg-gradient-to-br from-blue-600/20 to-transparent">
            <span class="text-5xl font-[800] italic text-white">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <h2 class="text-4xl font-[800] italic text-white tracking-tighter uppercase mb-2">{user.username}</h2>
          <p class="text-blue-500 mono text-xs font-[800] tracking-widest mb-4 uppercase italic">Level {user.level}</p>

          <div class="mt-6 space-y-2">
            <div class="flex justify-between text-[9px] mono text-slate-500 uppercase">
              <span>XP Progress</span>
              <span>{user.xp} / {user.xp_to_next}</span>
            </div>
            <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" style="width: {xpPercent}%"></div>
            </div>
          </div>

          {#if isOwnProfile}
            <button
              on:click={() => showEditModal = true}
              class="w-full mt-6 px-6 py-3 bg-white/[0.02] hover:bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl text-[10px] font-[800] uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Управление аккаунтом
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right: Stats + History -->
    <div class="col-span-12 lg:col-span-8 flex flex-col gap-8">
      <div class="grid grid-cols-3 gap-6">
        <div class="premium-border p-8 rounded-[35px]">
          <span class="text-[9px] mono font-[800] text-blue-500 uppercase tracking-widest mb-4 block">Средний WPM</span>
          <span class="text-5xl font-[800] italic text-white tracking-tighter">{user.avg_wpm}</span>
        </div>
        <div class="premium-border p-8 rounded-[35px]">
          <span class="text-[9px] mono font-[800] text-slate-500 uppercase tracking-widest mb-4 block">Пройденных тестов</span>
          <span class="text-5xl font-[800] italic text-white tracking-tighter">{user.total_tests}</span>
        </div>
        <div class="premium-border p-8 rounded-[35px]">
          <span class="text-[9px] mono font-[800] text-slate-500 uppercase tracking-widest mb-4 block">Лучший WPM</span>
          <span class="text-5xl font-[800] italic text-blue-600 tracking-tighter godzilla-glow">{user.best_wpm}</span>
        </div>
      </div>

      <!-- Achievements -->
      <!-- {#if user.achievements.length > 0}
        <div class="grid grid-cols-2 gap-6">
          {#each user.achievements as ach}
            <div class="premium-border p-8 rounded-[35px] bento-item flex flex-col gap-4 group cursor-pointer">
              <div class="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-500">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h4 class="text-white font-[800] italic uppercase tracking-tighter text-xl leading-none">{ach}</h4>
            </div>
          {/each}
        </div>
      {/if} -->

      <!-- History chart -->
      {#if history.length > 0}
        <div class="premium-border p-8 rounded-[40px]">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-[10px] mono font-[800] text-white uppercase tracking-[0.3em]">WPM История</h3>
            <span class="text-[9px] mono text-slate-600 uppercase tracking-widest italic">{history.length} тестов</span>
          </div>
          <div class="flex items-end gap-[3px] h-32">
            {#each history.slice(0, 50).reverse() as entry}
              {@const maxW = Math.max(...history.map(h => h.wpm), 1)}
              {@const pct = (entry.wpm / maxW) * 100}
              <div class="w-full rounded-t transition-all {pct > 70 ? 'bg-blue-600' : pct > 40 ? 'bg-blue-600/40' : 'bg-blue-600/20'}"
                   style="height: {pct}%" title="{entry.wpm} WPM"></div>
            {/each}
          </div>
        </div>

        <!-- Test History Details -->
        <div class="premium-border p-8 rounded-[40px]">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-[10px] mono font-[800] text-white uppercase tracking-[0.3em]">Пройденные тесты</h3>
            <span class="text-[9px] mono text-slate-600 uppercase tracking-widest italic">Всего: {history.length} тестов пройдено</span>
          </div>

          <div class="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {#each history as test, idx}
              <div class="premium-border p-5 rounded-2xl hover:bg-white/[0.02] transition-all group">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <span class="text-[9px] mono text-slate-600">#{history.length - idx}</span>
                    <!-- <span class="text-[9px] mono text-slate-500">{formatYakutskTime(test.timestamp || test.created_at)}</span> -->
                                       <div class="flex gap-4 text-[9px] mono">
                    <span class="text-green-500">✓ {test.chars_correct}</span>
                    <span class="text-red-500">✗ {test.chars_incorrect || 0}</span>
                    {#if test.chars_extra}
                      <span class="text-yellow-500">+ {test.chars_extra}</span>
                    {/if}
                    {#if test.chars_missed}
                      <span class="text-slate-600">− {test.chars_missed}</span>
                    {/if}
                  </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20 text-[9px] mono font-[800] text-blue-500 uppercase">
                      {getModeLabel(test.mode, test.mode_value)}
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-4 gap-4">
                  <div class="flex flex-col">
                    <span class="text-[8px] mono uppercase text-slate-600 mb-1">WPM</span>
                    <span class="text-2xl font-[800] italic text-white">{test.wpm}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[8px] mono uppercase text-slate-600 mb-1">Raw WPM</span>
                    <span class="text-lg font-[800] italic text-slate-400">{test.raw_wpm || test.wpm}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[8px] mono uppercase text-slate-600 mb-1">Accuracy</span>
                    <span class="text-lg font-[800] mono text-blue-500">{test.accuracy}%</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[8px] mono uppercase text-slate-600 mb-1">Дата и время</span>
                    <span class="text-[10px] font-[800] mono text-slate-400">{formatYakutskTime(test.timestamp || test.created_at)}</span>
                  </div>
                </div>

                {#if test.chars_correct !== undefined}
                  <!-- <div class="mt-3 pt-3 border-t border-white/5 flex gap-4 text-[9px] mono">
                    <span class="text-green-500">✓ {test.chars_correct}</span>
                    <span class="text-red-500">✗ {test.chars_incorrect || 0}</span>
                    {#if test.chars_extra}
                      <span class="text-yellow-500">+ {test.chars_extra}</span>
                    {/if}
                    {#if test.chars_missed}
                      <span class="text-slate-600">− {test.chars_missed}</span>
                    {/if}
                  </div> -->
                {/if}
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
