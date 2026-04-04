<script>
  import Footer from '$components/layout/Footer.svelte';
  import { settingsStore } from '$stores/settings.js';
  import { onMount } from 'svelte';

  $: theme = $settingsStore.theme;

  /** @type {HTMLDivElement | undefined} */
  let sectionsRoot;

  /** id секции без # — для подсветки навигации при скролле */
  let activeSectionId = '';

  function scrollSpyOffsetPx() {
    if (!sectionsRoot) return 100;
    const first = sectionsRoot.querySelector('section[id]');
    if (!first) return 100;
    const raw = getComputedStyle(first).scrollMarginTop;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 100;
  }

  function updateActiveFromScroll() {
    if (!sectionsRoot) return;
    const sections = sectionsRoot.querySelectorAll('section[id]');
    const offset = scrollSpyOffsetPx();
    let id = '';
    sections.forEach((el) => {
      if (el.getBoundingClientRect().top <= offset) id = el.id;
    });
    activeSectionId = id || (sections[0]?.id ?? '');
  }

  let scrollRaf = 0;
  function onScrollOrResize() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      updateActiveFromScroll();
    });
  }

  onMount(() => {
    updateActiveFromScroll();
    requestAnimationFrame(() => requestAnimationFrame(updateActiveFromScroll));
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    window.addEventListener('hashchange', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('hashchange', onScrollOrResize);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
    };
  });

  /** @type {string} */
  let copiedKey = '';

  /** @param {string} key @param {string} text */
  async function copyCode(key, text) {
    try {
      await navigator.clipboard.writeText(text.trim());
      copiedKey = key;
      setTimeout(() => {
        if (copiedKey === key) copiedKey = '';
      }, 2000);
    } catch {
      copiedKey = '';
    }
  }

  const nav = [
    { href: '#about', label: 'О системе' },
    { href: '#tokens', label: 'Токены и цвета' },
    { href: '#typography', label: 'Типографика' },
    { href: '#card', label: 'Карточка .s-card' },
    { href: '#buttons', label: 'Кнопки' },
    { href: '#inputs', label: 'Поля ввода' },
    { href: '#chips', label: 'Чипы навигации' },
    { href: '#badges', label: 'Бейджи' },
    { href: '#alerts', label: 'Состояния и алерты' },
    { href: '#effects', label: 'Свечение и фон' },
    { href: '#motion', label: 'Анимации' },
  ];

  const code = {
    tokens: `<!-- Палитра через Tailwind + тема sakha-theme (tailwind.config.js) -->
<div class="bg-primary-500 text-white">Акцент primary-500</div>
<div class="bg-surface-800 text-surface-100">Поверхность</div>
<div class="text-success-400">Успех</div>
<div class="text-error-400">Ошибка</div>
<div class="text-warning-400">Предупреждение</div>`,

    typography: `<!-- Заголовки: Outfit (.font-heading), текст: Space Grotesk, код: JetBrains Mono -->
<h2 class="text-3xl font-heading font-extrabold tracking-tight uppercase text-surface-50">
  Заголовок секции
</h2>
<p class="mono text-[9px] text-surface-400 uppercase tracking-widest">Подпись mono</p>
<p class="text-sm text-surface-300 leading-relaxed">Основной текст интерфейса.</p>
<span class="mono text-xs font-bold">const wpm = 120;</span>`,

    card: `<!-- Стеклянная карточка: граница, радиус, hover из app.css -->
<div class="s-card p-8">
  <h3 class="text-xl font-heading font-bold text-surface-50">Заголовок</h3>
  <p class="text-sm text-surface-400 mt-2">Контент карточки.</p>
</div>`,

    buttons: `<!-- Основная CTA -->
<button
  type="button"
  class="w-full bg-primary-500 hover:bg-primary-400 text-white py-4 rounded-2xl font-heading font-bold uppercase text-xs tracking-wider transition-all glow-primary"
>
  Сохранить
</button>

<!-- Вторичная / обводка -->
<button
  type="button"
  class="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-surface-600/35 text-surface-400 hover:text-surface-100 hover:border-primary-500/25 transition-all"
>
  Отмена
</button>

<!-- Опасное действие -->
<button
  type="button"
  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase border border-error-500/25 text-error-400 hover:bg-error-500/10"
>
  Удалить
</button>`,

    inputs: `<label class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block mb-2">
  Подпись поля
</label>
<input type="text" class="input-sakha w-full" placeholder="Введите значение" />`,

    chips: `<!-- Навигационные чипы (как в Header) -->
<nav class="flex gap-1.5 s-card px-2 py-1.5">
  <a href="#" class="chip-sakha active text-primary-400">Активный</a>
  <a href="#" class="chip-sakha text-surface-300 hover:text-surface-100">Неактивный</a>
</nav>`,

    badges: `<span class="badge-sakha bg-primary-500/15 text-primary-400">beta</span>
<span class="badge-sakha bg-success-500/15 text-success-400">live</span>
<span class="badge-sakha bg-surface-700/80 text-surface-300">mono</span>`,

    alerts: `<!-- Ошибка -->
<div class="border border-error-500/20 bg-error-500/5 px-6 py-3 rounded-2xl text-error-400 text-xs font-bold">
  Текст ошибки
</div>

<!-- Успех -->
<div class="border border-success-500/20 bg-success-500/5 px-6 py-3 rounded-2xl text-success-400 text-xs font-bold">
  Успешно сохранено
</div>`,

    effects: `<!-- Мягкое свечение у кнопок / акцентов -->
<button class="glow-primary ...">С подсветкой</button>

<!-- Сетка на фоне страницы (уже в +layout) -->
<div class="grid-bg fixed inset-0 pointer-events-none opacity-100"></div>`,

    motion: `<!-- Готовые keyframes в app.css -->
<div class="animate-fade-up">Появление снизу</div>
<div class="animate-fade-in">Простое появление</div>
<div class="animate-scale-in">Масштаб</div>`,
  };

  /** RGB без «rgb()» — совпадает с themes.custom.sakha-theme в tailwind.config.js (превью без зависимости от CSS-переменных). */
  const tokenSwatches = [
    { label: 'primary-500', rgb: '113 113 122' },
    { label: 'surface-800', rgb: '24 24 27' },
    { label: 'surface-100', rgb: '244 244 245' },
    { label: 'success-400', rgb: '40 200 110' },
    { label: 'error-400', rgb: '248 90 90' },
    { label: 'warning-400', rgb: '250 190 40' },
  ];
