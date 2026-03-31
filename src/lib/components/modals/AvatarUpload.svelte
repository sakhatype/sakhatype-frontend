<script>
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { api } from '$utils/api.js';

  export let currentAvatarUrl = null;
  export let username = '';
  export let onUploaded = () => {};

  $: theme = $settingsStore.theme;

  let fileInput;
  let uploading = false;
  let error = '';
  let previewUrl = null;
  let selectedFile = null;
  let showCropModal = false;

  // Crop state
  let imgEl;
  let canvasEl;
  let cropX = 0, cropY = 0, cropSize = 160;
  let imgNaturalW = 0, imgNaturalH = 0;
  let dragging = false;
  let dragStartX = 0, dragStartY = 0;
  let startCropX = 0, startCropY = 0;
  let displayScale = 1;

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      error = 'Выберите изображение';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      error = 'Файл слишком большой (макс. 10МБ)';
      return;
    }
    error = '';
    selectedFile = file;
    previewUrl = URL.createObjectURL(file);
    showCropModal = true;
  }

  function onImgLoad() {
    if (!imgEl) return;
    imgNaturalW = imgEl.naturalWidth;
    imgNaturalH = imgEl.naturalHeight;

    // Display in a max 400px box
    const maxDisplay = 400;
    displayScale = Math.min(maxDisplay / imgNaturalW, maxDisplay / imgNaturalH, 1);

    // Init crop to center square
    const side = Math.min(imgNaturalW, imgNaturalH);
    cropSize = side;
    cropX = (imgNaturalW - side) / 2;
    cropY = (imgNaturalH - side) / 2;
  }

  function handleMouseDown(e) {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startCropX = cropX;
    startCropY = cropY;
    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (!dragging) return;
    const dx = (e.clientX - dragStartX) / displayScale;
    const dy = (e.clientY - dragStartY) / displayScale;
    cropX = Math.max(0, Math.min(imgNaturalW - cropSize, startCropX + dx));
    cropY = Math.max(0, Math.min(imgNaturalH - cropSize, startCropY + dy));
  }

  function handleMouseUp() {
    dragging = false;
  }

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 20 : -20;
    const newSize = Math.max(80, Math.min(Math.min(imgNaturalW, imgNaturalH), cropSize + delta));
    // Keep centered
    const cx = cropX + cropSize / 2;
    const cy = cropY + cropSize / 2;
    cropSize = newSize;
    cropX = Math.max(0, Math.min(imgNaturalW - cropSize, cx - cropSize / 2));
    cropY = Math.max(0, Math.min(imgNaturalH - cropSize, cy - cropSize / 2));
  }

  async function handleUpload() {
    if (!selectedFile) return;
    uploading = true;
    error = '';

    try {
      // Create a cropped canvas
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');

      const img = new window.Image();
      img.src = previewUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, 160, 160);

      // Convert to blob
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' });

      const result = await api.uploadAvatar(file, $userStore.token);
      userStore.updateUser({ avatar_url: result.avatar_url });
      onUploaded(result.avatar_url);
      showCropModal = false;
      previewUrl = null;
      selectedFile = null;
    } catch (err) {
      error = err.message || 'Ошибка загрузки';
    } finally {
      uploading = false;
    }
  }

  function cancelCrop() {
    showCropModal = false;
    previewUrl = null;
    selectedFile = null;
    if (fileInput) fileInput.value = '';
  }
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<div class="flex flex-col items-center">
  <!-- Avatar display -->
  <button
    on:click={() => fileInput?.click()}
    class="relative group cursor-pointer"
  >
    <div class="w-28 h-28 rounded-2xl border-2 border-primary-500/30 overflow-hidden bg-gradient-to-br from-blue-600/20 to-transparent flex items-center justify-center">
      {#if currentAvatarUrl}
        <img src={currentAvatarUrl} alt="Avatar" class="w-full h-full object-cover" />
      {:else}
        <span class="text-5xl font-bold "
              class:text-surface-50={theme === 'dark'}
              class:text-surface-900={theme === 'light'}>{username.charAt(0).toUpperCase()}</span>
      {/if}
    </div>
    <div class="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <svg class="w-8 h-8 text-surface-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </div>
  </button>

  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    class="hidden"
    on:change={handleFileSelect}
  />

  {#if error}
    <p class="text-error-400 text-[10px] font-bold  mt-2">{error}</p>
  {/if}
</div>

<!-- Crop Modal -->
{#if showCropModal && previewUrl}
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-up"
    on:click|self={cancelCrop}
    role="dialog"
    aria-modal="true"
  >
    <div class="s-card rounded-3xl p-8 max-w-lg w-full mx-4">
      <h3 class="text-xl font-bold  uppercase tracking-tight mb-6"
          class:text-surface-50={theme === 'dark'}
          class:text-surface-900={theme === 'light'}>Обрезать аватар</h3>

      <p class="text-[9px] mono text-surface-400 uppercase tracking-widest mb-4">Перетащите область, прокрутите для масштаба</p>

      <!-- Crop area -->
      <div class="relative mx-auto overflow-hidden rounded-2xl bg-black/50 select-none"
           style="width: {imgNaturalW * displayScale}px; height: {imgNaturalH * displayScale}px; max-width: 100%;"
           on:wheel={handleWheel}>
        <img
          bind:this={imgEl}
          src={previewUrl}
          alt="Preview"
          class="block"
          style="width: {imgNaturalW * displayScale}px; height: {imgNaturalH * displayScale}px;"
          on:load={onImgLoad}
          draggable="false"
        />

        <!-- Darkened overlay -->
        <div class="absolute inset-0" style="background: rgba(0,0,0,0.6);
             clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%,
               0 {cropY * displayScale}px,
               {cropX * displayScale}px {cropY * displayScale}px,
               {cropX * displayScale}px {(cropY + cropSize) * displayScale}px,
               0 {(cropY + cropSize) * displayScale}px);"></div>

        <!-- Crop box -->
        <div
          class="absolute border-2 border-white/80 rounded-xl cursor-move"
          style="left: {cropX * displayScale}px; top: {cropY * displayScale}px; width: {cropSize * displayScale}px; height: {cropSize * displayScale}px;"
          on:mousedown={handleMouseDown}
          role="slider"
          tabindex="0"
          aria-label="Crop area"
          aria-valuenow={cropSize}
        >
          <!-- Corner indicators -->
          <div class="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full"></div>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>
          <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full"></div>
          <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full"></div>
        </div>
      </div>

      <!-- Preview thumbnail -->
      <div class="flex items-center gap-4 mt-6">
        <span class="text-[9px] mono text-surface-400 uppercase tracking-widest">Предпросмотр:</span>
        <div class="w-12 h-12 rounded-xl overflow-hidden border border-surface-600/50 bg-black/50">
          {#if previewUrl && imgNaturalW > 0}
            <img src={previewUrl} alt="Crop preview"
                 style="width: {(imgNaturalW / cropSize) * 48}px; height: {(imgNaturalH / cropSize) * 48}px;
                        margin-left: {-(cropX / cropSize) * 48}px; margin-top: {-(cropY / cropSize) * 48}px;" />
          {/if}
        </div>
        <span class="text-[9px] mono text-surface-500">160 × 160 WebP</span>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-6">
        <button
          on:click={handleUpload}
          disabled={uploading}
          class="flex-1 bg-primary-500 hover:bg-primary-400 text-surface-50 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50"
        >
          {uploading ? 'Загрузка...' : 'Сохранить аватар'}
        </button>
        <button
          on:click={cancelCrop}
          class="px-6 py-4 border border-surface-600/50 hover:bg-surface-700/50 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] text-surface-300 transition-all"
        >
          Отмена
        </button>
      </div>
    </div>
  </div>
{/if}
