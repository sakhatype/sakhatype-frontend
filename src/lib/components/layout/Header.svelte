<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { typingStore } from '$stores/typing.js';
  import { page } from '$app/stores';

  $: currentPath = $page.url.pathname;
  $: user = $userStore.user;
  $: theme = $settingsStore.theme;

  function handleLogoClick(e) {
    if (currentPath === '/' && $typingStore.status === 'finished') {
      e.preventDefault();
      typingStore.reset();
    }
  }
</script>

<header class="container mx-auto px-6 md:px-10 py-6 flex justify-between items-center relative z-20">
  <!-- Logo -->
  <a href="/" on:click={handleLogoClick} class="flex items-center gap-1.5 group cursor-pointer">
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

    <a href="/arena"
       class="chip-sakha {currentPath === '/arena' ? 'active' : ''}"
       class:text-surface-300={currentPath !== '/arena' && theme === 'dark'}
       class:text-surface-500={currentPath !== '/arena' && theme === 'light'}
       class:hover:text-surface-100={theme === 'dark'}
       class:hover:text-surface-800={theme === 'light'}>
      <span class="flex items-center gap-2">
        Соревнования
      </span>
    </a>

    <div class="w-px h-6 bg-surface-600/40 mx-1"></div>

    {#if user}
      <a href="/profile/{user.username}" class="flex items-center gap-3 pl-2 pr-2 group">
        <div class="text-right leading-none">
          <p class="text-xs font-bold"
             class:text-surface-100={theme === 'dark'}
             class:text-surface-800={theme === 'light'}>{user.username}</p>
          <p class="text-primary-400 text-[9px] mono">Ур. {user.level}</p>
        </div>
        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border transition-all group-hover:border-primary-500/40"
             class:bg-surface-700={theme === 'dark'}
             class:border-surface-600={theme === 'dark'}
             class:text-surface-100={theme === 'dark'}
             class:bg-white={theme === 'light'}
             class:border-surface-200={theme === 'light'}
             class:text-surface-800={theme === 'light'}>
          {user.username.charAt(0).toUpperCase()}
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
      <a href="/profile/{user.username}" class="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs transition-all"
         class:bg-surface-700={theme === 'dark'}
         class:border-surface-600={theme === 'dark'}
         class:text-surface-100={theme === 'dark'}
         class:bg-white={theme === 'light'}
         class:border-surface-200={theme === 'light'}
         class:text-surface-800={theme === 'light'}>
        {user.username.charAt(0).toUpperCase()}
      </a>
    {:else}
      <a href="/auth" class="bg-primary-500 px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-white tracking-wider hover:bg-primary-400 transition-all">Войти</a>
    {/if}
  </div>
</header>
