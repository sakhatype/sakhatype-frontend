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
    if (apiUrl && apiUrl.startsWith('http')) {
      wsBase = apiUrl.replace(/^http/, 'ws');
    } else {
      wsBase = `${location.protocol==='https:'?'wss':'ws'}://${location.host}/api`;
    }
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
  <div class="premium-border p-16 rounded-[40px] text-center max-w-md">
    <h2 class="text-2xl font-[800] italic uppercase tracking-tighter mb-4"
        class:text-white={theme === 'dark'}
        class:text-slate-900={theme === 'light'}>Совернования</h2>
    <p class="text-xs text-slate-500 italic mb-8">Авторизуйтесь для начала совернований</p>
    <a href="/auth" class="px-10 py-4 bg-white text-black rounded-[20px] font-[800] uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all inline-block">Войти</a>
  </div>
</div>

{:else if gameState === 'lobby'}
<main class="container mx-auto px-4 sm:px-6 md:px-12 flex-1 relative z-20 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div class="lg:col-span-8 flex flex-col gap-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <h2 class="text-2xl font-[800] italic uppercase tracking-tighter"
            class:text-white={theme === 'dark'}
            class:text-slate-900={theme === 'light'}>Лоббилар</h2>
      </div>
      {#if rooms.length === 0}
        <div class="premium-border p-12 rounded-[32px] text-center opacity-50">
          <p class="text-[9px] mono uppercase tracking-[0.3em] text-slate-600 italic">Отой билигин ким да суох // Аан бастыкы буол! Лоббита оҥор</p>
        </div>
      {:else}
        {#each rooms as room}
          <div class="premium-border p-6 rounded-[32px] flex items-center justify-between bento-item cursor-pointer">
            <div class="flex items-center gap-8">
              <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h3 class="font-[800] italic text-xl uppercase tracking-tighter"
                    class:text-white={theme === 'dark'}
                    class:text-slate-900={theme === 'light'}>{room.room_id}</h3>
                <span class="text-[10px] mono text-slate-500 uppercase tracking-widest">{room.player_count} оонньооччу</span>
              </div>
            </div>
            <button on:click={() => joinRoom(room.room_id)} class="px-8 py-3 rounded-xl border border-white/10 text-[10px] font-[800] uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all">Join</button>
          </div>
        {/each}
      {/if}
    </div>
    <div class="lg:col-span-4">
      <div class="premium-border p-10 rounded-[40px] bg-blue-600/[0.03] flex flex-col items-center text-center">
        <div class="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center mb-8 godzilla-glow shadow-[0_0_40px_rgba(37,99,235,0.4)]">
          <svg class="w-10 h-10 text-white translate-x-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <h3 class="text-2xl font-[800] italic uppercase tracking-tighter mb-4 leading-none"
            class:text-white={theme === 'dark'}
            class:text-slate-900={theme === 'light'}>Тургэн оонньуу</h3>
        <p class="text-xs text-slate-500 italic mb-8">Доҕотторуҥ эбэтэр атын дьоннору кытта оонньон саҕылаа</p>
        <button on:click={createRoom} class="w-full bg-white text-black py-5 rounded-2xl text-[11px] font-[800] uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all">Лобби оноруута</button>
      </div>
    </div>
  </div>
</main>

{:else if gameState === 'waiting'}
<div class="flex items-center justify-center flex-1 px-4">
  <div class="premium-border p-10 rounded-[40px] max-w-lg w-full text-center">
    <h2 class="font-[800] italic text-xl mb-2 uppercase tracking-tighter"
        class:text-white={theme === 'dark'}
        class:text-slate-900={theme === 'light'}>Хос: {currentRoom}</h2>
    <p class="text-[9px] mono text-slate-600 uppercase tracking-[0.3em] italic mb-8">Дьоннору куутэ турабыт...</p>
    <div class="space-y-3 mb-8">
      {#each Object.entries(players) as [name]}
        <div class="premium-border p-4 rounded-2xl flex items-center justify-between">
          <span class="font-[800] italic"
                class:text-white={theme === 'dark'}
                class:text-slate-900={theme === 'light'}>{name}</span>
          <span class="text-blue-500 mono text-[9px] uppercase italic">Ready</span>
        </div>
      {/each}
    </div>
    <div class="flex gap-3 justify-center">
      <button on:click={startGame} class="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl text-[10px] font-[800] uppercase italic text-white tracking-widest transition-all">Саҕалаа</button>
      <button on:click={leave} class="premium-border px-6 py-3 rounded-xl text-[10px] font-[800] uppercase italic text-slate-500 hover:text-white transition-all">Тахсыы</button>
    </div>
  </div>
</div>

{:else if gameState === 'playing'}
<div class="container mx-auto px-4 sm:px-6 md:px-12 max-w-6xl flex-1 flex flex-col justify-center">
  <div class="text-center mb-8">
    <span class="text-4xl sm:text-5xl font-[800] italic text-blue-500 tracking-tighter mono">{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</span>
  </div>
  <div class="space-y-3 mb-8">
    {#each Object.entries(players) as [name, data]}
      {@const pct = words.length > 0 ? ((data.progress||0)/words.length)*100 : 0}
      <div class="premium-border p-4 rounded-2xl flex items-center gap-4">
        <span class="font-[800] italic text-sm w-20 sm:w-28 truncate"
              class:text-white={theme === 'dark'}
              class:text-slate-900={theme === 'light'}>{name}</span>
        <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-[0_0_10px_#2563eb]" style="width:{pct}%"></div></div>
        <span class="text-blue-500 mono font-[800] italic text-sm w-16 sm:w-20 text-right">{data.wpm||0}</span>
      </div>
    {/each}
  </div>
  <div class="mono text-2xl sm:text-3xl leading-relaxed select-none"
       class:text-slate-700={theme === 'dark'}
       class:text-slate-400={theme === 'light'}>
    {#each words as word, i}
      <span class="inline-block mr-[0.4em] leading-[1.7]"
            class:text-white={i<currentWordIndex && theme === 'dark'}
            class:text-slate-900={i<currentWordIndex && theme === 'light'}
            class:font-[800]={i<currentWordIndex}>
        {#if i===currentWordIndex}{#each word.split('') as char,ci}<span class="{ci<currentInput.length?(currentInput[ci]===char?(theme === 'dark' ? 'text-white font-[800]' : 'text-slate-900 font-[800]'):'text-red-500 border-b-2 border-red-500'):(theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}">{char}</span>{/each}{#if currentInput.length>word.length}<span class="text-yellow-500 line-through">{currentInput.slice(word.length)}</span>{/if}{:else}{word}{/if}
      </span>
    {/each}
  </div>
</div>

{:else if gameState === 'finished'}
<div class="flex items-center justify-center flex-1">
  <div class="text-center max-w-lg w-full animate-fade-in">
    <div class="inline-flex items-center gap-4 mb-4 px-6 py-2 rounded-full border border-blue-500/30 bg-blue-600/10">
      <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7m12-3h1.5a2.5 2.5 0 0 1 0 5H18s0-3-2.5-5M12 14l-3.5 5h7z"/></svg>
      <span class="text-[10px] mono font-[800] tracking-[0.5em] text-blue-400 uppercase">Match_Results</span>
    </div>
    <h1 class="text-7xl font-[800] italic tracking-tighter uppercase leading-none text-white mb-8">
      {winner === user.username ? 'WINNER' : winner}
    </h1>
    <div class="space-y-3 mb-8">
      {#each Object.entries(results).sort((a,b)=>(b[1].wpm||0)-(a[1].wpm||0)) as [name,data],i}
        <div class="premium-border p-4 rounded-2xl flex items-center justify-between {name===winner?'border-blue-500/30 bg-blue-600/[0.03]':''}">
          <div class="flex items-center gap-3">
            <span class="mono text-xs text-slate-500">#{i+1}</span>
            <span class="text-white font-[800] italic">{name}</span>
          </div>
          <span class="text-blue-500 font-[800] italic">{data.wpm||0} WPM</span>
        </div>
      {/each}
    </div>
    <button on:click={leave} class="px-12 py-5 bg-white text-black rounded-[20px] font-[800] uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all">Play Again</button>
  </div>
</div>
{/if}

<Footer />
</div>
