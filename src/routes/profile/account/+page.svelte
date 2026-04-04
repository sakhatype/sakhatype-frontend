<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { api } from '$utils/api.js';
  import Footer from '$components/layout/Footer.svelte';

  $: theme = $settingsStore.theme;
  $: currentUser = $userStore.user;

  let username = '';
  let email = '';
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let error = '';
  let success = '';
  let loading = false;

  $: xpPercent = currentUser ? (currentUser.xp / currentUser.xp_to_next) * 100 : 0;

  onMount(() => {
    const state = get(userStore);
    if (!state.user) {
      goto('/auth');
      return;
    }
    username = state.user.username;
    email = state.user.email || '';
  });

  async function handleSave() {
    error = '';
    success = '';
    if (!username.trim()) {
      error = 'Имя пользователя не может быть пустым';
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      error = 'Пароли не совпадают';
      return;
    }
    if (newPassword && newPassword.length < 6) {
      error = 'Пароль должен быть минимум 6 символов';
      return;
    }
    loading = true;
    try {
      const updates = {};
      if (username !== currentUser.username) updates.username = username;
      const prevEmail = currentUser.email ?? '';
      const nextEmail = email.trim();
      if (nextEmail !== prevEmail) updates.email = nextEmail || null;
      if (newPassword) {
        updates.current_password = currentPassword;
        updates.new_password = newPassword;
      }
      if (Object.keys(updates).length > 0) {
        const response = await api.updateProfile(updates, $userStore.token);
        userStore.updateUser(response.user);
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        success = 'Профиль успешно обновлен';
        const nextName = response.user.username;
        setTimeout(() => goto(`/profile/${nextName}`), 1500);
      }
    } catch (err) {
      error = err.message || 'Ошибка при обновлении профиля';
    } finally {
      loading = false;
    }
  }

  function handleLogout() {
    userStore.logout();
    goto('/');
  }
</script>

<svelte:head><title>Sakhatype — Управление аккаунтом</title></svelte:head>

<div class="flex-1 flex flex-col">
  {#if currentUser}
    <main class="container mx-auto px-6 md:px-10 flex-1 relative z-20 py-8">
      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div class="s-card p-8 relative overflow-hidden">
            <div
              class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none"
              style="background: rgb(113 113 122);"
            ></div>
            <div class="relative z-10">
              <div
                class="w-24 h-24 rounded-2xl border-2 border-primary-500/30 flex items-center justify-center mb-6 bg-gradient-to-br from-primary-500/15 to-transparent"
              >
                <span class="text-4xl font-heading font-black text-primary-400"
                  >{currentUser.username.charAt(0).toUpperCase()}</span
                >
              </div>
              <h2
                class="text-3xl font-heading font-extrabold tracking-tight uppercase mb-1"
                class:text-surface-50={theme === 'dark'}
                class:text-surface-900={theme === 'light'}
              >
                {currentUser.username}
              </h2>
              <p class="text-primary-400 mono text-xs font-bold tracking-wider mb-4">Ур. {currentUser.level}</p>

              <div class="mt-6 space-y-2">
                <div class="flex justify-between mono text-[9px] text-surface-400 uppercase">
                  <span>XP прогресс</span>
                  <span>{currentUser.xp} / {currentUser.xp_to_next}</span>
                </div>
                <div class="w-full h-2 bg-surface-700/50 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all"
                    style="width: {xpPercent}%; box-shadow: 0 0 12px rgba(113,113,122,0.35);"
                  ></div>
                </div>
              </div>

              <a
                href="/profile/{currentUser.username}"
                class="w-full mt-6 px-6 py-3 s-card !rounded-xl hover:!border-primary-500/40 font-heading font-bold uppercase text-xs tracking-wider text-surface-400 hover:text-surface-100 transition-all flex items-center justify-center gap-2"
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Назад к профилю
              </a>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-8 flex flex-col gap-3">
          <div class="s-card p-8 relative overflow-hidden !rounded-3xl">
            <div class="mb-6">
              <h2
                class="text-2xl font-heading font-extrabold tracking-tight"
                class:text-surface-50={theme === 'dark'}
                class:text-surface-900={theme === 'light'}
              >
                Управление аккаунтом
              </h2>
              <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mt-1">Настройки аккаунта</p>
            </div>

            {#if error}
              <div class="border border-error-500/20 bg-error-500/5 px-6 py-3 rounded-2xl mb-6 text-error-400 text-xs font-bold">
                {error}
              </div>
            {/if}
            {#if success}
              <div
                class="border border-success-500/20 bg-success-500/5 px-6 py-3 rounded-2xl mb-6 text-success-400 text-xs font-bold"
              >
                {success}
              </div>
            {/if}

            <div class="space-y-5 mb-6">
              <div>
                <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2"
                  >Имя пользователя</label
                >
                <input type="text" bind:value={username} class="input-sakha w-full" placeholder="username" />
              </div>
              <div>
                <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2"
                  >Email <span class="text-surface-500 font-normal normal-case tracking-normal">(необязательно)</span
                  ></label
                >
                <input type="email" bind:value={email} class="input-sakha w-full" placeholder="email@example.com" />
              </div>
              <div class="border-t border-surface-600/30 pt-5 mt-6">
                <p class="mono text-[9px] uppercase tracking-widest text-surface-400 mb-4">Изменить пароль</p>
                <div class="space-y-4">
                  <div>
                    <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2"
                      >Текущий пароль</label
                    >
                    <input type="password" bind:value={currentPassword} class="input-sakha w-full" placeholder="••••••" />
                  </div>
                  <div>
                    <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2"
                      >Новый пароль</label
                    >
                    <input type="password" bind:value={newPassword} class="input-sakha w-full" placeholder="••••••" />
                  </div>
                  <div>
                    <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2"
                      >Подтвердите пароль</label
                    >
                    <input type="password" bind:value={confirmPassword} class="input-sakha w-full" placeholder="••••••" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <button
                on:click={handleSave}
                disabled={loading}
                class="w-full bg-primary-500 hover:bg-primary-400 text-white py-4 rounded-2xl font-heading font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50 glow-primary"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
              <button
                on:click={handleLogout}
                class="w-full border border-error-500/20 hover:bg-error-500/10 text-error-400 py-4 rounded-2xl font-heading font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  ><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line
                    x1="21"
                    y1="12"
                    x2="9"
                    y2="12"
                  /></svg
                >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  {/if}
  <Footer />
</div>
