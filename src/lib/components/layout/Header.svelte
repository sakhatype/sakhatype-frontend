<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { typingStore } from '$stores/typing.js';
  import { uiStore } from '$stores/ui.js';
  import { page } from '$app/stores';
  import { Palette } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { mediaUrl } from '$utils/mediaUrl.js';
  import { onMount, onDestroy, tick } from 'svelte';

  $: currentPath = $page.url.pathname;
  $: user = $userStore.user;
  $: theme = $settingsStore.theme;
  $: profileXpToast = $uiStore.profileXpToast;

  /** @type {HTMLDivElement | undefined} */
  let contextMenuEl;

  let contextMenuOpen = false;
  let menuX = 0;
  let menuY = 0;
  let desktopPanelEl;
  let mobilePanelEl;
  let profileToastX = 0;
  let profileToastY = 0;
  let profileToastReady = false;
  const PROFILE_TOAST_OPTICAL_OFFSET_X = 0;
  $: effectiveProfileXpToast = user ? profileXpToast : null;

  const MENU_MIN_W = 200;
  const MENU_MIN_H = 48;
  /** отступ контекстного меню от краёв окна */
  const VIEW_MARGIN = 20;

  function updateProfileToastPosition() {
    if (!browser || !effectiveProfileXpToast) {
      profileToastReady = false;
      return;
    }
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const anchor = isDesktop ? desktopPanelEl : mobilePanelEl;
    if (!anchor) {
      profileToastReady = false;
      return;
    }
    const rect = anchor.getBoundingClientRect();
    profileToastX = rect.left + rect.width / 2 + PROFILE_TOAST_OPTICAL_OFFSET_X;
    profileToastY = rect.bottom + 8;
    profileToastReady = true;
  }

  async function refreshProfileToastPosition() {
    await tick();
    updateProfileToastPosition();
  }

  function handleLogoClick(e) {
    if (currentPath === '/' && $typingStore.status === 'finished') {
      e.preventDefault();
      typingStore.reset();
    }
  }

  /** @param {MouseEvent} e */
  function handleLogoContextMenu(e) {
    e.preventDefault();
    if (!browser) return;
    menuX = Math.min(e.clientX, window.innerWidth - MENU_MIN_W - VIEW_MARGIN);
    menuY = Math.min(e.clientY, window.innerHeight - MENU_MIN_H - VIEW_MARGIN);
    menuX = Math.max(VIEW_MARGIN, menuX);
    menuY = Math.max(VIEW_MARGIN, menuY);
    contextMenuOpen = true;
  }

  function closeContextMenu() {
    contextMenuOpen = false;
  }

  /** @param {PointerEvent} e */
  function handleGlobalPointerDown(e) {
    if (!contextMenuOpen) return;
    const t = e.target;
    if (t instanceof Node && contextMenuEl?.contains(t)) return;
    closeContextMenu();
  }

  /** @param {KeyboardEvent} e */
  function handleGlobalKeydown(e) {
    if (contextMenuOpen && e.key === 'Escape') closeContextMenu();
  }

  $: if (effectiveProfileXpToast) {
    void refreshProfileToastPosition();
  }

  onMount(() => {
    if (!browser) return;
    void refreshProfileToastPosition();
    window.addEventListener('resize', refreshProfileToastPosition);
    window.addEventListener('scroll', updateProfileToastPosition, true);
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('resize', refreshProfileToastPosition);
    window.removeEventListener('scroll', updateProfileToastPosition, true);
  });
</script>

<svelte:window on:pointerdown={handleGlobalPointerDown} on:keydown={handleGlobalKeydown} />

