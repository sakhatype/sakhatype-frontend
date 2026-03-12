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

  function startEdit(key) {
    editingKey = key;
    editingValue = bindings[key] || '';
  }

  function saveEdit() {
    if (editingKey && editingValue) {
      settingsStore.update(s => ({
        ...s,
        customBindings: {
          ...s.customBindings,
          [editingKey]: editingValue
        }
      }));
    }
    editingKey = null;
    editingValue = '';
  }

  function cancelEdit() {
    editingKey = null;
    editingValue = '';
  }

  function handleKeyInput(e) {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }

  function selectChar(char) {
    editingValue = char;
  }

  function selectKey(key) {
    if (editingKey) {
      editingValue = key;
    }
  }

  function resetToDefaults() {
    settingsStore.update(s => ({
      ...s,
      customBindings: {
        '4': 'ҥ',
        '5': 'ҕ',
        '6': 'ө',
        '7': 'ү',
        '8': 'һ',
      }
    }));
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function removeBinding(key) {
    settingsStore.update(s => {
      const newBindings = { ...s.customBindings };
      delete newBindings[key];
      return { ...s, customBindings: newBindings };
    });
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
       on:click={handleBackdropClick}
       role="dialog"
       aria-modal="true">
    <div class="glass-ui rounded-[40px] p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-[800] italic text-white uppercase tracking-tighter">Назначение клавиш</h2>
          <p class="text-[9px] mono text-slate-500 uppercase tracking-widest mt-1">Keyboard Bindings</p>
        </div>
        <button on:click={onClose}
                class="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-all group">
          <svg class="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Current Bindings -->
      <div class="space-y-3 mb-6">
        {#each Object.entries(bindings) as [key, char]}
          <div class="premium-border p-4 rounded-2xl flex items-center justify-between group">
            {#if editingKey === key}
              <!-- Edit Mode -->
              <div class="flex-1 flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] mono text-slate-500 uppercase">Клавиша:</span>
                  <input
                    type="text"
                    bind:value={editingKey}
                    on:keydown={handleKeyInput}
                    class="w-16 bg-white/5 border border-blue-500/50 rounded-lg px-3 py-2 text-white text-sm mono font-[800] outline-none"
                    maxlength="1"
                    autofocus
                  />
                </div>
                <span class="text-slate-600">→</span>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] mono text-slate-500 uppercase">Символ:</span>
                  <input
                    type="text"
                    bind:value={editingValue}
                    on:keydown={handleKeyInput}
                    class="w-16 bg-white/5 border border-blue-500/50 rounded-lg px-3 py-2 text-white text-lg font-[800] outline-none text-center"
                    maxlength="1"
                  />
                </div>
              </div>
              <div class="flex gap-2">
                <button on:click={saveEdit}
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-[9px] font-[800] uppercase text-white transition-all">
                  Сохранить
                </button>
                <button on:click={cancelEdit}
                        class="px-4 py-2 hover:bg-white/5 rounded-xl text-[9px] font-[800] uppercase text-slate-500 transition-all">
                  Отмена
                </button>
              </div>
            {:else}
              <!-- View Mode -->
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span class="text-lg mono font-[800] text-slate-400">{key}</span>
                </div>
                <svg class="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
                <div class="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <span class="text-2xl font-[800] text-blue-500">{char}</span>
                </div>
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button on:click={() => startEdit(key)}
                        class="px-4 py-2 hover:bg-white/5 rounded-xl text-[9px] font-[800] uppercase text-slate-500 hover:text-white transition-all">
                  Изменить
                </button>
                <button on:click={() => removeBinding(key)}
                        class="px-4 py-2 hover:bg-red-500/10 rounded-xl text-[9px] font-[800] uppercase text-slate-500 hover:text-red-500 transition-all">
                  Удалить
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Quick Select Panels (shown when editing) -->
      {#if editingKey}
        <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
          <!-- Sakha Characters -->
          <div>
            <p class="text-[9px] mono uppercase tracking-widest text-slate-500 mb-3">Якутские символы:</p>
            <div class="flex flex-wrap gap-2">
              {#each sakhaChars as char}
                <button on:click={() => selectChar(char)}
                        class="w-12 h-12 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 flex items-center justify-center text-xl font-[800] text-white transition-all">
                  {char}
                </button>
              {/each}
            </div>
          </div>

          <!-- Available Keys -->
          <div>
            <p class="text-[9px] mono uppercase tracking-widest text-slate-500 mb-3">Доступные клавиши:</p>
            <div class="flex flex-wrap gap-2">
              {#each availableKeys as key}
                <button on:click={() => selectKey(key)}
                        class="w-10 h-10 rounded-lg bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 flex items-center justify-center text-sm mono font-[800] text-slate-400 hover:text-white transition-all">
                  {key}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex justify-between items-center pt-4 border-t border-white/5">
        <button on:click={resetToDefaults}
                class="px-6 py-3 hover:bg-white/5 rounded-xl text-[10px] font-[800] uppercase text-slate-500 hover:text-white transition-all flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Сбросить по умолчанию
        </button>
        <button on:click={onClose}
                class="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-[800] uppercase text-white transition-all">
          Готово
        </button>
      </div>
    </div>
  </div>
{/if}
