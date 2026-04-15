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

<!--
  Один ряд на всех ширинах. inline-flex чтобы не растягиваться, flex-nowrap чтобы
  ничего не переносилось. На мобилке скрываем иконки и разделитель + ужимаем
  паддинги/шрифт чипов, чтобы всё уместилось.
-->
<div class="s-card px-1.5 sm:px-2 py-1.5 inline-flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1 max-w-full">

  <button class="chip-sakha ms-chip transition-all whitespace-nowrap {settings.mode === 'time' ? 'active' : ''}"
          class:text-surface-400={settings.mode !== 'time'}
          class:hover:text-surface-100={theme === 'dark' && settings.mode !== 'time'}
          class:hover:text-surface-800={theme === 'light' && settings.mode !== 'time'}
          on:click={() => setMode('time')}>
    <span class="flex items-center gap-1.5">
      <span class="hidden sm:inline-flex"><Clock size={14} strokeWidth={2.25} /></span>
      Время
    </span>
  </button>
  <button class="chip-sakha ms-chip transition-all whitespace-nowrap {settings.mode === 'words' ? 'active' : ''}"
          class:text-surface-400={settings.mode !== 'words'}
          class:hover:text-surface-100={theme === 'dark' && settings.mode !== 'words'}
          class:hover:text-surface-800={theme === 'light' && settings.mode !== 'words'}
          on:click={() => setMode('words')}>
    <span class="flex items-center gap-1.5">
      <span class="hidden sm:inline-flex"><Type size={14} strokeWidth={2.25} /></span>
      Слова
    </span>
  </button>

  <div class="hidden sm:block w-px h-6 mx-1 {theme === 'dark' ? 'bg-surface-600/40' : 'bg-surface-300'}"></div>

  {#each currentModeValues as val}
    <button class="chip-sakha ms-chip transition-all whitespace-nowrap {settings.modeValue === val ? 'bg-primary-500/10' : ''}"
            class:text-primary-400={settings.modeValue === val}
            class:text-surface-400={settings.modeValue !== val}
            class:hover:text-surface-100={theme === 'dark' && settings.modeValue !== val}
            class:hover:text-surface-800={theme === 'light' && settings.modeValue !== val}
            on:click={() => setModeValue(val)}>
      {val}
    </button>
  {/each}

  <button class="chip-sakha ms-chip transition-all whitespace-nowrap {settings.difficulty === 'expert' ? 'bg-error-500/10' : 'bg-success-500/10'}"
          class:text-error-400={settings.difficulty === 'expert'}
          class:text-success-400={settings.difficulty !== 'expert'}
          on:click={toggleDifficulty}>
    {settings.difficulty === 'expert' ? 'Сложный' : 'Лёгкий'}
  </button>
</div>

<style>
  /* На мобилке ужимаем чипы, чтобы один ряд гарантированно влезал.
     Перебиваем дефолтные 10px 13px / text-xs из .chip-sakha. */
  .ms-chip { padding: 7px 8px; font-size: 10px; }
  @media (min-width: 640px) {
    .ms-chip { padding: 10px 13px; font-size: 0.75rem; }
  }
</style>