<header class="container mx-auto px-6 md:px-10 py-6 flex justify-between items-center relative z-20">
  <!-- Logo -->
  <a
    href="/"
    on:click={handleLogoClick}
    on:contextmenu={handleLogoContextMenu}
    class="flex items-center gap-1.5 group cursor-pointer"
  >
    <img
      src={theme === 'dark' ? '/logo-b.svg' : '/logo.svg'}
      alt="SAKHATYPE"
      class="h-10 w-auto transition-all duration-300 group-hover:scale-105"
    />
    <div class="flex flex-col">
      <span
        class="font-heading font-extrabold text-lg tracking-tight leading-none transition-all duration-300 group-hover:translate-x-0.5"
        class:text-surface-50={theme === 'dark'}
        class:text-surface-900={theme === 'light'}
      >
        Sakhatype
      </span>
      <span class="mono text-[9px] tracking-[0.25em] text-primary-400/70 transition-all duration-300 group-hover:text-primary-400 group-hover:translate-x-0.5" style="height: 8px;">DOTX TEAM</span>
    </div>
  </a>

  <!-- Navigation -->
  <nav bind:this={desktopPanelEl} class="hidden md:flex items-center gap-1.5 s-card px-2 py-1.5">
    <a href="/leaderboard"
       class="chip-sakha {currentPath === '/leaderboard' ? 'active' : ''}"
       class:text-surface-300={currentPath !== '/leaderboard' && theme === 'dark'}
       class:text-surface-500={currentPath !== '/leaderboard' && theme === 'light'}
       class:hover:text-surface-100={theme === 'dark'}
       class:hover:text-surface-800={theme === 'light'}>
      <span class="flex items-center gap-2">
        Лидерборд
      </span>
    </a>

    <!-- <a href="/arena"
       class="chip-sakha {currentPath === '/arena' ? 'active' : ''}"
       class:text-surface-300={currentPath !== '/arena' && theme === 'dark'}
       class:text-surface-500={currentPath !== '/arena' && theme === 'light'}
       class:hover:text-surface-100={theme === 'dark'}
       class:hover:text-surface-800={theme === 'light'}>
      <span class="flex items-center gap-2">
        Соревнования
      </span>
    </a> -->

    <div class="w-px h-6 bg-surface-600/40 mx-1"></div>

    {#if user}
      <a href="/profile/{user.username}" class="flex items-center gap-3 pl-2 pr-2 group">
        <div class="text-right leading-none">
          <p class="text-xs font-bold"
             class:text-surface-100={theme === 'dark'}
             class:text-surface-800={theme === 'light'}>{user.username}</p>
          <p class="text-primary-400 text-[9px] mono">Ур. {user.level}</p>
        </div>
        <div class="shrink-0">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border transition-all group-hover:border-primary-500/40 overflow-hidden"
               class:bg-surface-700={theme === 'dark'}
               class:border-surface-600={theme === 'dark'}
               class:text-surface-100={theme === 'dark'}
               class:bg-white={theme === 'light'}
               class:border-surface-200={theme === 'light'}
               class:text-surface-800={theme === 'light'}>
            {#if user.avatar_url}
              <img src={mediaUrl(user.avatar_url)} alt="" class="w-full h-full object-cover" />
            {:else}
              {user.username.charAt(0).toUpperCase()}
            {/if}
          </div>
        </div>
      </a>
    {:else}
      <a href="/auth"
         class="chip-sakha bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-all">
        Войти
      </a>
    {/if}
  </nav>

  <!-- Mobile -->
  <div bind:this={mobilePanelEl} class="md:hidden flex items-center gap-2">
    <a href="/leaderboard"
       class="h-9 px-3 rounded-xl border flex items-center gap-1.5 font-heading font-bold uppercase text-[10px] tracking-wider transition-all {currentPath === '/leaderboard' ? 'border-primary-500/50 text-primary-400 bg-primary-500/10' : (theme === 'dark' ? 'bg-surface-700 border-surface-600 text-surface-100' : 'bg-white border-surface-200 text-surface-800')}"
       aria-label="Лидерборд">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
      <span>Топ</span>
    </a>
    {#if user}
      <a href="/profile/{user.username}" class="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs transition-all overflow-hidden"
         class:bg-surface-700={theme === 'dark'}
         class:border-surface-600={theme === 'dark'}
         class:text-surface-100={theme === 'dark'}
         class:bg-white={theme === 'light'}
         class:border-surface-200={theme === 'light'}
         class:text-surface-800={theme === 'light'}>
        {#if user.avatar_url}
          <img src={mediaUrl(user.avatar_url)} alt="" class="w-full h-full object-cover" />
        {:else}
          {user.username.charAt(0).toUpperCase()}
        {/if}
      </a>
    {:else}
      <a href="/auth" class="bg-primary-500 px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-white tracking-wider hover:bg-primary-400 transition-all">Войти</a>
    {/if}
  </div>

  {#if effectiveProfileXpToast && profileToastReady}
    <div
      class="pointer-events-none fixed z-[120] whitespace-nowrap rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] shadow-lg animate-fade-up {theme === 'dark' ? 'border-primary-500/30 bg-surface-800/95 text-primary-300' : 'border-primary-500/20 bg-white/95 text-primary-500'}"
      style="left: {profileToastX}px; top: {profileToastY}px; transform: translateX(-50%);">
      +{effectiveProfileXpToast.amount} XP
    </div>
  {/if}

  {#if contextMenuOpen}
    <div
      bind:this={contextMenuEl}
      class="header-context-menu fixed z-[200] min-w-[200px] rounded-lg border py-2 px-2 shadow-xl shadow-black/25 backdrop-blur-xl backdrop-saturate-150 {theme === 'dark'
        ? 'border-surface-600/50 bg-surface-800/55'
        : 'border-surface-300/70 bg-white/55'}"
      style:left="{menuX}px"
      style:top="{menuY}px"
      role="menu"
      aria-label="Контекстное меню"
    >
      <a
        href="/design"
        class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-inset {theme === 'dark'
          ? 'text-surface-100 hover:bg-surface-600/35'
          : 'text-surface-800 hover:bg-surface-200/80'}"
        role="menuitem"
        on:click={closeContextMenu}
      >
        <Palette size={16} strokeWidth={2.25} class="shrink-0 opacity-80 text-primary-400" />
        Дизайн система
      </a>
    </div>
  {/if}
</header>
