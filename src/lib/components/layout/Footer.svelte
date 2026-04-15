<script>
  import { settingsStore } from '$stores/settings.js';
  import KeyBindingsModal from '$components/modals/KeyBindingsModal.svelte';

  let showBindsMenu = false;
  let showBindingsModal = false;
  $: settings = $settingsStore;
  $: theme = settings.theme;

  function toggleTheme() {
    settingsStore.update(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
  }

  function toggleSound() {
    settingsStore.update(s => ({ ...s, soundEnabled: !s.soundEnabled }));
  }

  function toggleBinds() {
    showBindsMenu = !showBindsMenu;
  }

  function toggleSakhaBinds() {
    settingsStore.update(s => ({ ...s, sakhaBinds: !s.sakhaBinds }));
  }

  function toggleShowHints() {
    settingsStore.update(s => ({ ...s, showHints: !s.showHints }));
  }

  function openBindingsModal() {
    showBindsMenu = false;
    showBindingsModal = true;
  }

  function handleClickOutside(e) {
    if (showBindsMenu && !e.target.closest('.binds-menu-container')) {
      showBindsMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<KeyBindingsModal isOpen={showBindingsModal} onClose={() => showBindingsModal = false} />

<footer class="container mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
  <p class="mono text-[9px] uppercase tracking-[0.25em]"
     class:text-surface-600={theme === 'dark'}
     class:text-surface-400={theme === 'light'}>
    dotx team // При поддержке drivee
  </p>

  <div class="flex items-center gap-2">
    <!-- Theme Toggle -->
    <button
      on:click={toggleTheme}
      class="s-card w-10 h-10 !rounded-lg flex items-center justify-center group transition-all hover:!border-primary-500/30"
      title={settings.theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
    >
      {#if settings.theme === 'dark'}
        <svg class="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      {:else}
        <svg class="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      {/if}
    </button>

    <!-- Sound Toggle -->
    <button
      on:click={toggleSound}
      class="s-card w-10 h-10 !rounded-lg flex items-center justify-center group transition-all hover:!border-primary-500/30"
      title={settings.soundEnabled ? 'Выключить звук' : 'Включить звук'}
    >
      {#if settings.soundEnabled}
        <svg class="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07m3.53-10.6a10 10 0 0 1 0 14.14"/>
        </svg>
      {:else}
        <svg class="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      {/if}
    </button>

    <!-- Input Settings (desktop only — на мобилке клавиатурные бинды бесполезны) -->
    <div class="relative binds-menu-container hidden sm:block">
      <button
        on:click|stopPropagation={toggleBinds}
        class="s-card w-10 h-10 !rounded-lg flex items-center justify-center group transition-all hover:!border-primary-500/30 {showBindsMenu ? '!border-primary-500/40 !bg-primary-500/5' : ''}"
        title="Настройки ввода"
      >
        <svg class="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors {showBindsMenu ? '!text-primary-400' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
        </svg>
      </button>

      {#if showBindsMenu}
        <div class="absolute bottom-full right-0 mb-2.5 w-72 s-card p-5 shadow-2xl animate-fade-up" style="animation-duration: 0.25s;">
          <h3 class="font-heading font-bold text-xs uppercase tracking-widest mb-4"
              class:text-surface-100={theme === 'dark'}
              class:text-surface-800={theme === 'light'}>Якутский ввод</h3>

          <div class="space-y-2.5 mb-4">
            <button
              on:click={toggleSakhaBinds}
              class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-700/50 transition-all"
            >
              <div class="flex flex-col items-start">
                <span class="text-xs font-bold"
                      class:text-surface-100={theme === 'dark'}
                      class:text-surface-800={theme === 'light'}>Якутские бинды</span>
                <span class="text-[9px] mono text-surface-400">Включить быстрый ввод</span>
              </div>
              <div class="w-10 h-6 rounded-full transition-all {settings.sakhaBinds ? 'bg-primary-500' : 'bg-surface-600'}">
                <div class="w-4 h-4 bg-white rounded-full mt-1 transition-all {settings.sakhaBinds ? 'ml-5' : 'ml-1'}"></div>
              </div>
            </button>

            <button
              on:click={toggleShowHints}
              class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-700/50 transition-all"
            >
              <div class="flex flex-col items-start">
                <span class="text-xs font-bold"
                      class:text-surface-100={theme === 'dark'}
                      class:text-surface-800={theme === 'light'}>Подсказки клавиш</span>
                <span class="text-[9px] mono text-surface-400">Показывать номера</span>
              </div>
              <div class="w-10 h-6 rounded-full transition-all {settings.showHints ? 'bg-primary-500' : 'bg-surface-600'}">
                <div class="w-4 h-4 bg-white rounded-full mt-1 transition-all {settings.showHints ? 'ml-5' : 'ml-1'}"></div>
              </div>
            </button>
          </div>

          <div class="border-t border-surface-600/40 pt-4 space-y-2">
            <div class="flex justify-between items-center mb-3">
              <p class="mono text-[9px] uppercase tracking-widest text-surface-400">Назначение клавиш:</p>
              <button on:click={openBindingsModal}
                      class="mono text-[9px] uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors">
                Настроить →
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              {#each Object.entries(settings.customBindings || {}).slice(0, 5) as [key, char]}
                <div class="flex items-center gap-2 bg-surface-800/40 rounded-lg px-3 py-2">
                  <span class="mono text-[10px] font-bold text-surface-300">{key}</span>
                  <span class="text-surface-500">→</span>
                  <span class="text-sm font-bold text-primary-400">{char}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</footer>
