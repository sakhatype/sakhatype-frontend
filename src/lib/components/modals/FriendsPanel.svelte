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
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-up"
       on:click={handleBackdropClick}
       role="dialog"
       aria-modal="true">
    <div class="s-card rounded-3xl p-8 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold  uppercase tracking-tight"
              class:text-surface-50={theme === 'dark'}
              class:text-surface-900={theme === 'light'}>Друзья</h2>
          <p class="text-[9px] mono text-surface-400 uppercase tracking-widest mt-1">Friends</p>
        </div>
        <button on:click={onClose}
                class="w-10 h-10 rounded-xl hover:bg-surface-700/50 flex items-center justify-center transition-all group">
          <svg class="w-5 h-5 text-surface-400 group-hover:text-surface-50 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        <button on:click={() => tab = 'friends'}
                class="flex-1 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest  transition-all
                       {tab === 'friends' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-50'}">
          Друзья ({friends.length})
        </button>
        <button on:click={() => tab = 'requests'}
                class="relative flex-1 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest  transition-all
                       {tab === 'requests' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-50'}">
          Запросы
          {#if incomingCount > 0}
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-[9px] text-surface-50 flex items-center justify-center font-bold">{incomingCount}</span>
          {/if}
        </button>
        <button on:click={() => tab = 'search'}
                class="flex-1 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest  transition-all
                       {tab === 'search' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:text-surface-50'}">
          Поиск
        </button>
      </div>

      {#if loading}
        <div class="py-12 text-center">
          <p class="text-[10px] mono uppercase tracking-[0.5em] text-surface-500 animate-pulse">Loading...</p>
        </div>

      {:else if tab === 'friends'}
        {#if friends.length === 0}
          <div class="py-12 text-center">
            <p class="text-surface-400 text-sm  mb-4">Пока нет друзей</p>
            <button on:click={() => tab = 'search'}
                    class="px-6 py-3 bg-primary-500/10 text-primary-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-primary-500/20">
              Найти друзей
            </button>
          </div>
        {:else}
          <div class="space-y-3">
            {#each friends as friend}
              <div class="s-card p-4 rounded-2xl flex items-center justify-between group">
                <a href="/profile/{friend.username}" class="flex items-center gap-3" on:click={onClose}>
                  <div class="w-10 h-10 rounded-xl border border-surface-600/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-transparent flex-shrink-0">
                    {#if friend.avatar_url}
                      <img src={friend.avatar_url} alt="" class="w-full h-full object-cover" />
                    {:else}
                      <span class="text-lg font-bold "
                            class:text-surface-50={theme === 'dark'}
                            class:text-surface-900={theme === 'light'}>{friend.username.charAt(0).toUpperCase()}</span>
                    {/if}
                  </div>
                  <div>
                    <p class="font-bold  text-sm uppercase tracking-tight"
                       class:text-surface-50={theme === 'dark'}
                       class:text-surface-900={theme === 'light'}>{friend.username}</p>
                    <p class="text-[9px] mono text-primary-400">Ур. {friend.level} • {friend.best_wpm} WPM</p>
                  </div>
                </a>
                <button on:click={() => removeFriend(friend.username)}
                        class="opacity-0 group-hover:opacity-100 px-3 py-2 hover:bg-error-500/10 rounded-xl text-[9px] font-bold uppercase text-surface-400 hover:text-error-500 transition-all">
                  Удалить
                </button>
              </div>
            {/each}
          </div>
        {/if}

      {:else if tab === 'requests'}
        {#if requests.incoming.length > 0}
          <p class="text-[9px] mono text-surface-400 uppercase tracking-widest mb-3">Входящие запросы</p>
          <div class="space-y-3 mb-6">
            {#each requests.incoming as req}
              <div class="s-card p-4 rounded-2xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl border border-surface-600/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-transparent flex-shrink-0">
                    {#if req.avatar_url}
                      <img src={req.avatar_url} alt="" class="w-full h-full object-cover" />
                    {:else}
                      <span class="text-lg font-bold "
                            class:text-surface-50={theme === 'dark'}
                            class:text-surface-900={theme === 'light'}>{req.username.charAt(0).toUpperCase()}</span>
                    {/if}
                  </div>
                  <div>
                    <p class="font-bold  text-sm"
                       class:text-surface-50={theme === 'dark'}
                       class:text-surface-900={theme === 'light'}>{req.username}</p>
                    <p class="text-[9px] mono text-surface-400">Ур. {req.level}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button on:click={() => acceptRequest(req.username)}
                          class="px-4 py-2 bg-primary-500 hover:bg-primary-400 rounded-xl text-[9px] font-bold uppercase text-surface-50 transition-all">
                    Принять
                  </button>
                  <button on:click={() => rejectRequest(req.username)}
                          class="px-3 py-2 hover:bg-error-500/10 rounded-xl text-[9px] font-bold uppercase text-surface-400 hover:text-error-500 transition-all">
                    ✕
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if requests.outgoing.length > 0}
          <p class="text-[9px] mono text-surface-400 uppercase tracking-widest mb-3">Отправленные запросы</p>
          <div class="space-y-3">
            {#each requests.outgoing as req}
              <div class="s-card p-4 rounded-2xl flex items-center justify-between opacity-60">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl border border-surface-600/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-transparent flex-shrink-0">
                    {#if req.avatar_url}
                      <img src={req.avatar_url} alt="" class="w-full h-full object-cover" />
                    {:else}
                      <span class="text-lg font-bold  text-surface-50">{req.username.charAt(0).toUpperCase()}</span>
                    {/if}
                  </div>
                  <p class="font-bold  text-sm text-surface-50">{req.username}</p>
                </div>
                <span class="text-[9px] mono text-surface-400 uppercase ">Ожидание...</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if requests.incoming.length === 0 && requests.outgoing.length === 0}
          <div class="py-12 text-center">
            <p class="text-surface-400 text-sm ">Запросов нет</p>
          </div>
        {/if}

      {:else if tab === 'search'}
        <div class="flex gap-3 mb-6">
          <input
            bind:value={searchQuery}
            on:keydown={handleSearchKeydown}
            class="flex-1 bg-surface-800/30 border border-surface-600/30 rounded-2xl px-5 py-3 text-sm font-bold  outline-none transition-all placeholder-slate-700
                   {theme === 'dark' ? 'text-surface-50 focus:border-primary-500/50' : 'text-surface-900 focus:border-primary-500'}"
            placeholder="Имя пользователя..."
          />
          <button on:click={searchUser}
                  disabled={searchLoading}
                  class="px-6 py-3 bg-primary-500 hover:bg-primary-400 rounded-2xl text-[10px] font-bold uppercase text-surface-50 transition-all disabled:opacity-50">
            {searchLoading ? '...' : 'Найти'}
          </button>
        </div>

        {#if searchError}
          <p class="text-error-400 text-[10px] font-bold  text-center py-4">{searchError}</p>
        {/if}

        {#if searchResult}
          <div class="s-card p-6 rounded-2xl">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 rounded-2xl border border-surface-600/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-transparent flex-shrink-0">
                {#if searchResult.avatar_url}
                  <img src={searchResult.avatar_url} alt="" class="w-full h-full object-cover" />
                {:else}
                  <span class="text-2xl font-bold "
                        class:text-surface-50={theme === 'dark'}
                        class:text-surface-900={theme === 'light'}>{searchResult.username.charAt(0).toUpperCase()}</span>
                {/if}
              </div>
              <div class="flex-1">
                <p class="font-bold  text-xl uppercase tracking-tight"
                   class:text-surface-50={theme === 'dark'}
                   class:text-surface-900={theme === 'light'}>{searchResult.username}</p>
                <p class="text-[9px] mono text-primary-400">Ур. {searchResult.level} • {searchResult.best_wpm} WPM</p>
              </div>
            </div>

            {#if searchResult.friendStatus === 'self'}
              <p class="text-[10px] mono text-surface-400  text-center">Это вы!</p>
            {:else if searchResult.friendStatus === 'friends'}
              <div class="flex gap-3">
                <span class="flex-1 text-center py-3 bg-success-600/10 text-success-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest">Уже друзья ✓</span>
                <button on:click={() => removeFriend(searchResult.username)}
                        class="px-4 py-3 border border-error-500/20 hover:bg-error-500/10 rounded-2xl text-[10px] font-bold uppercase text-error-500 transition-all">
                  Удалить
                </button>
              </div>
            {:else if searchResult.friendStatus === 'request_sent'}
              <p class="text-center py-3 bg-warning-600/10 text-warning-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest">Запрос отправлен</p>
            {:else if searchResult.friendStatus === 'request_received'}
              <button on:click={() => acceptRequest(searchResult.username)}
                      class="w-full py-3 bg-primary-500 hover:bg-primary-400 rounded-2xl text-[10px] font-bold uppercase text-surface-50 transition-all">
                Принять запрос
              </button>
            {:else}
              <button on:click={() => addFriend(searchResult.username)}
                      class="w-full py-3 bg-primary-500 hover:bg-primary-400 rounded-2xl text-[10px] font-bold uppercase text-surface-50 transition-all tracking-widest">
                Добавить в друзья
              </button>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
