<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { typingStore } from '$stores/typing.js';
  import { page } from '$app/stores';
  import { Palette } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { mediaUrl } from '$utils/mediaUrl.js';

  $: currentPath = $page.url.pathname;
  $: user = $userStore.user;
  $: theme = $settingsStore.theme;

  /** @type {HTMLDivElement | undefined} */
  let contextMenuEl;

  let contextMenuOpen = false;
  let menuX = 0;
  let menuY = 0;

  const MENU_MIN_W = 200;
  const MENU_MIN_H = 48;
  /** отступ контекстного меню от краёв окна */
  const VIEW_MARGIN = 20;

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
  <nav class="hidden md:flex items-center gap-1.5 s-card px-2 py-1.5">
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
        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border transition-all group-hover:border-primary-500/40 overflow-hidden shrink-0"
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
      </a>
    {:else}
      <a href="/auth"
         class="chip-sakha bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-all">
        Войти
      </a>
    {/if}
  </nav>

  <!-- Mobile -->
  <div class="md:hidden flex items-center gap-3">
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
