<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { goto } from '$app/navigation';
  import { api } from '$utils/api.js';

  export let isOpen = false;
  export let onClose = () => {};

  $: currentUser = $userStore.user;
  $: theme = $settingsStore.theme;

  let username = '';
  let email = '';
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let error = '';
  let success = '';
  let loading = false;

  $: if (isOpen && currentUser) {
    username = currentUser.username;
    email = currentUser.email || '';
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    error = '';
    success = '';
  }

  async function handleSave() {
    error = '';
    success = '';

    // Validation
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
      if (email !== currentUser.email) updates.email = email;
      if (newPassword) {
        updates.current_password = currentPassword;
        updates.new_password = newPassword;
      }

      if (Object.keys(updates).length > 0) {
        const response = await api.updateProfile(updates, $userStore.token);
        userStore.updateUser(response.user);
        success = 'Профиль успешно обновлен';

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        onClose();
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

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
       on:click={handleBackdropClick}
       role="dialog"
       aria-modal="true">
    <div class="glass-ui rounded-[40px] p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-[800] italic text-white uppercase tracking-tighter">Управление аккаунтом</h2>
          <p class="text-[9px] mono text-slate-500 uppercase tracking-widest mt-1">Account Settings</p>
        </div>
        <button on:click={onClose}
                class="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-all group">
          <svg class="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Messages -->
      {#if error}
        <div class="border border-red-500/20 bg-red-500/5 px-6 py-3 rounded-2xl mb-6 text-red-400 text-[10px] font-[800] italic">
          {error}
        </div>
      {/if}

      {#if success}
        <div class="border border-green-500/20 bg-green-500/5 px-6 py-3 rounded-2xl mb-6 text-green-400 text-[10px] font-[800] italic">
          {success}
        </div>
      {/if}

      <!-- Form -->
      <div class="space-y-5 mb-6">
        <!-- Username -->
        <div>
          <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Имя пользователя</label>
          <input
            type="text"
            bind:value={username}
            class="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm font-[800] italic outline-none focus:border-blue-500/50 transition-all"
            placeholder="username"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Email</label>
          <input
            type="email"
            bind:value={email}
            class="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm font-[800] italic outline-none focus:border-blue-500/50 transition-all"
            placeholder="email@example.com"
          />
        </div>

        <!-- Password Change Section -->
        <div class="border-t border-white/5 pt-5 mt-6">
          <p class="text-[9px] mono uppercase tracking-widest text-slate-500 mb-4">Изменить пароль</p>

          <div class="space-y-4">
            <div>
              <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Текущий пароль</label>
              <input
                type="password"
                bind:value={currentPassword}
                class="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm font-[800] italic outline-none focus:border-blue-500/50 transition-all"
                placeholder="••••••"
              />
            </div>

            <div>
              <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Новый пароль</label>
              <input
                type="password"
                bind:value={newPassword}
                class="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm font-[800] italic outline-none focus:border-blue-500/50 transition-all"
                placeholder="••••••"
              />
            </div>

            <div>
              <label class="text-[8px] mono uppercase tracking-[0.3em] text-slate-500 block mb-2">Подтвердите пароль</label>
              <input
                type="password"
                bind:value={confirmPassword}
                class="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm font-[800] italic outline-none focus:border-blue-500/50 transition-all"
                placeholder="••••••"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <button
          on:click={handleSave}
          disabled={loading}
          class="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-[11px] font-[800] uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>

        <button
          on:click={handleLogout}
          class="w-full border border-red-500/20 hover:bg-red-500/10 text-red-500 py-4 rounded-2xl text-[11px] font-[800] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  </div>
{/if}
