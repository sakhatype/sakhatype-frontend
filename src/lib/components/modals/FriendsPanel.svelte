<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { api } from '$utils/api.js';
  import { onMount } from 'svelte';

  export let isOpen = false;
  export let onClose = () => {};

  $: theme = $settingsStore.theme;
  $: token = $userStore.token;

  let friends = [];
  let requests = { incoming: [], outgoing: [] };
  let loading = true;
  let searchQuery = '';
  let searchResult = null;
  let searchLoading = false;
  let searchError = '';
  let tab = 'friends'; // 'friends' | 'requests' | 'search'

  $: if (isOpen && token) { loadData(); }

  async function loadData() {
    loading = true;
    try {
      [friends, requests] = await Promise.all([
        api.getFriendsList(token),
        api.getFriendRequests(token),
      ]);
    } catch {
      friends = [];
      requests = { incoming: [], outgoing: [] };
    }
    loading = false;
  }

  async function searchUser() {
    if (!searchQuery.trim()) return;
    searchLoading = true;
    searchError = '';
    searchResult = null;
    try {
      const profile = await api.getProfile(searchQuery.trim());
      if (profile) {
        const status = await api.getFriendshipStatus(searchQuery.trim(), token);
        searchResult = { ...profile.user, friendStatus: status.status };
      }
    } catch {
      searchError = 'Пользователь не найден';
    }
    searchLoading = false;
  }

  async function addFriend(username) {
    try {
      await api.sendFriendRequest(username, token);
      await loadData();
      if (searchResult) searchResult = { ...searchResult, friendStatus: 'request_sent' };
    } catch (err) {
      searchError = err.message;
    }
  }

  async function acceptRequest(username) {
    try {
      await api.acceptFriendRequest(username, token);
      await loadData();
      if (searchResult) searchResult = { ...searchResult, friendStatus: 'friends' };
    } catch {}
  }

  async function rejectRequest(username) {
    try {
      await api.rejectFriendRequest(username, token);
      await loadData();
    } catch {}
  }

  async function removeFriend(username) {
    try {
      await api.removeFriend(username, token);
      await loadData();
      if (searchResult) searchResult = { ...searchResult, friendStatus: 'none' };
    } catch {}
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSearchKeydown(e) {
    if (e.key === 'Enter') searchUser();
  }

  $: incomingCount = requests.incoming?.length || 0;
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
       on:click={handleBackdropClick}
       role="dialog"
       aria-modal="true">
    <div class="glass-ui rounded-[40px] p-8 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-[800] italic uppercase tracking-tighter"
              class:text-white={theme === 'dark'}
              class:text-slate-900={theme === 'light'}>Доҕоттор</h2>
          <p class="text-[9px] mono text-slate-500 uppercase tracking-widest mt-1">Friends</p>
        </div>
        <button on:click={onClose}
                class="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-all group">
          <svg class="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        <button on:click={() => tab = 'friends'}
                class="flex-1 px-4 py-3 rounded-2xl text-[10px] font-[800] uppercase tracking-widest italic transition-all
                       {tab === 'friends' ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-white'}">
          Друзья ({friends.length})
        </button>
        <button on:click={() => tab = 'requests'}
                class="relative flex-1 px-4 py-3 rounded-2xl text-[10px] font-[800] uppercase tracking-widest italic transition-all
                       {tab === 'requests' ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-white'}">
          Запросы
          {#if incomingCount > 0}
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-[9px] text-white flex items-center justify-center font-[800]">{incomingCount}</span>
          {/if}
        </button>
        <button on:click={() => tab = 'search'}
                class="flex-1 px-4 py-3 rounded-2xl text-[10px] font-[800] uppercase tracking-widest italic transition-all
                       {tab === 'search' ? 'bg-blue-600/10 text-blue-500' : 'text-slate-500 hover:text-white'}">
          Поиск
        </button>
      </div>

      {#if loading}
        <div class="py-12 text-center">
          <p class="text-[10px] mono uppercase tracking-[0.5em] text-slate-600 animate-pulse">Loading...</p>
        </div>

      {:else if tab === 'friends'}
        {#if friends.length === 0}
          <div class="py-12 text-center">
            <p class="text-slate-500 text-sm italic mb-4">Доҕоттор суох эрэ</p>
            <button on:click={() => tab = 'search'}
                    class="px-6 py-3 bg-blue-600/10 text-blue-500 rounded-2xl text-[10px] font-[800] uppercase tracking-widest transition-all hover:bg-blue-600/20">
              Доҕор буларга
            </button>
          </div>
        {:else}
          <div class="space-y-3">
            {#each friends as friend}
              <div class="premium-border p-4 rounded-2xl flex items-center justify-between group">
                <a href="/profile/{friend.username}" class="flex items-center gap-3" on:click={onClose}>
                  <div class="w-10 h-10 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-transparent flex-shrink-0">
                    {#if friend.avatar_url}
                      <img src={friend.avatar_url} alt="" class="w-full h-full object-cover" />
                    {:else}
                      <span class="text-lg font-[800] italic"
                            class:text-white={theme === 'dark'}
                            class:text-slate-900={theme === 'light'}>{friend.username.charAt(0).toUpperCase()}</span>
                    {/if}
                  </div>
                  <div>
                    <p class="font-[800] italic text-sm uppercase tracking-tight"
                       class:text-white={theme === 'dark'}
                       class:text-slate-900={theme === 'light'}>{friend.username}</p>
                    <p class="text-[9px] mono text-blue-500">LVL {friend.level} • {friend.best_wpm} WPM</p>
                  </div>
                </a>
                <button on:click={() => removeFriend(friend.username)}
                        class="opacity-0 group-hover:opacity-100 px-3 py-2 hover:bg-red-500/10 rounded-xl text-[9px] font-[800] uppercase text-slate-500 hover:text-red-500 transition-all">
                  Удалить
                </button>
              </div>
            {/each}
          </div>
        {/if}

      {:else if tab === 'requests'}
        {#if requests.incoming.length > 0}
          <p class="text-[9px] mono text-slate-500 uppercase tracking-widest mb-3">Входящие запросы</p>
          <div class="space-y-3 mb-6">
            {#each requests.incoming as req}
              <div class="premium-border p-4 rounded-2xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-transparent flex-shrink-0">
                    {#if req.avatar_url}
                      <img src={req.avatar_url} alt="" class="w-full h-full object-cover" />
                    {:else}
                      <span class="text-lg font-[800] italic"
                            class:text-white={theme === 'dark'}
                            class:text-slate-900={theme === 'light'}>{req.username.charAt(0).toUpperCase()}</span>
                    {/if}
                  </div>
                  <div>
                    <p class="font-[800] italic text-sm"
                       class:text-white={theme === 'dark'}
                       class:text-slate-900={theme === 'light'}>{req.username}</p>
                    <p class="text-[9px] mono text-slate-500">LVL {req.level}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button on:click={() => acceptRequest(req.username)}
                          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-[9px] font-[800] uppercase text-white transition-all">
                    Принять
                  </button>
                  <button on:click={() => rejectRequest(req.username)}
                          class="px-3 py-2 hover:bg-red-500/10 rounded-xl text-[9px] font-[800] uppercase text-slate-500 hover:text-red-500 transition-all">
                    ✕
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if requests.outgoing.length > 0}
          <p class="text-[9px] mono text-slate-500 uppercase tracking-widest mb-3">Отправленные запросы</p>
          <div class="space-y-3">
            {#each requests.outgoing as req}
              <div class="premium-border p-4 rounded-2xl flex items-center justify-between opacity-60">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-transparent flex-shrink-0">
                    {#if req.avatar_url}
                      <img src={req.avatar_url} alt="" class="w-full h-full object-cover" />
                    {:else}
                      <span class="text-lg font-[800] italic text-white">{req.username.charAt(0).toUpperCase()}</span>
                    {/if}
                  </div>
                  <p class="font-[800] italic text-sm text-white">{req.username}</p>
                </div>
                <span class="text-[9px] mono text-slate-500 uppercase italic">Ожидание...</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if requests.incoming.length === 0 && requests.outgoing.length === 0}
          <div class="py-12 text-center">
            <p class="text-slate-500 text-sm italic">Запросов нет</p>
          </div>
        {/if}

      {:else if tab === 'search'}
        <div class="flex gap-3 mb-6">
          <input
            bind:value={searchQuery}
            on:keydown={handleSearchKeydown}
            class="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-sm font-[800] italic outline-none transition-all placeholder-slate-700
                   {theme === 'dark' ? 'text-white focus:border-blue-500/50' : 'text-slate-900 focus:border-blue-500'}"
            placeholder="Имя пользователя..."
          />
          <button on:click={searchUser}
                  disabled={searchLoading}
                  class="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-[800] uppercase text-white transition-all disabled:opacity-50">
            {searchLoading ? '...' : 'Найти'}
          </button>
        </div>

        {#if searchError}
          <p class="text-red-400 text-[10px] font-[800] italic text-center py-4">{searchError}</p>
        {/if}

        {#if searchResult}
          <div class="premium-border p-6 rounded-2xl">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-transparent flex-shrink-0">
                {#if searchResult.avatar_url}
                  <img src={searchResult.avatar_url} alt="" class="w-full h-full object-cover" />
                {:else}
                  <span class="text-2xl font-[800] italic"
                        class:text-white={theme === 'dark'}
                        class:text-slate-900={theme === 'light'}>{searchResult.username.charAt(0).toUpperCase()}</span>
                {/if}
              </div>
              <div class="flex-1">
                <p class="font-[800] italic text-xl uppercase tracking-tighter"
                   class:text-white={theme === 'dark'}
                   class:text-slate-900={theme === 'light'}>{searchResult.username}</p>
                <p class="text-[9px] mono text-blue-500">LVL {searchResult.level} • {searchResult.best_wpm} WPM</p>
              </div>
            </div>

            {#if searchResult.friendStatus === 'self'}
              <p class="text-[10px] mono text-slate-500 italic text-center">Это вы!</p>
            {:else if searchResult.friendStatus === 'friends'}
              <div class="flex gap-3">
                <span class="flex-1 text-center py-3 bg-green-600/10 text-green-500 rounded-2xl text-[10px] font-[800] uppercase tracking-widest">Уже друзья ✓</span>
                <button on:click={() => removeFriend(searchResult.username)}
                        class="px-4 py-3 border border-red-500/20 hover:bg-red-500/10 rounded-2xl text-[10px] font-[800] uppercase text-red-500 transition-all">
                  Удалить
                </button>
              </div>
            {:else if searchResult.friendStatus === 'request_sent'}
              <p class="text-center py-3 bg-yellow-600/10 text-yellow-500 rounded-2xl text-[10px] font-[800] uppercase tracking-widest">Запрос отправлен</p>
            {:else if searchResult.friendStatus === 'request_received'}
              <button on:click={() => acceptRequest(searchResult.username)}
                      class="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-[800] uppercase text-white transition-all">
                Принять запрос
              </button>
            {:else}
              <button on:click={() => addFriend(searchResult.username)}
                      class="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-[800] uppercase text-white transition-all tracking-widest">
                Добавить в друзья
              </button>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
