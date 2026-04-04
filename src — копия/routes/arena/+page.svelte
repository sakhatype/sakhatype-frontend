<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '$utils/api.js';
  import { userStore } from '$stores/user.js';
  import { settingsStore } from '$stores/settings.js';
  import { mapToSakha } from '$utils/sakha.js';
  import Footer from '$components/layout/Footer.svelte';

  $: theme = $settingsStore.theme;

  let rooms = []; let loading = true; let ws = null; let currentRoom = null; let gameState = 'lobby';
  let words = []; let currentWordIndex = 0; let currentInput = ''; let players = {};
  let startTime = 0; let timeLeft = 30; let timerInterval = null; let myWpm = 0; let myAccuracy = 100;
  let winner = null; let results = {};
  $: user = $userStore.user;
  $: settings = $settingsStore;
  onMount(() => loadRooms());
  onDestroy(() => { if (ws) ws.close(); if (timerInterval) clearInterval(timerInterval); });

  async function loadRooms() { loading = true; try { rooms = await api.listRooms(); } catch { rooms = []; } loading = false; }
  async function createRoom() { if (!user) return; try { const d = await api.createRoom(settings.mode, settings.modeValue, 'sakha'); joinRoom(d.room_id); } catch {} }
  function joinRoom(rid) {
    if (!user) return; currentRoom = rid; gameState = 'waiting';
    const apiUrl = import.meta.env.VITE_API_URL || '';
    let wsBase;
    if (apiUrl && apiUrl.startsWith('http')) { wsBase = apiUrl.replace(/^http/, 'ws'); }
    else { wsBase = `${location.protocol==='https:'?'wss':'ws'}://${location.host}/api`; }
    ws = new WebSocket(`${wsBase}/arena/ws/${rid}/${user.username}`);
    ws.onmessage = (e) => { const m = JSON.parse(e.data);
      if (m.type==='player_joined'||m.type==='player_left') players = m.players||{};
      if (m.type==='game_start') { words=m.words; gameState='playing'; startTime=Date.now(); timeLeft=m.mode_value||30; startTimer(); }
      if (m.type==='player_progress'&&players[m.player]) { players[m.player].progress=m.progress; players[m.player].wpm=m.wpm; players={...players}; }
      if (m.type==='game_end') { gameState='finished'; winner=m.winner; results=m.results; if(timerInterval)clearInterval(timerInterval); }
    };
    ws.onclose = () => { if(gameState!=='finished'){gameState='lobby';currentRoom=null;} };
  }
  function startGame() { if(ws) ws.send(JSON.stringify({type:'start'})); }
  function startTimer() { timerInterval=setInterval(()=>{timeLeft--;if(timeLeft<=0){clearInterval(timerInterval);finish();}},1000); }
  function handleKeyDown(e) {
    if(gameState!=='playing')return;
    if(settings.sakhaBinds){const m=mapToSakha(e.key, settings.customBindings);if(m){e.preventDefault();currentInput+=m;return;}}
    if(e.key===' '){e.preventDefault();if(currentInput.length>0){currentWordIndex++;currentInput='';sendProg();if(currentWordIndex>=words.length)finish();}return;}
    if(e.key==='Backspace'){e.preventDefault();currentInput=currentInput.slice(0,-1);return;}
    if(e.key.length>1)return; currentInput+=e.key;
  }
  function sendProg() { if(!ws)return; const el=(Date.now()-startTime)/1000/60; const ch=words.slice(0,currentWordIndex).join('').length; myWpm=el>0?Math.round((ch/5)/el):0; ws.send(JSON.stringify({type:'progress',progress:currentWordIndex,wpm:myWpm,accuracy:myAccuracy})); }
  function finish() { if(ws){const el=(Date.now()-startTime)/1000/60;const ch=words.slice(0,currentWordIndex).join('').length;myWpm=el>0?Math.round((ch/5)/el):0;ws.send(JSON.stringify({type:'finish',wpm:myWpm,accuracy:myAccuracy}));} }
  function leave() { if(ws)ws.close();if(timerInterval)clearInterval(timerInterval);currentRoom=null;gameState='lobby';words=[];currentWordIndex=0;currentInput='';players={};winner=null;results={};loadRooms(); }
</script>

