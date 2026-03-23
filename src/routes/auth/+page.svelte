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
    <div class="w-full max-w-md animate-fade-in">
      <div class="premium-border p-10 rounded-[40px] relative overflow-hidden">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-[800] italic tracking-tighter uppercase"
              class:text-white={theme === 'dark'}
              class:text-slate-900={theme === 'light'}>{mode === 'login' ? 'Войти' : 'Регистрация'}</h2>
        </div>

        {#if error}<div class="border border-red-500/20 bg-red-500/5 px-6 py-3 rounded-2xl mb-6 text-red-400 text-[10px] font-[800] italic">{error}</div>{/if}

        <div class="space-y-5">
          <div>
            <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Имя пользователя</label>
            <input bind:value={username}
                   class="w-full border rounded-2xl px-5 py-3 text-sm font-[800] italic outline-none transition-all placeholder-slate-700 {theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-white focus:border-blue-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'}"
                   placeholder="Имя пользователя" />
          </div>
          {#if mode === 'register'}
          <div>
            <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Email</label>
            <input bind:value={email} type="email"
                   class="w-full border rounded-2xl px-5 py-3 text-sm font-[800] italic outline-none transition-all placeholder-slate-700 {theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-white focus:border-blue-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'}"
                   placeholder="Почта" />
          </div>
          {/if}
          <div>
            <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Пароль</label>
            <input bind:value={password} type="password"
                   class="w-full border rounded-2xl px-5 py-3 text-sm font-[800] italic outline-none transition-all placeholder-slate-700 {theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-white focus:border-blue-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'}"
                   placeholder="Пароль" />
          </div>
          <button on:click={handleSubmit} disabled={loading}
                  class="w-full bg-white text-black py-4 rounded-2xl text-[11px] font-[800] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50">
            {loading ? 'Күүт...' : (mode === 'login' ? 'Войти' : 'Регистрация')}
          </button>
        </div>
        <div class="text-center mt-8">
          <button on:click={() => { mode = mode === 'login' ? 'register' : 'login'; error = ''; }}
                  class="text-[10px] mono uppercase tracking-widest text-slate-500 italic transition-colors font-[800]"
                  class:hover:text-white={theme === 'dark'}
                  class:hover:text-slate-900={theme === 'light'}>
            {mode === 'login' ? 'Нет аккаунта → Регистраиця' : 'Есть аккаунт → Войти'}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
