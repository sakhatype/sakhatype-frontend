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

<footer class="container mx-auto px-6 md:px-12 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
  <p class="text-[9px] mono opacity-20 uppercase tracking-[0.3em]">dotx team // При поддержке drivee</p>

  <div class="flex items-center gap-3">
    <!-- Theme Toggle -->
    <button
      on:click={toggleTheme}
      class="glass-ui w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all group"
      title={settings.theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
    >
      {#if settings.theme === 'dark'}
        <svg class="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      {:else}
        <svg class="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      {/if}
    </button>

    <!-- Sound Toggle -->
    <button
      on:click={toggleSound}
      class="glass-ui w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all group"
      title={settings.soundEnabled ? 'Выключить звук' : 'Включить звук'}
    >
      {#if settings.soundEnabled}
        <svg class="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07m3.53-10.6a10 10 0 0 1 0 14.14"/>
        </svg>
      {:else}
        <svg class="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      {/if}
    </button>

    <!-- Input Settings -->
    <div class="relative binds-menu-container">
      <button
        on:click|stopPropagation={toggleBinds}
        class="glass-ui w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all group {showBindsMenu ? 'bg-blue-600/10 border-blue-500/30' : ''}"
        title="Настройки ввода"
      >
        <svg class="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors {showBindsMenu ? 'text-blue-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
        </svg>
      </button>

      {#if showBindsMenu}
        <div class="absolute bottom-full right-0 mb-2 w-72 glass-ui rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-fade-in">
          <h3 class="text-[10px] mono font-[800] text-white uppercase tracking-widest mb-4">Якутский ввод</h3>

          <div class="space-y-3 mb-4">
            <!-- Sakha Binds Toggle -->
            <button
              on:click={toggleSakhaBinds}
              class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div class="flex flex-col items-start">
                <span class="text-[10px] font-[800] text-white uppercase tracking-wide">Якутские бинды</span>
                <span class="text-[8px] mono text-slate-500">Включить быстрый ввод</span>
              </div>
              <div class="w-10 h-6 rounded-full transition-all {settings.sakhaBinds ? 'bg-blue-600' : 'bg-white/10'}">
                <div class="w-4 h-4 bg-white rounded-full mt-1 transition-all {settings.sakhaBinds ? 'ml-5' : 'ml-1'}"></div>
              </div>
            </button>

            <!-- Show Hints Toggle -->
            <button
              on:click={toggleShowHints}
              class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div class="flex flex-col items-start">
                <span class="text-[10px] font-[800] text-white uppercase tracking-wide">Подсказки клавиш</span>
                <span class="text-[8px] mono text-slate-500">Показывать номера</span>
              </div>
              <div class="w-10 h-6 rounded-full transition-all {settings.showHints ? 'bg-blue-600' : 'bg-white/10'}">
                <div class="w-4 h-4 bg-white rounded-full mt-1 transition-all {settings.showHints ? 'ml-5' : 'ml-1'}"></div>
              </div>
            </button>
          </div>

          <!-- Key Bindings Display -->
          <div class="border-t border-white/5 pt-4 space-y-2">
            <div class="flex justify-between items-center mb-3">
              <p class="text-[8px] mono uppercase tracking-widest text-slate-600">Назначение клавиш:</p>
              <button on:click={openBindingsModal}
                      class="text-[8px] mono uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                Настроить →
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              {#each Object.entries(settings.customBindings || {}).slice(0, 5) as [key, char]}
                <div class="flex items-center gap-2 bg-white/[0.02] rounded-lg px-3 py-2">
                  <span class="text-[10px] mono font-[800] text-slate-400">{key}</span>
                  <span class="text-slate-600">→</span>
                  <span class="text-[12px] font-[800] text-blue-500">{char}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</footer>
