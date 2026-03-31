<script>
  import '../app.css';
  import Header from '$components/layout/Header.svelte';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { typingStore } from '$stores/typing.js';
  import { onMount } from 'svelte';

  $: theme = $settingsStore.theme;
  $: isTyping = $typingStore.status === 'running';

  onMount(() => { userStore.refresh(); });
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
