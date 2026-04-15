<script>
  /**
   * Мягкое предложение регистрации для анонимных пользователей.
   * Показывается после второго (и далее) завершённого теста.
   * Решение о показе принимает родитель — здесь только UI + события.
   */
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { settingsStore } from '$stores/settings.js';

  /** @type {boolean} */
  export let open = false;

  $: theme = $settingsStore.theme;

  const dispatch = createEventDispatcher();

  function close() { dispatch('close'); }
  function register() { dispatch('register'); }
  function login() { dispatch('login'); }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  }

  let prevOverflow = '';
  $: if (typeof document !== 'undefined') {
    if (open) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (prevOverflow !== undefined) {
      document.body.style.overflow = prevOverflow || '';
    }
  }

  onMount(() => { window.addEventListener('keydown', onKey); });
  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 srm-fade-in"
    role="dialog"
    aria-modal="true"
    aria-labelledby="soft-reg-title"
  >
    <button
      type="button"
      aria-label="Закрыть"
      class="absolute inset-0 cursor-default"
      class:bg-black={true}
      style="opacity:.55; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);"
      on:click={close}
    ></button>

    <!-- Card -->
    <div
      class="relative w-full sm:max-w-md s-card !rounded-t-2xl sm:!rounded-2xl p-6 sm:p-8 shadow-2xl srm-slide-up"
      class:bg-surface-900={theme === 'dark'}
      class:bg-surface-50={theme === 'light'}
    >
      <!-- Close X -->
      <button
        type="button"
        aria-label="Закрыть"
        class="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-700/40 transition-all"
        on:click={close}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>

      <!-- Icon -->
      <div class="w-12 h-12 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      </div>

      <h2
        id="soft-reg-title"
        class="font-heading font-extrabold text-xl sm:text-2xl uppercase tracking-tight mb-2"
        class:text-surface-50={theme === 'dark'}
        class:text-surface-900={theme === 'light'}
      >
        Сохрани свой прогресс
      </h2>

      <p class="text-sm text-surface-400 leading-relaxed mb-5">
        Создай аккаунт, чтобы отслеживать WPM, попасть в лидерборд и получать XP за каждый тест. Это бесплатно и займёт меньше минуты.
      </p>

      <!-- Bullets -->
      <ul class="flex flex-col gap-2 mb-6">
        {#each [
          'История всех тестов и графики прогресса',
          'Место в общем лидерборде',
          'Уровни, XP и достижения'
        ] as item}
          <li class="flex items-start gap-2.5 text-xs text-surface-300">
            <svg class="w-4 h-4 text-primary-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{item}</span>
          </li>
        {/each}
      </ul>

      <!-- Actions -->
      <div class="flex flex-col gap-2">
        <button
          type="button"
          on:click={register}
          class="w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-heading font-bold uppercase text-xs tracking-wider transition-all glow-primary"
        >
          Создать аккаунт
        </button>
        <button
          type="button"
          on:click={login}
          class="w-full px-6 py-3 s-card !rounded-xl hover:!border-primary-500/40 font-heading font-bold uppercase text-[11px] tracking-wider text-surface-300 hover:text-surface-100 transition-all"
        >
          У меня уже есть аккаунт
        </button>
        <button
          type="button"
          on:click={close}
          class="w-full px-6 py-2.5 mono text-[10px] uppercase tracking-wider text-surface-500 hover:text-surface-300 transition-colors"
        >
          Не сейчас
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes srm-fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes srm-slide {
    from { opacity: 0; transform: translateY(24px) }
    to   { opacity: 1; transform: translateY(0) }
  }
  .srm-fade-in  { animation: srm-fade 180ms ease-out both }
  .srm-slide-up { animation: srm-slide 240ms cubic-bezier(.2,.9,.3,1) both }
</style>
