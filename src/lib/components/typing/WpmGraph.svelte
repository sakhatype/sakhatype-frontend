<script>
  import { settingsStore } from '$stores/settings.js';
  import { typingStore } from '$stores/typing.js';

  export let wpmHistory = [];
  export let rawWpm = 0;
  export let wpm = 0;

  $: theme = $settingsStore.theme;
  $: snapshots = $typingStore.secondSnapshots || [];
  $: totalErrors = $typingStore._totalErrors || 0;

  $: data = snapshots.length > 0 ? snapshots : wpmHistory.map((h, i) => ({
    sec: Math.round(h.time), wpm: h.wpm, raw: h.raw, burst: 0, errors: 0,
  }));

  const W = 900; const H = 300;
  const PAD_L = 50; const PAD_R = 50; const PAD_T = 20; const PAD_B = 35;
  const chartW = W - PAD_L - PAD_R; const chartH = H - PAD_T - PAD_B;

  $: maxWpm = Math.max(...data.map(d => Math.max(d.wpm, d.raw, d.burst || 0)), 10) * 1.15;
  $: maxErrors = Math.max(...data.map(d => d.errors), 1);
  $: maxSec = data.length > 0 ? Math.max(...data.map(d => d.sec), 1) : 1;

  function xPos(sec) { return PAD_L + (sec / maxSec) * chartW; }
  function yWpm(v) { return PAD_T + chartH - (v / maxWpm) * chartH; }
  function yErr(v) { return PAD_T + chartH - (v / maxErrors) * chartH; }

  function smoothPath(pts) {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)]; const p1 = pts[i];
      const p2 = pts[i + 1]; const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6; const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6; const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  function smoothArea(pts) {
    if (pts.length < 2) return '';
    const linePath = smoothPath(pts);
    const lastPt = pts[pts.length - 1]; const firstPt = pts[0];
    return `${linePath}L${lastPt.x},${PAD_T + chartH}L${firstPt.x},${PAD_T + chartH}Z`;
  }

  $: wpmPts = data.map(d => ({ x: xPos(d.sec), y: yWpm(d.wpm) }));
  $: rawPts = data.map(d => ({ x: xPos(d.sec), y: yWpm(d.raw) }));
  $: burstPts = data.map(d => ({ x: xPos(d.sec), y: yWpm(d.burst || 0) }));
  $: wpmLine = smoothPath(wpmPts);
  $: rawLine = smoothPath(rawPts);
  $: burstLine = smoothPath(burstPts);
  $: rawArea = smoothArea(rawPts);
  $: wpmArea = smoothArea(wpmPts);

  $: errorDots = data.filter(d => d.errors > 0).map(d => ({
    x: xPos(d.sec), y: yErr(d.errors), errors: d.errors, sec: d.sec,
  }));

  $: yTicks = (() => {
    const step = Math.ceil(maxWpm / 5 / 10) * 10; const ticks = [];
    for (let v = 0; v <= maxWpm; v += step) ticks.push(v); return ticks;
  })();

  $: errTicks = (() => {
    const ticks = []; for (let v = 0; v <= maxErrors; v++) ticks.push(v); return ticks;
  })();

  $: xTicks = (() => {
    const ticks = [];
    const step = maxSec <= 15 ? 1 : maxSec <= 30 ? 2 : maxSec <= 60 ? 5 : 10;
    for (let v = step; v <= maxSec; v += step) ticks.push(v); return ticks;
  })();

  let hoverIdx = -1; let tooltipX = 0; let tooltipY = 0;

  function handleMouseMove(e) {
    if (data.length === 0) return;
    const svg = e.currentTarget; const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0; let closestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const px = xPos(data[i].sec); const dist = Math.abs(px - mouseX);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    }
    hoverIdx = closest;
    tooltipX = xPos(data[closest].sec);
    tooltipY = yWpm(data[closest].wpm);
  }

  function handleMouseLeave() { hoverIdx = -1; }
</script>