<svelte:window on:keydown={handleKeyDown} />
<svelte:head><title>SAKHATYPE // ARENA</title></svelte:head>

<div class="flex-1 flex flex-col">
{#if !user}
<div class="flex items-center justify-center flex-1">
  <div class="s-card p-16 text-center max-w-md animate-fade-up">
    <div class="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
      <svg class="w-8 h-8 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    </div>
    <h2 class="text-2xl font-heading font-extrabold uppercase tracking-tight mb-4"
        class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Соревнования</h2>
    <p class="text-xs text-surface-400 mb-8">Авторизуйтесь для начала соревнований</p>
    <a href="/auth" class="px-10 py-4 bg-primary-500 text-white rounded-2xl font-heading font-bold uppercase text-xs tracking-wider hover:bg-primary-400 transition-all inline-block glow-primary">Войти</a>
  </div>
</div>

{:else if gameState === 'lobby'}
<main class="container mx-auto px-4 sm:px-6 md:px-10 flex-1 relative z-20 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div class="lg:col-span-8 flex flex-col gap-5">
      <h2 class="text-2xl font-heading font-extrabold uppercase tracking-tight mb-2"
          class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Лобби</h2>
      {#if rooms.length === 0}
        <div class="s-card p-12 text-center">
          <p class="mono text-xs uppercase tracking-[0.2em] text-surface-400">Пока никого нет</p>
        </div>
      {:else}
        {#each rooms as room}
          <div class="s-card p-6 flex items-center justify-between cursor-pointer">
            <div class="flex items-center gap-6">
              <div class="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h3 class="font-heading font-bold text-lg uppercase tracking-tight"
                    class:text-surface-100={theme === 'dark'} class:text-surface-900={theme === 'light'}>{room.room_id}</h3>
                <span class="mono text-[10px] text-surface-400 uppercase tracking-wider">{room.player_count} игроков</span>
              </div>
            </div>
            <button on:click={() => joinRoom(room.room_id)} class="px-6 py-3 rounded-xl s-card mono text-xs font-bold uppercase tracking-wider transition-all hover:!bg-primary-500 hover:!text-white"
                    class:text-surface-200={theme === 'dark'}>Join</button>
          </div>
        {/each}
      {/if}
    </div>

    <div class="lg:col-span-4">
      <div class="s-card p-10 flex flex-col items-center text-center relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-15 pointer-events-none" style="background: rgb(113 113 122);"></div>
        <div class="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mb-8 glow-primary-strong">
          <svg class="w-10 h-10 text-white translate-x-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <h3 class="text-2xl font-heading font-extrabold uppercase tracking-tight mb-3"
            class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Быстрая игра</h3>
        <p class="text-xs text-surface-400 mb-8">Играйте с друзьями или другими игроками</p>
        <button on:click={createRoom} class="w-full bg-primary-500 text-white py-4 rounded-2xl font-heading font-bold uppercase text-xs tracking-wider hover:bg-primary-400 transition-all glow-primary">Создать лобби</button>
      </div>
    </div>
  </div>
</main>

{:else if gameState === 'waiting'}
<div class="flex items-center justify-center flex-1 px-4">
  <div class="s-card p-10 max-w-lg w-full text-center animate-fade-up">
    <h2 class="font-heading font-extrabold text-xl mb-2 uppercase tracking-tight"
        class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>Комната: {currentRoom}</h2>
    <p class="mono text-[10px] text-surface-400 uppercase tracking-[0.2em] mb-8">Ожидаем игроков...</p>
    <div class="space-y-3 mb-8">
      {#each Object.entries(players) as [name]}
        <div class="s-card p-4 flex items-center justify-between !rounded-xl">
          <span class="font-heading font-bold"
                class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>{name}</span>
          <span class="badge-sakha bg-primary-500/10 text-primary-400">Ready</span>
        </div>
      {/each}
    </div>
    <div class="flex gap-3 justify-center">
      <button on:click={startGame} class="bg-primary-500 hover:bg-primary-400 px-8 py-3 rounded-xl font-heading font-bold uppercase text-xs text-white tracking-wider transition-all glow-primary">Начать</button>
      <button on:click={leave} class="s-card px-6 py-3 !rounded-xl font-heading font-bold uppercase text-xs text-surface-400 hover:text-surface-100 transition-all">Выйти</button>
    </div>
  </div>
</div>

{:else if gameState === 'playing'}
<div class="container mx-auto px-4 sm:px-6 md:px-10 max-w-6xl flex-1 flex flex-col justify-center">
  <div class="text-center mb-8">
    <span class="text-4xl sm:text-5xl font-heading font-extrabold text-primary-400 tracking-tight mono">{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</span>
  </div>
  <div class="space-y-3 mb-8">
    {#each Object.entries(players) as [name, data]}
      {@const pct = words.length > 0 ? ((data.progress||0)/words.length)*100 : 0}
      <div class="s-card p-4 flex items-center gap-4 !rounded-xl">
        <span class="font-heading font-bold text-sm w-20 sm:w-28 truncate"
              class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>{name}</span>
        <div class="flex-1 h-2 bg-surface-700/50 rounded-full overflow-hidden">
          <div class="h-full bg-primary-500 rounded-full transition-all duration-300" style="width:{pct}%; box-shadow: 0 0 10px rgba(113,113,122,0.4);"></div>
        </div>
        <span class="text-primary-400 mono font-bold text-sm w-16 sm:w-20 text-right">{data.wpm||0}</span>
      </div>
    {/each}
  </div>
  <div class="mono text-2xl sm:text-3xl leading-relaxed select-none"
       class:text-surface-500={theme === 'dark'} class:text-surface-400={theme === 'light'}>
    {#each words as word, i}
      <span class="inline-block mr-[0.4em] leading-[1.7]"
            class:text-surface-100={i<currentWordIndex && theme === 'dark'}
            class:text-surface-800={i<currentWordIndex && theme === 'light'}
            class:font-bold={i<currentWordIndex}>
        {#if i===currentWordIndex}{#each word.split('') as char,ci}<span class="{ci<currentInput.length?(currentInput[ci]===char?(theme === 'dark' ? 'text-surface-100 font-bold' : 'text-surface-800 font-bold'):'text-error-400 border-b-2 border-error-400'):(theme === 'dark' ? 'text-surface-500' : 'text-surface-400')}">{char}</span>{/each}{#if currentInput.length>word.length}<span class="text-warning-400 line-through">{currentInput.slice(word.length)}</span>{/if}{:else}{word}{/if}
      </span>
    {/each}
  </div>
</div>

{:else if gameState === 'finished'}
<div class="flex items-center justify-center flex-1">
  <div class="text-center max-w-lg w-full animate-fade-up">
    <div class="inline-flex items-center gap-3 mb-4 px-5 py-2 rounded-full border border-primary-500/30 bg-primary-500/10">
      <svg class="w-5 h-5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7m12-3h1.5a2.5 2.5 0 0 1 0 5H18s0-3-2.5-5M12 14l-3.5 5h7z"/></svg>
      <span class="mono text-[10px] font-bold tracking-[0.3em] text-primary-400 uppercase">Match Results</span>
    </div>
    <h1 class="text-7xl font-heading font-black tracking-tighter uppercase leading-none mb-8"
        class:text-surface-50={theme === 'dark'} class:text-surface-900={theme === 'light'}>
      {winner === user.username ? 'WINNER' : winner}
    </h1>
    <div class="space-y-3 mb-8">
      {#each Object.entries(results).sort((a,b)=>(b[1].wpm||0)-(a[1].wpm||0)) as [name,data],i}
        <div class="s-card p-4 flex items-center justify-between !rounded-xl {name===winner?'!border-primary-500/30 glow-primary':''}">
          <div class="flex items-center gap-3">
            <span class="mono text-xs text-surface-400">#{i+1}</span>
            <span class="font-heading font-bold"
                  class:text-surface-100={theme === 'dark'} class:text-surface-800={theme === 'light'}>{name}</span>
          </div>
          <span class="text-primary-400 font-heading font-extrabold">{data.wpm||0} WPM</span>
        </div>
      {/each}
    </div>
    <button on:click={leave} class="px-12 py-4 bg-primary-500 text-white rounded-2xl font-heading font-bold uppercase text-xs tracking-wider hover:bg-primary-400 transition-all glow-primary">Play Again</button>
  </div>
</div>
{/if}

<Footer />
</div>