</script>

<svelte:head>
  <title>Sakhatype — Дизайн-система</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex-1 flex flex-col">
  <main class="container mx-auto px-6 md:px-10 flex-1 relative z-20 py-8">
    <div class="grid grid-cols-12 gap-3">
      <!-- Левая колонка: навигация по якорям -->
      <aside class="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:sticky lg:top-8 lg:self-start">
        <div class="s-card p-6 md:p-8 relative overflow-hidden">
          <div
            class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none"
            style="background: rgb(113 113 122);"
          ></div>
          <div class="relative z-10">
            <p class="mono text-[9px] text-primary-400 uppercase tracking-[0.35em] mb-2">Sakhatype</p>
            <h1
              class="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase mb-2"
              class:text-surface-50={theme === 'dark'}
              class:text-surface-900={theme === 'light'}
            >
              Design System
            </h1>
            <p class="text-sm text-surface-500 leading-relaxed mb-6">
              Токены, утилиты и паттерны интерфейса. Код ниже можно вставлять в Svelte/HTML с теми же классами Tailwind.
            </p>
            <nav class="flex flex-col gap-0.5" aria-label="Разделы дизайн-системы">
              {#each nav as item}
                {@const sid = item.href.slice(1)}
                {@const isActive = activeSectionId === sid}
                <a
                  href={item.href}
                  class="group flex items-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border {isActive
                    ? 'border-primary-500/35 bg-primary-500/5'
                    : 'border-transparent hover:border-primary-500/20 hover:bg-primary-500/5'} {theme === 'dark'
                    ? isActive
                      ? 'text-primary-400'
                      : 'text-surface-400 hover:text-primary-400'
                    : isActive
                      ? 'text-primary-600'
                      : 'text-surface-600 hover:text-primary-600'}"
                  aria-current={isActive ? 'location' : undefined}
                >
                  <span
                    class="w-1 h-1 rounded-full transition-colors shrink-0 {isActive
                      ? 'bg-primary-400'
                      : 'bg-primary-500/0 group-hover:bg-primary-400'}"
                  ></span>
                  {item.label}
                </a>
              {/each}
            </nav>
          </div>
        </div>

        <div class="s-card p-5 flex items-center gap-4">
          <img
            src="/aytal-popov-avatar.png"
            width="56"
            height="56"
            alt="Айтал Попов — дизайнер проекта"
            class="w-14 h-14 rounded-2xl shrink-0 object-cover border-2 border-primary-500/25 bg-surface-800"
            loading="lazy"
            decoding="async"
          />
          <div class="min-w-0">
            <p
            class="font-heading font-bold text-base tracking-tight"
            class:text-surface-100={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Айтал Попов
          </p>
            <p class="mono text-[9px] uppercase tracking-[0.2em] text-surface-500">Sakhatype Design System Developer</p>
          </div>
        </div>
      </aside>

      <!-- Правая колонка: секции -->
      <div class="col-span-12 lg:col-span-8 flex flex-col gap-3" bind:this={sectionsRoot}>
        <!-- Блок: копирование кода -->
        {#snippet codeBlock(key, source)}
          <div
            class="mt-4 rounded-xl border border-surface-600/40 overflow-hidden"
            class:border-surface-300={theme === 'light'}
          >
            <div
              class="flex items-center justify-between gap-2 px-4 py-2 border-b {theme === 'dark'
                ? 'bg-surface-800/40 border-surface-600/40'
                : 'bg-surface-100 border-surface-300'}"
            >
              <span class="mono text-[10px] text-surface-500 uppercase tracking-wider">HTML / классы</span>
              <button
                type="button"
                class="mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all border border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
                on:click={() => copyCode(key, source)}
              >
                {copiedKey === key ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
            <pre
              class="p-4 text-[11px] leading-relaxed overflow-x-auto mono max-h-[320px] overflow-y-auto {theme === 'dark'
                ? 'bg-surface-900 text-surface-300'
                : 'bg-white text-surface-700'}"
            ><code>{source}</code></pre>
          </div>
        {/snippet}

        <section id="about" class="scroll-mt-24 s-card p-8 relative overflow-hidden">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            О дизайн-системе
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">Введение</p>
          <div class="space-y-3 text-sm text-surface-400 leading-relaxed">
            <p>
              Визуальный язык Sakhatype строится на теме <strong class="text-surface-200">sakha-theme</strong> (Skeleton +
              Tailwind), нейтральной монохромной палитре <code class="mono text-primary-400">primary</code> и шрифтах Outfit,
              Space Grotesk и JetBrains Mono.
            </p>
            <p>
              Глобальные стили и компонентные классы объявлены в <code class="mono text-xs text-primary-400">src/app.css</code
              >. Переключение темы: классы <code class="mono text-xs">dark</code> и
              <code class="mono text-xs">light</code> на корневом контейнере в
              <code class="mono text-xs">+layout.svelte</code>.
            </p>
          </div>
        </section>

        <section id="tokens" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Токены и цвета
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">
            Tailwind: primary, surface, success, error, warning, tertiary
          </p>
          <p class="text-sm text-surface-500 mb-2">
            Используйте оттенки 400–600 для текста и границ, 500 для основного акцента, 900/50 для фона страницы.
          </p>
          <p class="text-xs text-surface-500 mono mb-4 leading-relaxed">
            Превью: явный <code class="text-primary-400">rgb()</code> из <code class="text-primary-400">tailwind.config.js</code> — так
            цвета всегда видны. В разметке приложения те же значения приходят через классы
            <code class="text-primary-400">bg-*</code> и переменные темы на <code class="text-primary-400">body[data-theme]</code>.
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {#each tokenSwatches as sw}
              <div class="rounded-xl overflow-hidden border border-surface-600/30 bg-surface-900/20">
                <div
                  class="h-14 w-full min-h-[3.5rem] shrink-0"
                  style="background-color: rgb({sw.rgb}); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);"
                ></div>
                <p class="mono text-[10px] px-2 py-2 text-surface-500">{sw.label}</p>
              </div>
            {/each}
          </div>
          {@render codeBlock('tokens', code.tokens)}
        </section>

        <section id="typography" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Типографика
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-6">Outfit · Space Grotesk · JetBrains Mono</p>
          <div class="space-y-6 mb-2">
            <div>
              <h3
                class="text-3xl font-heading font-extrabold tracking-tight uppercase"
                class:text-surface-50={theme === 'dark'}
                class:text-surface-900={theme === 'light'}
              >
                Заголовок H1/H2
              </h3>
              <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mt-1">.font-heading · extrabold · uppercase</p>
            </div>
            <div>
              <p class="text-sm text-surface-300 leading-relaxed max-w-prose">
                Основной текст: удобочитаемый абзац для форм, подсказок и описаний. Размер <code class="mono text-primary-400"
                  >text-sm</code
                > или <code class="mono text-primary-400">text-base</code>.
              </p>
            </div>
            <div>
              <span class="mono text-xs font-bold text-primary-400">const bestWpm = 142;</span>
              <p class="mono text-[9px] text-surface-500 mt-1">.mono — метрики, подписи полей, код</p>
            </div>
          </div>
          {@render codeBlock('typography', code.typography)}
        </section>

        <section id="card" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Карточка
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">Класс .s-card</p>
          <div class="s-card p-6 mb-2">
            <h3
              class="text-lg font-heading font-bold"
              class:text-surface-100={theme === 'dark'}
              class:text-surface-900={theme === 'light'}
            >
              Пример вложенной карточки
            </h3>
            <p class="text-sm text-surface-500 mt-1">Стеклянная поверхность с hover по границе (см. app.css).</p>
          </div>
          {@render codeBlock('card', code.card)}
        </section>

        <section id="buttons" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Кнопки
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">CTA · вторичная · опасная</p>
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 mb-2">
            <button
              type="button"
              class="px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-2xl font-heading font-bold uppercase text-xs tracking-wider glow-primary transition-all"
            >
              Основная
            </button>
            <button
              type="button"
              class="px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all border-surface-600/35 text-surface-400 hover:text-surface-100 hover:border-primary-500/25"
              class:border-surface-300={theme === 'light'}
            >
              Вторичная
            </button>
            <button
              type="button"
              class="px-5 py-3 rounded-lg text-xs font-bold uppercase border border-error-500/25 text-error-400 hover:bg-error-500/10 transition-all"
            >
              Опасная
            </button>
          </div>
          {@render codeBlock('buttons', code.buttons)}
        </section>

        <section id="inputs" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Поля ввода
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">.input-sakha</p>
          <div class="max-w-md space-y-2 mb-2">
            <label for="design-input-preview" class="mono text-[9px] uppercase tracking-[0.2em] text-surface-400 block"
              >Имя пользователя</label
            >
            <input
              id="design-input-preview"
              type="text"
              class="input-sakha w-full"
              placeholder="username"
              readonly
              value="preview"
            />
          </div>
          {@render codeBlock('inputs', code.inputs)}
        </section>

        <section id="chips" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Чипы навигации
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">.chip-sakha · .active</p>
          <div class="flex flex-wrap gap-2 s-card px-2 py-2 w-fit mb-2">
            <span class="chip-sakha active cursor-default">Активный</span>
            <span class="chip-sakha text-surface-400 cursor-default">Пассивный</span>
          </div>
          {@render codeBlock('chips', code.chips)}
        </section>

        <section id="badges" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Бейджи
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">.badge-sakha + цвет фона</p>
          <div class="flex flex-wrap gap-2 mb-2">
            <span class="badge-sakha bg-primary-500/15 text-primary-400">beta</span>
            <span class="badge-sakha bg-success-500/15 text-success-400">live</span>
            <span
              class="badge-sakha text-surface-300"
              class:bg-surface-700={theme === 'dark'}
              class:bg-surface-200={theme === 'light'}
            >tag</span>
          </div>
          {@render codeBlock('badges', code.badges)}
        </section>

        <section id="alerts" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Состояния и алерты
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">Ошибка и успех (как в формах)</p>
          <div class="space-y-3 mb-2">
            <div class="border border-error-500/20 bg-error-500/5 px-6 py-3 rounded-2xl text-error-400 text-xs font-bold">
              Не удалось сохранить профиль
            </div>
            <div class="border border-success-500/20 bg-success-500/5 px-6 py-3 rounded-2xl text-success-400 text-xs font-bold">
              Изменения применены
            </div>
          </div>
          {@render codeBlock('alerts', code.alerts)}
        </section>

        <section id="effects" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Свечение и фон
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">.glow-primary · .grid-bg</p>
          <div class="flex flex-wrap gap-4 items-center mb-2">
            <button
              type="button"
              class="px-5 py-3 rounded-2xl bg-primary-500 text-white text-xs font-heading font-bold uppercase glow-primary"
            >
              glow-primary
            </button>
            <div
              class="w-40 h-24 rounded-xl border border-surface-600/50 grid-bg opacity-80 flex items-center justify-center mono text-[9px] text-surface-500"
            >
              grid-bg
            </div>
          </div>
          {@render codeBlock('effects', code.effects)}
        </section>

        <section id="motion" class="scroll-mt-24 s-card p-8">
          <h2
            class="text-2xl font-heading font-extrabold tracking-tight mb-2"
            class:text-surface-50={theme === 'dark'}
            class:text-surface-900={theme === 'light'}
          >
            Анимации
          </h2>
          <p class="mono text-[9px] text-surface-400 uppercase tracking-widest mb-4">animate-fade-up · fade-in · scale-in</p>
          <p class="text-sm text-surface-500 mb-4">
            Классы задают однократную анимацию появления (см. <code class="mono text-primary-400">@keyframes</code> в app.css).
          </p>
          <div class="flex flex-wrap gap-4 mb-2">
            <div class="animate-fade-up s-card px-4 py-3 mono text-xs text-surface-400">fade-up</div>
            <div class="animate-fade-in s-card px-4 py-3 mono text-xs text-surface-400">fade-in</div>
            <div class="animate-scale-in s-card px-4 py-3 mono text-xs text-surface-400">scale-in</div>
          </div>
          {@render codeBlock('motion', code.motion)}
        </section>
      </div>
    </div>
  </main>
  <Footer />
</div>
