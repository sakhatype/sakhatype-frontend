<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { goto } from '$app/navigation';

  $: theme = $settingsStore.theme;

  let mode = 'login'; let username = ''; let email = ''; let password = ''; let error = ''; let loading = false;
  async function handleSubmit() {
    error = ''; loading = true;
    let r = mode === 'login' ? await userStore.login(username, password) : await userStore.register(username, email, password);
    loading = false;
    if (r.success) goto('/'); else error = r.error;
  }
</script>

<svelte:head><title>SAKHATYPE // AUTH</title></svelte:head>

<div class="flex-1 flex flex-col">
  <div class="flex-1 flex items-center justify-center px-4 sm:px-6">
    <div class="w-full max-w-md animate-fade-up">
      <div class="s-card p-10 relative overflow-hidden">
        <!-- Decorative corner glow -->
        <div class="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-20 pointer-events-none"
             style="background: rgb(113 113 122);"></div>

        <div class="text-center mb-10 relative z-10">
          <div class="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-5">
            <svg class="w-7 h-7 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 class="text-3xl font-heading font-extrabold tracking-tight"
              class:text-surface-50={theme === 'dark'}
              class:text-surface-900={theme === 'light'}>{mode === 'login' ? 'Войти' : 'Регистрация'}</h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mt-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </p>
        </div>

        {#if error}
          <div class="border border-error-500/20 bg-error-500/5 px-6 py-3 rounded-2xl mb-6 text-error-400 text-xs font-bold">{error}</div>
        {/if}

        <div class="space-y-5 relative z-10">
          <div>
            <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Имя пользователя</label>
            <input bind:value={username} class="input-sakha w-full" placeholder="username" />
          </div>
          {#if mode === 'register'}
          <div>
            <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Email</label>
            <input bind:value={email} type="email" class="input-sakha w-full" placeholder="email@example.com" />
          </div>
          {/if}
          <div>
            <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Пароль</label>
            <input bind:value={password} type="password" class="input-sakha w-full" placeholder="••••••" />
          </div>
          <button on:click={handleSubmit} disabled={loading}
                  class="w-full bg-primary-500 text-white py-4 rounded-2xl font-heading font-bold uppercase text-xs tracking-[0.15em] hover:bg-primary-400 transition-all disabled:opacity-50 glow-primary">
            {loading ? 'Подождите...' : (mode === 'login' ? 'Войти' : 'Регистрация')}
          </button>
        </div>
        <div class="text-center mt-8 relative z-10">
          <button on:click={() => { mode = mode === 'login' ? 'register' : 'login'; error = ''; }}
                  class="mono text-[10px] uppercase tracking-widest text-surface-400 transition-colors font-bold hover:text-primary-400">
            {mode === 'login' ? 'Нет аккаунта → Регистрация' : 'Есть аккаунт → Войти'}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
