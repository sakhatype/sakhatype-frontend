<script>
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';

  export let visible = false;

  $: state = $typingStore;
  $: theme = $settingsStore.theme;
  $: words = state.words || [];
  $: typedHistory = state.typedHistory || [];
  $: wordCorrectness = state.wordCorrectness || [];

  function getWordStatus(wordIndex) {
    if (wordIndex >= typedHistory.length) return 'untyped';
    return wordCorrectness[wordIndex] ? 'correct' : 'incorrect';
  }

  function getWordDetails(wordIndex) {
    const word = words[wordIndex];
    const typed = typedHistory[wordIndex]?.join('') || '';
    const status = getWordStatus(wordIndex);
    return { word, typed, status };
  }
</script>

{#if visible && typedHistory.length > 0}
  <div class="w-full max-w-5xl mx-auto mt-8 animate-fade-up">
    <div class="s-card p-6">
      <div class="flex items-center gap-3 mb-6">
        <svg class="w-5 h-5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <h3 class="font-heading font-bold text-xs uppercase tracking-[0.2em]"
            class:text-surface-100={theme === 'dark'}
            class:text-surface-800={theme === 'light'}>Typing History</h3>
        <span class="mono text-[9px] text-surface-400">
          {wordCorrectness.filter(Boolean).length}/{typedHistory.length} correct
        </span>
      </div>

      <div class="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2">
        {#each words.slice(0, typedHistory.length) as word, idx}
          {@const details = getWordDetails(idx)}
          <div class="group relative">
            <div class="px-3 py-2 rounded-xl mono text-sm font-bold transition-all cursor-pointer
                        {details.status === 'correct' ? 'bg-success-500/10 border border-success-500/30 text-success-400' : ''}
                        {details.status === 'incorrect' ? 'bg-error-500/10 border border-error-500/30 text-error-400' : ''}
                        {details.status === 'untyped' ? 'bg-surface-700/30 border border-surface-600/30 text-surface-500' : ''}">
              {word}
            </div>
            {#if details.status === 'incorrect'}
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 s-card !rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 !border-error-500/30">
                <div class="mono text-[9px]">
                  <div class="text-surface-400 mb-1">Expected:</div>
                  <div class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'} class="mb-2">{details.word}</div>
                  <div class="text-surface-400 mb-1">You typed:</div>
                  <div class="text-error-400">{details.typed || '(skipped)'}</div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="mt-6 pt-6 border-t border-surface-600/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="flex flex-col">
          <span class="mono text-[8px] uppercase text-surface-400 mb-1">Total Words</span>
          <span class="text-xl font-heading font-extrabold"
                class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>{typedHistory.length}</span>
        </div>
        <div class="flex flex-col">
          <span class="mono text-[8px] uppercase text-success-400 mb-1">Correct</span>
          <span class="text-xl font-heading font-extrabold text-success-400">{wordCorrectness.filter(Boolean).length}</span>
        </div>
        <div class="flex flex-col">
          <span class="mono text-[8px] uppercase text-error-400 mb-1">Incorrect</span>
          <span class="text-xl font-heading font-extrabold text-error-400">{wordCorrectness.filter(c => !c).length}</span>
        </div>
        <div class="flex flex-col">
          <span class="mono text-[8px] uppercase text-primary-400 mb-1">Accuracy</span>
          <span class="text-xl font-heading font-extrabold text-primary-400">
            {typedHistory.length > 0 ? Math.round((wordCorrectness.filter(Boolean).length / typedHistory.length) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
