<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { typingStore } from '$stores/typing.js';
  import { page } from '$app/stores';

  $: currentPath = $page.url.pathname;
  $: user = $userStore.user;
  $: theme = $settingsStore.theme;

  let mobileMenuOpen = false;

  function handleLogoClick(e) {
    // If on home page and test is finished, restart instead of navigating
    if (currentPath === '/' && $typingStore.status === 'finished') {
      e.preventDefault();
      typingStore.reset();
    }
  }
</script>

<header class="container mx-auto px-6 md:px-12 py-8 flex justify-between items-center relative z-20">
  <a href="/" on:click={handleLogoClick} class="flex items-center gap-4 group cursor-pointer">
    <img src={theme === 'light' ? '/logo-b.svg' : '/logo.svg'} alt="Logo">
    <!-- <div class="flex flex-col">
      <h1 class="font-[800] italic tracking-tighter text-2xl leading-none uppercase"
          class:text-white={theme === 'dark'}
          class:text-slate-900={theme === 'light'}>SAKHATYPE</h1>
    </div> -->
  </a>

  <nav class="hidden md:flex items-center gap-8 glass-ui px-8 py-3 rounded-2xl">
    <!-- <a href="/"
       class="font-[800] text-[10px] uppercase tracking-widest flex items-center gap-2 italic transition-colors"
       class:text-white={currentPath === '/' && theme === 'dark'}
       class:text-slate-900={currentPath === '/' && theme === 'light'}
       class:hover:text-white={theme === 'dark'}
       class:hover:text-slate-900={theme === 'light'}>
      <svg class="w-4 h-4 {currentPath === '/' ? 'text-blue-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/></svg>
      Суруйуу
    </a> -->
    <a href="/leaderboard"
       class="font-[800] text-[10px] uppercase tracking-widest flex items-center gap-2 italic transition-colors"
       class:text-white={currentPath === '/leaderboard' && theme === 'dark'}
       class:text-slate-900={currentPath === '/leaderboard' && theme === 'light'}
       class:hover:text-white={theme === 'dark'}
       class:hover:text-slate-900={theme === 'light'}>
      <!-- <svg class="w-4 h-4 {currentPath === '/leaderboard' ? 'text-blue-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> -->
      Лидерборд
    </a>
    <a href="/arena"
       class="font-[800] text-[10px] uppercase tracking-widest flex items-center gap-2 italic transition-colors"
       class:text-white={currentPath === '/arena' && theme === 'dark'}
       class:text-slate-900={currentPath === '/arena' && theme === 'light'}
       class:hover:text-white={theme === 'dark'}
       class:hover:text-slate-900={theme === 'light'}>
      <!-- <svg class="w-4 h-4 {currentPath === '/arena' ? 'text-blue-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4m8-4h.01"/></svg> -->
      Совернования
    </a>
    <div class="w-px h-4 bg-white/10"></div>

    {#if user}
      <a href="/profile/{user.username}" class="flex items-center gap-3 group">
        <div class="text-right leading-none">
          <p class="text-[10px] font-[800] uppercase"
             class:text-white={theme === 'dark'}
             class:text-slate-900={theme === 'light'}>{user.username}</p>
          <p class="text-blue-500 text-[8px] mono">LVL {user.level}</p>
        </div>
        <div class="w-9 h-9 rounded-xl border flex items-center justify-center font-[800] italic text-xs {theme === 'dark' ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}">
          {user.username.charAt(0).toUpperCase()}
        </div>
      </a>
    {:else}
      <a href="/auth" class="text-blue-500 font-[800] text-[10px] uppercase tracking-widest italic transition-colors"
         class:hover:text-white={theme === 'dark'}
         class:hover:text-slate-900={theme === 'light'}>Войти</a>
    {/if}
  </nav>

  <!-- Mobile -->
  <div class="md:hidden flex items-center gap-3">
    {#if user}
      <a href="/profile/{user.username}" class="w-9 h-9 rounded-xl border flex items-center justify-center font-[800] text-xs {theme === 'dark' ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}">
        {user.username.charAt(0).toUpperCase()}
      </a>
    {:else}
      <a href="/auth" class="bg-blue-600 px-4 py-2 rounded-xl text-[9px] font-[800] uppercase text-white">Войти</a>
    {/if}
  </div>
</header>