{#if data.length > 1}
<div class="s-card p-5 sm:p-7">
  <div class="flex justify-between items-center mb-4">
    <h3 class="font-heading font-bold text-xs uppercase tracking-[0.2em]"
        class:text-surface-100={theme === 'dark'}
        class:text-surface-800={theme === 'light'}>WPM График</h3>
    <div class="flex gap-4 mono text-[9px]">
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-0.5 bg-primary-400 rounded-full"></div>
        <span class="text-surface-400">wpm</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-0.5 bg-surface-400 rounded-full opacity-60"></div>
        <span class="text-surface-400">raw</span>
      </div>
      {#if snapshots.length > 0}
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-0.5 rounded-full bg-primary-300/50"></div>
          <span class="text-surface-400">burst</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-error-500"></div>
          <span class="text-surface-400">ошибки</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="relative w-full" style="aspect-ratio: {W}/{H};">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <svg viewBox="0 0 {W} {H}" class="w-full h-full"
         on:mousemove={handleMouseMove} on:mouseleave={handleMouseLeave}>
      <defs>
        <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e82e6" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#1e82e6" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="rawFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="{theme === 'dark' ? '#6e7a94' : '#9ba5b9'}" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="{theme === 'dark' ? '#6e7a94' : '#9ba5b9'}" stop-opacity="0"/>
        </linearGradient>
      </defs>

      {#each yTicks as v}
        <line x1={PAD_L} y1={yWpm(v)} x2={W - PAD_R} y2={yWpm(v)}
              stroke={theme === 'dark' ? 'rgba(40,48,72,0.5)' : 'rgba(0,0,0,0.06)'} stroke-width="1"/>
      {/each}

      {#if rawArea}<path d={rawArea} fill="url(#rawFill)"/>{/if}
      {#if wpmArea}<path d={wpmArea} fill="url(#wpmFill)"/>{/if}

      {#if rawLine}
        <path d={rawLine} fill="none" stroke={theme === 'dark' ? '#46526e' : '#9ba5b9'}
              stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round"/>
      {/if}

      {#if snapshots.length > 0 && burstLine}
        <path d={burstLine} fill="none" stroke="rgba(102,181,255,0.4)"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      {/if}

      {#if wpmLine}
        <path d={wpmLine} fill="none" stroke="#1e82e6"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      {/if}

      {#each errorDots as dot}
        <circle cx={dot.x} cy={yWpm(data.find(d => d.sec === dot.sec)?.wpm || 0) - 12}
                r={3 + dot.errors * 1.5} fill="#ef4444" fill-opacity="0.8"/>
      {/each}

      {#each yTicks as v}
        <text x={PAD_L - 8} y={yWpm(v) + 3} text-anchor="end"
              fill={theme === 'dark' ? '#46526e' : '#9ba5b9'}
              font-family="'JetBrains Mono', monospace" font-size="10">{v}</text>
      {/each}

      {#if snapshots.length > 0}
        {#each errTicks as v}
          <text x={W - PAD_R + 8} y={yErr(v) + 3} text-anchor="start"
                fill="#ef4444" fill-opacity="0.5"
                font-family="'JetBrains Mono', monospace" font-size="10">{v}</text>
        {/each}
      {/if}

      {#each xTicks as v}
        <text x={xPos(v)} y={H - 5} text-anchor="middle"
              fill={theme === 'dark' ? '#46526e' : '#9ba5b9'}
              font-family="'JetBrains Mono', monospace" font-size="10">{v}</text>
      {/each}

      <text x={PAD_L - 8} y={PAD_T - 6} text-anchor="end"
            fill={theme === 'dark' ? '#283048' : '#c8cfdb'}
            font-family="'JetBrains Mono', monospace" font-size="8">wpm</text>
      {#if snapshots.length > 0}
        <text x={W - PAD_R + 8} y={PAD_T - 6} text-anchor="start"
              fill="#ef4444" fill-opacity="0.4"
              font-family="'JetBrains Mono', monospace" font-size="8">ошибки</text>
      {/if}

      {#if hoverIdx >= 0}
        <line x1={tooltipX} y1={PAD_T} x2={tooltipX} y2={PAD_T + chartH}
              stroke={theme === 'dark' ? 'rgba(102,181,255,0.15)' : 'rgba(0,0,0,0.1)'} stroke-width="1"/>
        <circle cx={tooltipX} cy={tooltipY} r="4"
                fill="#1e82e6" stroke={theme === 'dark' ? '#080a14' : '#e6e9f0'} stroke-width="2"/>
      {/if}
    </svg>

    {#if hoverIdx >= 0 && data[hoverIdx]}
      {@const d = data[hoverIdx]}
      <div class="absolute pointer-events-none z-30 animate-fade-in"
           style="left: {(tooltipX / W) * 100}%; top: {((tooltipY - 10) / H) * 100}%; transform: translate(-50%, -100%);">
        <div class="s-card px-4 py-3 shadow-xl text-left !rounded-xl" style="min-width: 130px;">
          <p class="mono text-[10px] font-bold mb-2"
             class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>
            Секунда {d.sec}
          </p>
          <div class="space-y-1 mono text-[9px]">
            <div class="flex justify-between gap-4">
              <span class="text-primary-400 font-bold">wpm:</span>
              <span class="font-bold" class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>{Math.round(d.wpm)}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-surface-400 font-bold">raw:</span>
              <span class="font-bold" class:text-surface-200={theme === 'dark'} class:text-surface-600={theme === 'light'}>{Math.round(d.raw)}</span>
            </div>
            {#if snapshots.length > 0}
              <div class="flex justify-between gap-4">
                <span class="text-primary-300/70 font-bold">burst:</span>
                <span class="font-bold" class:text-surface-200={theme === 'dark'} class:text-surface-600={theme === 'light'}>{Math.round(d.burst || 0)}</span>
              </div>
              {#if d.errors > 0}
                <div class="flex justify-between gap-4">
                  <span class="text-error-400 font-bold">ошибки:</span>
                  <span class="text-error-400 font-bold">{d.errors}</span>
                </div>
              {/if}
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-4 gap-4 mt-5 pt-5 border-t"
       class:border-surface-700/50={theme === 'dark'}
       class:border-surface-200={theme === 'light'}>
    <div>
      <p class="mono text-[8px] uppercase text-primary-400 mb-1">Avg WPM</p>
      <p class="text-xl font-heading font-extrabold text-primary-400">{wpm}</p>
    </div>
    <div>
      <p class="mono text-[8px] uppercase text-surface-400 mb-1">Raw WPM</p>
      <p class="text-xl font-heading font-extrabold text-surface-400">{rawWpm}</p>
    </div>
    <div>
      <p class="mono text-[8px] uppercase text-surface-400 mb-1">Peak WPM</p>
      <p class="text-xl font-heading font-extrabold"
         class:text-surface-100={theme === 'dark'}
         class:text-surface-800={theme === 'light'}>{Math.round(Math.max(...data.map(d => d.wpm)))}</p>
    </div>
    <div>
      <p class="mono text-[8px] uppercase text-error-400/60 mb-1">Ошибки</p>
      <p class="text-xl font-heading font-extrabold text-error-400">{totalErrors}</p>
    </div>
  </div>
</div>
{/if}
