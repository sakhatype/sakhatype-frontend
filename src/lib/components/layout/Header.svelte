<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { page } from '$app/stores';

  $: currentPath = $page.url.pathname;
  $: user = $userStore.user;
  $: theme = $settingsStore.theme;

  let mobileMenuOpen = false;
</script>

<header class="container mx-auto px-6 md:px-12 py-8 flex justify-between items-center relative z-20">
  <a href="/" class="flex items-center gap-4 group cursor-pointer">
    <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.2)] group-hover:scale-105 transition-transform">
      <svg width="30" height="30" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.875 6.875H4.125C3.39565 6.875 2.69618 7.16473 2.18046 7.68046C1.66473 8.19618 1.375 8.89565 1.375 9.625V23.375C1.375 24.1043 1.66473 24.8038 2.18046 25.3195C2.69618 25.8353 3.39565 26.125 4.125 26.125H28.875C29.6043 26.125 30.3038 25.8353 30.8195 25.3195C31.3353 24.8038 31.625 24.1043 31.625 23.375V9.625C31.625 8.89565 31.3353 8.19618 30.8195 7.68046C30.3038 7.16473 29.6043 6.875 28.875 6.875ZM17.875 9.625H20.625V12.375H17.875V9.625ZM17.875 15.125H20.625V17.875H17.875V15.125ZM12.375 9.625H15.125V12.375H12.375V9.625ZM12.375 15.125H15.125V17.875H12.375V15.125ZM6.875 9.625H9.625V12.375H6.875V9.625ZM6.875 15.125H9.625V17.875H6.875V15.125ZM23.375 23.375H9.625V20.625H23.375V23.375ZM26.125 17.875H23.375V15.125H26.125V17.875ZM26.125 12.375H23.375V9.625H26.125V12.375Z" fill="white"/>
</svg>

    </div>
    <div class="flex flex-col">
      <h1 class="font-[800] italic tracking-tighter text-2xl leading-none uppercase"
          class:text-white={theme === 'dark'}
          class:text-slate-900={theme === 'light'}>SAKHATYPE</h1>
      <span class="text-[9px] mono text-blue-500 uppercase tracking-[0.4em] mt-1">Тургэн суруйааhын</span>
    </div>
  </a>

  <nav class="hidden md:flex items-center gap-8 glass-ui px-8 py-3 rounded-2xl">
    <a href="/"
       class="font-[800] text-[10px] uppercase tracking-widest flex items-center gap-2 italic transition-colors"
       class:text-white={currentPath === '/' && theme === 'dark'}
       class:text-slate-900={currentPath === '/' && theme === 'light'}
       class:hover:text-white={theme === 'dark'}
       class:hover:text-slate-900={theme === 'light'}>
      <svg class="w-4 h-4 {currentPath === '/' ? 'text-blue-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/></svg>
      Суруйуу
    </a>
    <a href="/leaderboard"
       class="font-[800] text-[10px] uppercase tracking-widest flex items-center gap-2 italic transition-colors"
       class:text-white={currentPath === '/leaderboard' && theme === 'dark'}
       class:text-slate-900={currentPath === '/leaderboard' && theme === 'light'}
       class:hover:text-white={theme === 'dark'}
       class:hover:text-slate-900={theme === 'light'}>
      <svg class="w-4 h-4 {currentPath === '/leaderboard' ? 'text-blue-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      Лидерборд
    </a>
    <a href="/arena"
       class="font-[800] text-[10px] uppercase tracking-widest flex items-center gap-2 italic transition-colors"
       class:text-white={currentPath === '/arena' && theme === 'dark'}
       class:text-slate-900={currentPath === '/arena' && theme === 'light'}
       class:hover:text-white={theme === 'dark'}
       class:hover:text-slate-900={theme === 'light'}>
      <svg class="w-4 h-4 {currentPath === '/arena' ? 'text-blue-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4m8-4h.01"/></svg>
      Күрэх
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
         class:hover:text-slate-900={theme === 'light'}>Киир</a>
    {/if}
  </nav>

  <!-- Mobile -->
  <div class="md:hidden flex items-center gap-3">
    {#if user}
      <a href="/profile/{user.username}" class="w-9 h-9 rounded-xl border flex items-center justify-center font-[800] text-xs {theme === 'dark' ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}">
        {user.username.charAt(0).toUpperCase()}
      </a>
    {:else}
      <a href="/auth" class="bg-blue-600 px-4 py-2 rounded-xl text-[9px] font-[800] uppercase text-white">Киир</a>
    {/if}
  </div>
</header>
