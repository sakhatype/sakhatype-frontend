<script>
  import { settingsStore } from '$stores/settings.js';
  import { Clock, Type } from 'lucide-svelte';
  const timeModes = [15, 30, 60];
  const wordModes = [10, 25, 50];
  $: settings = $settingsStore;
  $: currentModeValues = settings.mode === 'time' ? timeModes : wordModes;
  $: theme = settings.theme;

  function setMode(mode) { settingsStore.update(s => ({ ...s, mode, modeValue: mode === 'time' ? 30 : 25 })); }
  function setModeValue(val) { settingsStore.update(s => ({ ...s, modeValue: val })); }
  function toggleDifficulty() { settingsStore.update(s => ({ ...s, difficulty: s.difficulty === 'normal' ? 'expert' : 'normal' })); }
</script>

<div class="s-card px-2 py-1.5 flex flex-wrap gap-1 items-center justify-center">
  <!-- Mode type -->
  <button class="chip-sakha transition-all {settings.mode === 'time' ? 'active' : ''}"
          class:text-surface-400={settings.mode !== 'time'}
          class:hover:text-surface-100={theme === 'dark' && settings.mode !== 'time'}
          class:hover:text-surface-800={theme === 'light' && settings.mode !== 'time'}
          on:click={() => setMode('time')}>
    <span class="flex items-center gap-1.5">
      <Clock size={14} strokeWidth={2.25} />
      Время
    </span>
  </button>
  <button class="chip-sakha transition-all {settings.mode === 'words' ? 'active' : ''}"
          class:text-surface-400={settings.mode !== 'words'}
          class:hover:text-surface-100={theme === 'dark' && settings.mode !== 'words'}
          class:hover:text-surface-800={theme === 'light' && settings.mode !== 'words'}
          on:click={() => setMode('words')}>
    <span class="flex items-center gap-1.5">
      <Type size={14} strokeWidth={2.25} />
      Слова
    </span>
  </button>

  <div class="w-px h-6 mx-1 {theme === 'dark' ? 'bg-surface-600/40' : 'bg-surface-300'}"></div>

  <!-- Mode values -->
  {#each currentModeValues as val}
    <button class="chip-sakha transition-all {settings.modeValue === val ? 'bg-primary-500/10' : ''}"
            class:text-primary-400={settings.modeValue === val}
            class:text-surface-400={settings.modeValue !== val}
            class:hover:text-surface-100={theme === 'dark' && settings.modeValue !== val}
            class:hover:text-surface-800={theme === 'light' && settings.modeValue !== val}
            on:click={() => setModeValue(val)}>
      {val}
    </button>
  {/each}

  <!-- <div class="w-px h-6 mx-1 {theme === 'dark' ? 'bg-surface-600/40' : 'bg-surface-300'}"></div> -->

  <!-- Difficulty -->
  <button class="chip-sakha transition-all {settings.difficulty === 'expert' ? 'bg-error-500/10' : 'bg-success-500/10'}"
          class:text-error-400={settings.difficulty === 'expert'}
          class:text-success-400={settings.difficulty !== 'expert'}
          on:click={toggleDifficulty}>
    {settings.difficulty === 'expert' ? 'Сложный' : 'Легкий'}
  </button>
</div>
