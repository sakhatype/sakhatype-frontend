<script>
  import { settingsStore } from '$stores/settings.js';
  const timeModes = [15, 30, 60];
  const wordModes = [10, 25, 50];
  $: settings = $settingsStore;
  $: currentModeValues = settings.mode === 'time' ? timeModes : wordModes;
  $: theme = settings.theme;

  function setMode(mode) { settingsStore.update(s => ({ ...s, mode, modeValue: mode === 'time' ? 30 : 25 })); }
  function setModeValue(val) { settingsStore.update(s => ({ ...s, modeValue: val })); }
  function toggleDifficulty() { settingsStore.update(s => ({ ...s, difficulty: s.difficulty === 'normal' ? 'expert' : 'normal' })); }
</script>

<div class="glass-ui p-1.5 rounded-2xl flex flex-wrap gap-1 items-center justify-center">
  <button class="px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-[800] uppercase italic tracking-widest transition-all {settings.mode === 'time' ? (theme === 'dark' ? 'bg-white/5 text-white' : 'bg-slate-900/5 text-slate-900') : (theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-900')}"
          on:click={() => setMode('time')}>Бириэмэ</button>
  <button class="px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-[800] uppercase italic tracking-widest transition-all {settings.mode === 'words' ? (theme === 'dark' ? 'bg-white/5 text-white' : 'bg-slate-900/5 text-slate-900') : (theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-900')}"
          on:click={() => setMode('words')}>Тыллар</button>

  <div class="w-px h-5 bg-white/10 mx-2"></div>

  {#each currentModeValues as val}
    <button class="px-3 sm:px-5 py-2.5 rounded-xl text-[10px] font-[800] uppercase italic tracking-widest transition-all"
            class:text-blue-500={settings.modeValue === val}
            class:underline={settings.modeValue === val}
            class:decoration-2={settings.modeValue === val}
            class:underline-offset-4={settings.modeValue === val}
            class:hover:text-white={theme === 'dark'}
            class:hover:text-slate-900={theme === 'light'}
            on:click={() => setModeValue(val)}>{val}</button>
  {/each}

  <div class="w-px h-5 bg-white/10 mx-2"></div>

  <button class="px-3 sm:px-5 py-2.5 rounded-xl text-[10px] font-[800] uppercase italic tracking-widest transition-all"
          class:text-red-400={settings.difficulty === 'expert'}
          class:text-blue-500={settings.difficulty !== 'expert'}
          class:underline-offset-4={settings.difficulty !== 'expert'}
          on:click={toggleDifficulty}>
    {settings.difficulty === 'expert' ? 'Ыарахан' : 'Кэпчэки'}
  </button>
</div>
