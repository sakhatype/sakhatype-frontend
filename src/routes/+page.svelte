<script>
  import ModeSelector from '$components/typing/ModeSelector.svelte';
  import TypingArea from '$components/typing/TypingArea.svelte';
  import ResultDisplay from '$components/typing/ResultDisplay.svelte';
  import Footer from '$components/layout/Footer.svelte';
  import { typingStore } from '$stores/typing.js';
  import { settingsStore } from '$stores/settings.js';
  import { api } from '$utils/api.js';

  let testResult = null;
  $: state = $typingStore;

  $: if (state.status === 'idle' && testResult !== null) { testResult = null; }

  function handleTestComplete(data) { testResult = data; }

  async function handleRestart() {
    testResult = null;
    const s = $settingsStore;
    const count = s.mode === 'words' ? s.modeValue : 100;
    try {
      const data = await api.getWords('sakha', count, s.difficulty);
      typingStore.init(data.words, s.mode, s.modeValue, 'sakha');
    } catch {
      typingStore.reset();
    }
  }
</script>

<svelte:head><title>Sakhatype</title></svelte:head>

<div class="flex-1 flex flex-col">
  <main class="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-10 relative z-10">
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
