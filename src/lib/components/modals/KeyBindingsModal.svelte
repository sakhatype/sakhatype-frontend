<script>
  import { settingsStore } from '$stores/settings.js';

  export let isOpen = false;
  export let onClose = () => {};

  $: settings = $settingsStore;
  $: bindings = settings.customBindings || {};
  $: theme = settings.theme;

  let editingKey = null;
  let editingValue = '';

  const sakhaChars = ['ҥ', 'ҕ', 'ө', 'ү', 'һ'];
  const availableKeys = ['4', '5', '6', '7', '8', '9', '0', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];

  function startEdit(key) { editingKey = key; editingValue = bindings[key] || ''; }
  function saveEdit() {
    if (editingKey && editingValue) {
      settingsStore.update(s => ({ ...s, customBindings: { ...s.customBindings, [editingKey]: editingValue } }));
    }
    editingKey = null; editingValue = '';
  }
  function cancelEdit() { editingKey = null; editingValue = ''; }
  function handleKeyInput(e) { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') cancelEdit(); }
  function selectChar(char) { editingValue = char; }
  function selectKey(key) { if (editingKey) editingValue = key; }
  function resetToDefaults() {
    settingsStore.update(s => ({ ...s, customBindings: { '4': 'ҥ', '5': 'ҕ', '6': 'ө', '7': 'ү', '8': 'һ' } }));
  }
  function handleBackdropClick(e) { if (e.target === e.currentTarget) onClose(); }
  function removeBinding(key) {
    settingsStore.update(s => { const nb = { ...s.customBindings }; delete nb[key]; return { ...s, customBindings: nb }; });
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
       on:click={handleBackdropClick} role="dialog" aria-modal="true">
    <div class="s-card p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto !rounded-3xl">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-heading font-extrabold tracking-tight"
              class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Назначение клавиш</h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mt-1">Keyboard Bindings</p>
        </div>
        <button on:click={onClose}
                class="w-10 h-10 rounded-xl hover:bg-surface-700/50 flex items-center justify-center transition-all group">
          <svg class="w-5 h-5 text-surface-400 group-hover:text-surface-100 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="space-y-3 mb-6">
        {#each Object.entries(bindings) as [key, char]}
          <div class="s-card p-4 !rounded-xl flex items-center justify-between group">
            {#if editingKey === key}
              <div class="flex-1 flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="mono text-[10px] text-surface-400 uppercase">Клавиша:</span>
                  <input type="text" bind:value={editingKey} on:keydown={handleKeyInput}
                    class="input-sakha w-16 !px-3 !py-2 text-center" maxlength="1" autofocus />
                </div>
                <span class="text-surface-500">→</span>
                <div class="flex items-center gap-2">
                  <span class="mono text-[10px] text-surface-400 uppercase">Символ:</span>
                  <input type="text" bind:value={editingValue} on:keydown={handleKeyInput}
                    class="input-sakha w-16 !px-3 !py-2 text-lg text-center" maxlength="1" />
                </div>
              </div>
              <div class="flex gap-2">
                <button on:click={saveEdit} class="px-4 py-2 bg-primary-500 hover:bg-primary-400 rounded-xl mono text-[9px] font-bold uppercase text-white transition-all">Сохранить</button>
                <button on:click={cancelEdit} class="px-4 py-2 hover:bg-surface-700/50 rounded-xl mono text-[9px] font-bold uppercase text-surface-400 transition-all">Отмена</button>
              </div>
            {:else}
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-surface-700/50 border border-surface-600/50 flex items-center justify-center">
                  <span class="text-lg mono font-bold text-surface-300">{key}</span>
                </div>
                <svg class="w-5 h-5 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <div class="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <span class="text-2xl font-bold text-primary-400">{char}</span>
                </div>
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button on:click={() => startEdit(key)} class="px-4 py-2 hover:bg-surface-700/50 rounded-xl mono text-[9px] font-bold uppercase text-surface-400 hover:text-surface-100 transition-all">Изменить</button>
                <button on:click={() => removeBinding(key)} class="px-4 py-2 hover:bg-error-500/10 rounded-xl mono text-[9px] font-bold uppercase text-surface-400 hover:text-error-400 transition-all">Удалить</button>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      {#if editingKey}
        <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-surface-800/30 rounded-2xl border border-surface-600/30">
          <div>
            <p class="mono text-[9px] uppercase tracking-widest text-surface-400 mb-3">Якутские символы:</p>
            <div class="flex flex-wrap gap-2">
              {#each sakhaChars as char}
                <button on:click={() => selectChar(char)}
                  class="w-12 h-12 rounded-xl bg-surface-700/50 hover:bg-primary-500/15 border border-surface-600/50 hover:border-primary-500/40 flex items-center justify-center text-xl font-bold transition-all"
                  class:text-surface-100={theme === 'dark'}>{char}</button>
              {/each}
            </div>
          </div>
          <div>
            <p class="mono text-[9px] uppercase tracking-widest text-surface-400 mb-3">Доступные клавиши:</p>
            <div class="flex flex-wrap gap-2">
              {#each availableKeys as key}
                <button on:click={() => selectKey(key)}
                  class="w-10 h-10 rounded-lg bg-surface-700/50 hover:bg-primary-500/15 border border-surface-600/50 hover:border-primary-500/40 flex items-center justify-center text-sm mono font-bold text-surface-300 hover:text-surface-100 transition-all">{key}</button>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <div class="flex justify-between items-center pt-4 border-t border-surface-600/30">
        <button on:click={resetToDefaults}
          class="px-6 py-3 hover:bg-surface-700/50 rounded-xl mono text-[10px] font-bold uppercase text-surface-400 hover:text-surface-100 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          Сбросить
        </button>
        <button on:click={onClose} class="px-8 py-3 bg-primary-500 hover:bg-primary-400 rounded-xl mono text-[10px] font-bold uppercase text-white transition-all">Готово</button>
      </div>
    </div>
  </div>
{/if}
