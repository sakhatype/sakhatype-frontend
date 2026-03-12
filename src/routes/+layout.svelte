<script>
  import '../app.css';
  import Header from '$components/layout/Header.svelte';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { onMount } from 'svelte';

  $: theme = $settingsStore.theme;

  onMount(() => { userStore.refresh(); });
</script>

<div class="min-h-screen text-slate-500 selection:bg-blue-600 selection:text-white flex flex-col transition-colors duration-300"
     class:bg-[#030303]={theme === 'dark'}
     class:bg-slate-50={theme === 'light'}>
  <div class="noise" class:opacity-[0.02]={theme === 'dark'} class:opacity-[0.01]={theme === 'light'}></div>
  <Header />
  <slot />
</div>
