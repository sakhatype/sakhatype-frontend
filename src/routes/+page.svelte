<script>
  import ModeSelector from '$components/typing/ModeSelector.svelte';
  import TypingArea from '$components/typing/TypingArea.svelte';
  import ResultDisplay from '$components/typing/ResultDisplay.svelte';
  import Footer from '$components/layout/Footer.svelte';
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';
  import { api } from '$utils/api.js';
  import { getOfflineWords } from '$utils/wordDifficulty.js';

  let testResult = null;
  $: state = $typingStore;

  $: if (state.status === 'idle' && testResult !== null) { testResult = null; }

  function handleTestComplete(data) { testResult = data; }

  async function handleRestart() {
    testResult = null;
    const s = $settingsStore;
    const modeSnap = s.mode;
    const modeValSnap = Number(s.modeValue);
    const diffSnap = s.difficulty;
    const target = modeSnap === 'words' ? Math.max(1, Math.floor(modeValSnap) || 1) : 100;
    const count = modeSnap === 'words' ? Math.max(target, 70) : target;
    try {
      const data = await api.getWords('sakha', count, diffSnap);
      typingStore.init(data.words, modeSnap, modeValSnap, 'sakha');
    } catch {
      typingStore.init(getOfflineWords(diffSnap, count), modeSnap, modeValSnap, 'sakha');
    }
  }
</script>

<svelte:head><title>Sakhatype</title></svelte:head>

<div class="flex-1 flex flex-col">
  <main
    class="flex-1 flex flex-col px-4 sm:px-6 md:px-10 relative z-10 transition-[padding] duration-150 md:!justify-center md:!pt-0"
    class:justify-center={state.status !== 'running'}
    class:justify-start={state.status === 'running'}
    class:pt-3={state.status === 'running'}
    style="padding-bottom: var(--kb, 0px);"
  >
    {#if state.status !== 'finished'}
      {#if state.status !== 'running'}
        <div class="flex justify-center mb-6 sm:mb-10">
          <ModeSelector />
        </div>
      {/if}
      <div class="max-w-[1000px] mx-auto w-full">
        <TypingArea onTestComplete={handleTestComplete} />
      </div>
    {:else}
      <ResultDisplay result={testResult} onRestart={handleRestart} />
    {/if}
  </main>

  <div class="transition-all duration-300" style="{state.status === 'running' ? 'opacity:0;max-height:0;overflow:hidden;pointer-events:none;' : 'opacity:1;max-height:200px;'}">
    <Footer />
  </div>
</div>

<style>
  /* When the on-screen keyboard is open, anchor typing content to the top
     so it stays visible above the keyboard instead of being centered behind it. */
  :global(html.kb-open) main {
    justify-content: flex-start !important;
    padding-top: 0.75rem;
  }
  @media (min-width: 768px) {
    :global(html.kb-open) main {
      justify-content: center !important;
      padding-top: 0;
    }
  }
</style>
