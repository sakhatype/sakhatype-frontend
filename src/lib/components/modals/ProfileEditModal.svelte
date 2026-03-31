<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { goto } from '$app/navigation';
  import { api } from '$utils/api.js';

  export let isOpen = false;
  export let onClose = () => {};

  $: currentUser = $userStore.user;
  $: theme = $settingsStore.theme;

  let username = ''; let email = ''; let currentPassword = ''; let newPassword = ''; let confirmPassword = '';
  let error = ''; let success = ''; let loading = false;

  $: if (isOpen && currentUser) {
    username = currentUser.username; email = currentUser.email || '';
    currentPassword = ''; newPassword = ''; confirmPassword = '';
    error = ''; success = '';
  }

  async function handleSave() {
    error = ''; success = '';
    if (!username.trim()) { error = 'Имя пользователя не может быть пустым'; return; }
    if (newPassword && newPassword !== confirmPassword) { error = 'Пароли не совпадают'; return; }
    if (newPassword && newPassword.length < 6) { error = 'Пароль должен быть минимум 6 символов'; return; }
    loading = true;
    try {
      const updates = {};
      if (username !== currentUser.username) updates.username = username;
      if (email !== currentUser.email) updates.email = email;
      if (newPassword) { updates.current_password = currentPassword; updates.new_password = newPassword; }
      if (Object.keys(updates).length > 0) {
        const response = await api.updateProfile(updates, $userStore.token);
        userStore.updateUser(response.user);
        success = 'Профиль успешно обновлен';
        setTimeout(() => onClose(), 1500);
      } else { onClose(); }
    } catch (err) { error = err.message || 'Ошибка при обновлении профиля'; }
    finally { loading = false; }
  }

  function handleLogout() { userStore.logout(); goto('/'); }
  function handleBackdropClick(e) { if (e.target === e.currentTarget) onClose(); }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
       on:click={handleBackdropClick} role="dialog" aria-modal="true">
    <div class="s-card p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto !rounded-3xl">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-heading font-extrabold tracking-tight"
              class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Управление аккаунтом</h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mt-1">Настройки аккаунта</p>
        </div>
        <button on:click={onClose} class="w-10 h-10 rounded-xl hover:bg-surface-700/50 flex items-center justify-center transition-all group">
          <svg class="w-5 h-5 text-surface-400 group-hover:text-surface-100 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {#if error}<div class="border border-error-500/20 bg-error-500/5 px-6 py-3 rounded-2xl mb-6 text-error-400 text-xs font-bold">{error}</div>{/if}
      {#if success}<div class="border border-success-500/20 bg-success-500/5 px-6 py-3 rounded-2xl mb-6 text-success-400 text-xs font-bold">{success}</div>{/if}

      <div class="space-y-5 mb-6">
        <div>
          <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Имя пользователя</label>
          <input type="text" bind:value={username} class="input-sakha w-full" placeholder="username" />
        </div>
        <div>
          <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Email</label>
          <input type="email" bind:value={email} class="input-sakha w-full" placeholder="email@example.com" />
        </div>
        <div class="border-t border-surface-600/30 pt-5 mt-6">
          <p class="mono text-[9px] uppercase tracking-widest text-surface-400 mb-4">Изменить пароль</p>
          <div class="space-y-4">
            <div>
              <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Текущий пароль</label>
              <input type="password" bind:value={currentPassword} class="input-sakha w-full" placeholder="••••••" />
            </div>
            <div>
              <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Новый пароль</label>
              <input type="password" bind:value={newPassword} class="input-sakha w-full" placeholder="••••••" />
            </div>
            <div>
              <label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">Подтвердите пароль</label>
              <input type="password" bind:value={confirmPassword} class="input-sakha w-full" placeholder="••••••" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <button on:click={handleSave} disabled={loading}
          class="w-full bg-primary-500 hover:bg-primary-400 text-white py-4 rounded-2xl font-heading font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50 glow-primary">
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
        <button on:click={handleLogout}
          class="w-full border border-error-500/20 hover:bg-error-500/10 text-error-400 py-4 rounded-2xl font-heading font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  </div>
{/if}
