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
  <div class="w-full max-w-5xl mx-auto mt-8 animate-fade-in">
    <div class="premium-border p-6 rounded-[30px]">
      <div class="flex items-center gap-3 mb-6">
        <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <h3 class="text-[11px] mono font-[800] uppercase tracking-[0.3em]"
            class:text-white={theme === 'dark'}
            class:text-slate-900={theme === 'light'}>Typing_History</h3>
        <span class="text-[9px] mono text-slate-600">
          {wordCorrectness.filter(Boolean).length}/{typedHistory.length} correct
        </span>
      </div>

      <!-- Word Grid -->
      <div class="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2">
        {#each words.slice(0, typedHistory.length) as word, idx}
          {@const details = getWordDetails(idx)}
          <div class="group relative">
            <div class="px-3 py-2 rounded-lg mono text-sm font-[800] transition-all cursor-pointer
                        {details.status === 'correct' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : ''}
                        {details.status === 'incorrect' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : ''}
                        {details.status === 'untyped' ? 'bg-white/5 border border-white/10 text-slate-600' : ''}">
              {word}
            </div>

            <!-- Tooltip on hover -->
            {#if details.status === 'incorrect'}
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-red-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div class="text-[9px] mono">
                  <div class="text-slate-500 mb-1">Expected:</div>
                  <div class="text-white mb-2">{details.word}</div>
                  <div class="text-slate-500 mb-1">You typed:</div>
                  <div class="text-red-400">{details.typed || '(skipped)'}</div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Stats Summary -->
      <div class="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="flex flex-col">
          <span class="text-[8px] mono uppercase text-slate-600 mb-1">Total Words</span>
          <span class="text-xl font-[800] italic"
                class:text-white={theme === 'dark'}
                class:text-slate-900={theme === 'light'}>{typedHistory.length}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[8px] mono uppercase text-green-500 mb-1">Correct</span>
          <span class="text-xl font-[800] italic text-green-400">{wordCorrectness.filter(Boolean).length}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[8px] mono uppercase text-red-500 mb-1">Incorrect</span>
          <span class="text-xl font-[800] italic text-red-400">{wordCorrectness.filter(c => !c).length}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[8px] mono uppercase text-blue-500 mb-1">Accuracy</span>
          <span class="text-xl font-[800] italic text-blue-400">
            {typedHistory.length > 0 ? Math.round((wordCorrectness.filter(Boolean).length / typedHistory.length) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
