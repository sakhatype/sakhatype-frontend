<script>
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$utils/api.js';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import Footer from '$components/layout/Footer.svelte';
  import AvatarUpload from '$components/modals/AvatarUpload.svelte';
  import { mediaUrl } from '$utils/mediaUrl.js';

  $: theme = $settingsStore.theme;

  let profile = null;
  let loading = true;
  /** @type {any[]} */
  let tests = [];
  let testsTotal = 0;
  let testsPage = 1;
  let testsLoading = false;
  /** @type {'all' | '7d' | '30d' | '365d'} */
  let datePeriod = 'all';
  /** @type {'all' | 'time' | 'words'} */
  let modeFilter = 'all';
  /** @type {40 | 60 | 120} */
  let pageSize = 40;
  let profileReloadSeq = 0;

  $: username = $page.params.username;
  $: currentUser = $userStore.user;
  $: isOwnProfile = currentUser && currentUser.username === username;

  async function loadTests() {
    if (!username || !profile?.user) return;
    testsLoading = true;
    try {
      const data = await api.getProfileWithTestList(username, {
        page: testsPage,
        page_size: pageSize,
        period: datePeriod,
        mode: modeFilter,
      });
      if (data) {
        profile = data;
        tests = data.tests ?? [];
        testsTotal = data.total ?? 0;
      }
    } catch {
      tests = [];
      testsTotal = 0;
    }
    testsLoading = false;
  }

  async function reloadProfileForUser() {
    if (!username) return;
    const seq = ++profileReloadSeq;
    loading = true;
    datePeriod = 'all';
    modeFilter = 'all';
    pageSize = 40;
    testsPage = 1;
    try {
      const next = await api.getProfileWithTestList(username, {
        page: 1,
        page_size: 40,
        period: 'all',
        mode: 'all',
      });
      if (seq !== profileReloadSeq) return;
      profile = next;
      tests = next?.tests ?? [];
      testsTotal = next?.total ?? 0;
    } catch {
      if (seq !== profileReloadSeq) return;
      profile = null;
      tests = [];
      testsTotal = 0;
    }
    if (seq !== profileReloadSeq) return;
    loading = false;
  }

  afterNavigate(({ to }) => {
    const u = to?.params?.username;
    if (u) reloadProfileForUser();
  });

  /** @param {'all' | '7d' | '30d' | '365d'} p */
  function pickPeriod(p) {
    datePeriod = p;
    testsPage = 1;
    loadTests();
  }

  /** @param {'all' | 'time' | 'words'} m */
  function pickMode(m) {
    modeFilter = m;
    testsPage = 1;
    loadTests();
  }

  /** @param {40 | 60 | 120} n */
  function pickPageSize(n) {
    pageSize = n;
    testsPage = 1;
    loadTests();
  }

  function goPrevPage() {
    if (testsPage <= 1) return;
    testsPage -= 1;
    loadTests();
  }

  function goNextPage() {
    if (testsPage >= totalPages) return;
    testsPage += 1;
    loadTests();
  }

  $: user = profile?.user;
  $: contributionHistory = profile?.history || [];
  $: xpPercent = user ? (user.xp / user.xp_to_next) * 100 : 0;
  $: contributionDays = buildContributionDays(contributionHistory, 288);
  $: totalPages = Math.max(1, Math.ceil(testsTotal / pageSize));
  $: rangeFrom = testsTotal === 0 ? 0 : (testsPage - 1) * pageSize + 1;
  $: rangeTo = testsTotal === 0 ? 0 : Math.min(testsPage * pageSize, testsTotal);
  $: contributionWeeks = chunkByWeek(contributionDays);
  $: contributionMonthLabels = getContributionMonthLabels(contributionWeeks);

  function formatYakutskTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      const yakutskOffset = 9 * 60;
      const localOffset = date.getTimezoneOffset();
      const totalOffset = yakutskOffset + localOffset;
      const yakutskTime = new Date(date.getTime() + totalOffset * 60 * 1000);
      const day = String(yakutskTime.getDate()).padStart(2, '0');
      const month = String(yakutskTime.getMonth() + 1).padStart(2, '0');
      const year = yakutskTime.getFullYear();
      const hours = String(yakutskTime.getHours()).padStart(2, '0');
      const minutes = String(yakutskTime.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (e) { return 'N/A'; }
  }

  function getModeLabel(mode, modeValue) {
    if (mode === 'time') return `${modeValue}с`;
    if (mode === 'words') return `${modeValue} слов`;
    return mode;
  }

  /** @param {string} [d] */
  function difficultyLabel(d) {
    return d === 'expert' ? 'Сложный' : 'Легкий';
  }

  function toDateKey(timestamp) {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function getContributionLevel(avgWpm, maxWpm) {
    if (!avgWpm || !maxWpm) return 0;
    const ratio = avgWpm / maxWpm;
    if (ratio >= 0.75) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  }

  function buildContributionDays(tests, daysCount = 140) {
    const statsByDay = new Map();

    for (const test of tests || []) {
      const key = toDateKey(test.timestamp || test.created_at);
      if (!key) continue;
      const wpm = Number(test.wpm) || 0;
      if (!statsByDay.has(key)) statsByDay.set(key, { totalWpm: 0, tests: 0 });
      const dayStats = statsByDay.get(key);
      dayStats.totalWpm += wpm;
      dayStats.tests += 1;
    }

    const today = startOfDay(new Date());
    const start = new Date(today);
    start.setDate(today.getDate() - (daysCount - 1));
    start.setDate(start.getDate() - start.getDay());

    const days = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      const stat = statsByDay.get(key);
      const count = stat?.tests || 0;
      const avgWpm = count ? Math.round(stat.totalWpm / count) : 0;

      days.push({
        date: new Date(cursor),
        key,
        count,
        avgWpm
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const maxWpm = Math.max(...days.map((d) => d.avgWpm), 0);
    return days.map((day) => ({ ...day, level: getContributionLevel(day.avgWpm, maxWpm) }));
  }

  function chunkByWeek(days) {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  }

  function formatContributionDate(date) {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getContributionMonthLabels(weeks) {
    const labels = [];
    let prevMonth = -1;

    for (const week of weeks) {
      const firstDay = week?.[0]?.date;
      if (!firstDay) {
        labels.push('');
        continue;
      }

      const month = firstDay.getMonth();
      if (month !== prevMonth) {
        labels.push(firstDay.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''));
        prevMonth = month;
      } else {
        labels.push('');
      }
    }

    return labels;
  }

  const profileStatPlaceholders = [1, 2, 3];
  const profileTestSkeletonRows = 5;
</script>

<svelte:head><title>Sakhatype - Профиль {username}</title></svelte:head>

<div class="flex-1 flex flex-col">
{#if loading}
<main class="container mx-auto px-6 md:px-10 flex-1 relative z-20 py-8">
  <div class="grid grid-cols-12 gap-3">
    <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
      <div class="s-card p-8 relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style="background: rgb(113 113 122);"></div>
        <div class="relative z-10">
          <div class="skeleton w-24 h-24 rounded-2xl border-2 border-transparent mb-6"></div>
          <div class="skeleton h-9 w-[min(100%,14rem)] rounded-lg mb-2"></div>
          <div class="skeleton h-3 w-24 rounded mb-4"></div>
          <div class="mt-6 space-y-2">
            <div class="flex justify-between">
              <div class="skeleton h-2.5 w-24 rounded"></div>
              <div class="skeleton h-2.5 w-16 rounded"></div>
            </div>
            <div class="skeleton h-2 w-full rounded-full"></div>
          </div>
          {#if isOwnProfile}
            <div class="skeleton h-12 w-full rounded-xl mt-6"></div>
          {/if}
        </div>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-8 flex flex-col gap-3">
      <div class="grid grid-cols-3 gap-3">
        {#each profileStatPlaceholders as _}
          <div class="s-card p-6">
            <div class="skeleton h-2.5 w-28 rounded mb-4"></div>
            <div class="skeleton h-10 w-20 rounded-lg"></div>
          </div>
        {/each}
      </div>
      <div class="s-card p-6">
        <div class="flex justify-between items-center mb-6">
          <div class="skeleton h-4 w-28 rounded"></div>
          <div class="skeleton h-3 w-20 rounded"></div>
        </div>
        <div class="skeleton h-32 w-full rounded-xl"></div>
        <div class="mt-4 flex items-center justify-between gap-3">
          <div class="skeleton h-2.5 w-36 rounded"></div>
          <div class="skeleton h-3 w-48 max-w-[50%] rounded"></div>
        </div>
      </div>
      <div class="s-card p-6">
        <div class="flex justify-between items-center mb-5">
          <div class="skeleton h-4 w-44 rounded"></div>
          <div class="skeleton h-3 w-28 rounded"></div>
        </div>
        <div class="space-y-2.5 max-h-[600px] overflow-hidden pr-2">
          {#each Array.from({ length: profileTestSkeletonRows }) as _, i (i)}
            <div class="s-card p-4 !rounded-xl">
              <div class="flex items-center justify-between mb-3">
                <div class="skeleton h-3 w-40 rounded"></div>
                <div class="skeleton h-6 w-14 rounded-lg"></div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                {#each [1, 2, 3, 4, 5] as _}
                  <div class="skeleton h-8 w-full rounded-md"></div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</main>
{:else if !profile}
  <div class="flex items-center justify-center flex-1">
    <div class="text-center">
      <p class="text-2xl font-heading font-extrabold uppercase mb-4"
         class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Error Backend кароч хз</p>
      <a href="/" class="px-10 py-4 bg-primary-500 text-white rounded-2xl font-heading font-bold uppercase text-xs tracking-wider hover:bg-primary-400 transition-all inline-block">Пахай</a>
    </div>
  </div>
{:else}
<main class="container mx-auto px-6 md:px-10 flex-1 relative z-20 py-8">
  <div class="grid grid-cols-12 gap-3">
    <!-- Profile card -->
    <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
      <div class="s-card p-8 relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style="background: rgb(113 113 122);"></div>
        <div class="relative z-10">
          {#if isOwnProfile}
            <div class="mb-6 flex justify-center lg:justify-start">
              <AvatarUpload
                currentAvatarUrl={user.avatar_url}
                username={user.username}
                onUploaded={() => reloadProfileForUser()}
              />
            </div>
          {:else}
            <div class="w-24 h-24 rounded-2xl border-2 border-primary-500/30 flex items-center justify-center mb-6 bg-gradient-to-br from-primary-500/15 to-transparent overflow-hidden">
              {#if user.avatar_url}
                <img src={mediaUrl(user.avatar_url)} alt="" class="w-full h-full object-cover" />
              {:else}
                <span class="text-4xl font-heading font-black text-primary-400">{user.username.charAt(0).toUpperCase()}</span>
              {/if}
            </div>
          {/if}
          <h2 class="text-3xl font-heading font-extrabold tracking-tight uppercase mb-1"
              class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>{user.username}</h2>
          <p class="text-primary-400 mono text-xs font-bold tracking-wider mb-4">Ур. {user.level}</p>

          <div class="mt-6 space-y-2">
            <div class="flex justify-between mono text-[9px] text-surface-400 uppercase">
              <span>XP прогресс</span>
              <span>{user.xp} / {user.xp_to_next}</span>
            </div>
            <div class="w-full h-2 bg-surface-700/50 rounded-full overflow-hidden">
              <div class="h-full bg-primary-500 rounded-full transition-all" style="width: {xpPercent}%; box-shadow: 0 0 12px rgba(113,113,122,0.35);"></div>
            </div>
          </div>

          {#if isOwnProfile}
            <a href="/profile/account"
              class="w-full mt-6 px-6 py-3 s-card !rounded-xl hover:!border-primary-500/40 font-heading font-bold uppercase text-xs tracking-wider text-surface-400 hover:text-surface-100 transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Управление аккаунтом
            </a>
          {/if}
        </div>
      </div>
    </div>

    <!-- Stats + History -->
    <div class="col-span-12 lg:col-span-8 flex flex-col gap-3">
      <div class="grid grid-cols-3 gap-3">
        <div class="s-card p-6">
          <span class="mono text-[9px] font-bold text-primary-400 uppercase tracking-wider mb-3 block">Средний WPM</span>
          <span class="text-4xl font-heading font-extrabold"
                class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>{user.avg_wpm}</span>
        </div>
        <div class="s-card p-6">
          <span class="mono text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-3 block">Тестов</span>
          <span class="text-4xl font-heading font-extrabold"
                class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>{user.total_tests}</span>
        </div>
        <div class="s-card p-6 glow-primary">
          <span class="mono text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-3 block">Лучший WPM</span>
          <span class="text-4xl font-heading font-extrabold text-primary-400">{user.best_wpm}</span>
        </div>
      </div>

      {#if contributionHistory.length > 0}
        <!-- WPM contributions -->
        <div class="s-card p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-heading font-bold text-xs uppercase tracking-[0.2em]"
                class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>История</h3>
            <span class="mono text-[9px] text-surface-400 uppercase tracking-wider">Взносы</span>
            <!-- <span class="mono text-[9px] text-surface-400 uppercase tracking-wider">{history.length} тестов</span> -->
          </div>
          <div class="overflow-x-auto">
            <div class="min-w-max">
              <div class="flex items-center gap-1.5 mb-2">
                <div class="w-8"></div>
                {#each contributionMonthLabels as label}
                  <div class="w-3.5 mono text-[9px] text-surface-500 uppercase">{label}</div>
                {/each}
              </div>
              <div class="flex gap-1.5">
                <div class="w-8 flex flex-col gap-1.5 pr-1">
                  <div class="h-3.5"></div>
                  <div class="h-3.5 mono text-[9px] text-surface-500 leading-[14px]">Пн</div>
                  <div class="h-3.5"></div>
                  <div class="h-3.5 mono text-[9px] text-surface-500 leading-[14px]">Ср</div>
                  <div class="h-3.5"></div>
                  <div class="h-3.5 mono text-[9px] text-surface-500 leading-[14px]">Пт</div>
                  <div class="h-3.5"></div>
                </div>
                <div class="flex gap-1.5">
                  {#each contributionWeeks as week}
                    <div class="flex flex-col gap-1.5">
                      {#each week as day}
                        <div
                          class="w-3.5 h-3.5 rounded-[3px] border border-surface-600/20 transition-all hover:scale-110 cursor-default
                            {day.level === 0 ? 'bg-surface-700/30' : ''}
                            {day.level === 1 ? 'bg-primary-500/25' : ''}
                            {day.level === 2 ? 'bg-primary-500/45' : ''}
                            {day.level === 3 ? 'bg-primary-500/70' : ''}
                            {day.level === 4 ? 'bg-primary-500' : ''}"
                          title="{formatContributionDate(day.date)} • {day.count} тест(ов) • {day.avgWpm} WPM"
                        ></div>
                      {/each}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between gap-3">
            <span class="mono text-[9px] text-surface-500 uppercase tracking-wider">
              Последние 288 дней
            </span>
            <div class="flex items-center gap-2">
              <span class="mono text-[9px] text-surface-500 uppercase">Меньше</span>
              {#each [0, 1, 2, 3, 4] as level}
                <div
                  class="w-3 h-3 rounded-[3px] border border-surface-600/20
                    {level === 0 ? 'bg-surface-700/30' : ''}
                    {level === 1 ? 'bg-primary-500/25' : ''}
                    {level === 2 ? 'bg-primary-500/45' : ''}
                    {level === 3 ? 'bg-primary-500/70' : ''}
                    {level === 4 ? 'bg-primary-500' : ''}"
                ></div>
              {/each}
              <span class="mono text-[9px] text-surface-500 uppercase">Больше</span>
            </div>
          </div>
        </div>
      {/if}

      {#if (user?.total_tests ?? 0) > 0 || contributionHistory.length > 0 || testsTotal > 0 || tests.length > 0}
        <!-- Test history -->
        <div class="s-card p-6">
          <div class="flex flex-col gap-4 mb-5">
            <div class="flex flex-wrap justify-between items-start gap-3">
              <h3 class="font-heading font-bold text-xs uppercase tracking-[0.2em]"
                  class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>Пройденные тесты</h3>
              <span class="mono text-[9px] text-surface-400 uppercase tracking-wider">По фильтру: {testsTotal}</span>
            </div>
            <div class="flex flex-row flex-wrap items-end justify-between gap-x-4 gap-y-3">
              <div class="flex flex-col gap-2 min-w-0">
                <span class="mono text-[9px] font-bold uppercase tracking-wider text-surface-500 px-0.5">Период</span>
                <div class="flex flex-wrap gap-2">
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {datePeriod === 'all' ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && datePeriod !== 'all'}
                    class:text-surface-800={theme === 'light' && datePeriod !== 'all'}
                    on:click={() => pickPeriod('all')}>Все время</button>
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {datePeriod === '7d' ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && datePeriod !== '7d'}
                    class:text-surface-800={theme === 'light' && datePeriod !== '7d'}
                    on:click={() => pickPeriod('7d')}>7 дней</button>
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {datePeriod === '30d' ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && datePeriod !== '30d'}
                    class:text-surface-800={theme === 'light' && datePeriod !== '30d'}
                    on:click={() => pickPeriod('30d')}>Месяц</button>
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {datePeriod === '365d' ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && datePeriod !== '365d'}
                    class:text-surface-800={theme === 'light' && datePeriod !== '365d'}
                    on:click={() => pickPeriod('365d')}>Год</button>
                </div>
              </div>
              <div class="flex flex-col gap-2 min-w-0 items-start sm:items-end sm:text-right ml-auto">
                <span class="mono text-[9px] font-bold uppercase tracking-wider text-surface-500 px-0.5 w-full sm:w-auto">Режим</span>
                <div class="flex flex-wrap gap-2 sm:justify-end">
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {modeFilter === 'all' ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && modeFilter !== 'all'}
                    class:text-surface-800={theme === 'light' && modeFilter !== 'all'}
                    on:click={() => pickMode('all')}>Все</button>
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {modeFilter === 'time' ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && modeFilter !== 'time'}
                    class:text-surface-800={theme === 'light' && modeFilter !== 'time'}
                    on:click={() => pickMode('time')}>Время</button>
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {modeFilter === 'words' ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && modeFilter !== 'words'}
                    class:text-surface-800={theme === 'light' && modeFilter !== 'words'}
                    on:click={() => pickMode('words')}>Слова</button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-2.5 max-h-[600px] overflow-y-auto pr-2 relative" class:opacity-60={testsLoading}>
            {#if tests.length === 0 && !testsLoading}
              <p class="mono text-[10px] text-surface-500 text-center py-8 uppercase tracking-wider">Нет тестов по выбранным фильтрам</p>
            {/if}
            {#each tests as test, idx (testsPage + '-' + idx + '-' + (test.created_at || test.timestamp || ''))}
              <div class="s-card p-4 !rounded-xl group">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <span class="mono text-[9px] text-surface-500">#{testsTotal - ((testsPage - 1) * pageSize + idx)}</span>
                    <div class="flex gap-3 mono text-[9px]">
                      <span class="text-success-400">✓ {test.chars_correct}</span>
                      <span class="text-error-400">✗ {test.chars_incorrect || 0}</span>
                      {#if test.chars_extra}<span class="text-warning-400">+ {test.chars_extra}</span>{/if}
                      {#if test.chars_missed}<span class="text-surface-500">− {test.chars_missed}</span>{/if}
                    </div>
                  </div>
                  <span class="badge-sakha bg-primary-500/10 border border-primary-500/20 text-primary-400">
                    {getModeLabel(test.mode, test.mode_value)}
                  </span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">WPM</span>
                    <span class="text-xl font-heading font-extrabold"
                          class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>{test.wpm}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">Raw</span>
                    <span class="text-lg font-heading font-bold text-surface-300">{test.raw_wpm || test.wpm}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">Accuracy</span>
                    <span class="text-lg font-bold mono text-primary-400">{test.accuracy}%</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">Сложность</span>
                    <span class="text-lg font-heading font-bold"
                          class:text-success-400={(test.difficulty ?? 'normal') === 'normal'}
                          class:text-error-400={(test.difficulty ?? 'normal') === 'expert'}>
                      {difficultyLabel(test.difficulty)}
                    </span>
                  </div>
                  <div class="flex flex-col col-span-2 sm:col-span-2 xl:col-span-1">
                    <span class="mono text-[8px] uppercase text-surface-400 mb-1">Дата</span>
                    <span class="text-[10px] font-bold mono text-surface-300">{formatYakutskTime(test.timestamp || test.created_at)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <div class="mt-5 pt-5 border-t border-surface-600/20 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-4">
            <div class="flex flex-col gap-2">
              <span class="mono text-[9px] font-bold uppercase tracking-wider text-surface-500">На странице</span>
              <div class="flex flex-wrap gap-2">
                {#each [40, 60, 120] as n}
                  <button type="button"
                    class="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all
                      {pageSize === n ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'border-surface-600/40 text-surface-400 hover:border-surface-500'}"
                    class:text-surface-100={theme === 'dark' && pageSize !== n}
                    class:text-surface-800={theme === 'light' && pageSize !== n}
                    on:click={() => pickPageSize(n)}>{n}</button>
                {/each}
              </div>
            </div>
            <div class="flex flex-col gap-2 items-start sm:items-end">
              <span class="mono text-[9px] text-surface-500 uppercase tracking-wider">
                {#if testsTotal > 0}{rangeFrom}–{rangeTo} из {testsTotal}{/if}
              </span>
              <div class="flex items-center gap-2">
                <button type="button"
                  class="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-surface-600/40 text-surface-400 hover:border-primary-500/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  disabled={testsPage <= 1 || testsLoading}
                  on:click={goPrevPage}>Назад</button>
                <span class="mono text-[10px] text-surface-400 tabular-nums">{testsPage} / {totalPages}</span>
                <button type="button"
                  class="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-surface-600/40 text-surface-400 hover:border-primary-500/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  disabled={testsPage >= totalPages || testsLoading}
                  on:click={goNextPage}>Вперёд</button>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>
{/if}
<Footer />
</div>
