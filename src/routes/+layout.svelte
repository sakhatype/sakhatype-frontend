<script>
  import '../app.css';
  import Header from '$components/layout/Header.svelte';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { typingStore } from '$stores/typing.js';
  import { onMount, onDestroy } from 'svelte';

  $: theme = $settingsStore.theme;
  $: isTyping = $typingStore.status === 'running';

  /** @type {(() => void) | null} */
  let detachViewport = null;

  onMount(() => {
    userStore.refresh();

    // Track visual viewport so we know the on-screen keyboard height on mobile.
    // Exposed as CSS vars `--kb` (keyboard px) and `--vvh` (visible viewport px).
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const root = document.documentElement;
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty('--kb', kb + 'px');
      root.style.setProperty('--vvh', vv.height + 'px');
      root.classList.toggle('kb-open', kb > 80);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    detachViewport = () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--kb');
      root.style.removeProperty('--vvh');
      root.classList.remove('kb-open');
    };
  });

  onDestroy(() => { if (detachViewport) detachViewport(); });
</script>

<div class="min-h-screen flex flex-col transition-colors duration-500 relative"
     class:dark={theme === 'dark'}
     class:light={theme === 'light'}
     class:bg-surface-900={theme === 'dark'}
     class:bg-surface-50={theme === 'light'}>

  <!-- Noise -->
  <div class="noise-overlay"></div>

  <!-- Grid background -->
  <div class="fixed inset-0 grid-bg pointer-events-none z-0"
       class:opacity-100={theme === 'dark'}
       class:opacity-40={theme === 'light'}></div>

  <!-- Ambient glow orbs -->
  <div class="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none z-0 blur-[120px] opacity-[0.07]"
       style="background: radial-gradient(circle, rgb(113 113 122), transparent 70%);"></div>
  <div class="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none z-0 blur-[100px] opacity-[0.05]"
       style="background: radial-gradient(circle, rgb(161 161 170), transparent 70%);"></div>

  <!-- Header (hide during typing) -->
  <div class="transition-all duration-500 relative z-30"
       style="{isTyping ? 'opacity:0;max-height:0;overflow:hidden;pointer-events:none;' : 'opacity:1;max-height:200px;'}">
    <Header />
  </div>

  <!-- Content -->
  <div class="relative z-10 flex-1 flex flex-col">
    <slot />
  </div>
</div>
