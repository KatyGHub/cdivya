/**
 * crossword.js — KNOW YOUR PEOPLE v3
 * Full names · 4 shuffled layouts · shuffled hints each game
 * Lives · streak · timer · reveal animation · hard mode
 */

// ─── People ────────────────────────────────────────────────────────────────────
// crossword key → { display name, emoji, hints[] }
const PEOPLE = {
  KAARTHIK:    { name:'Kaarthik',     emoji:'🧢', hints:['Theevira Vijay Kanni (TVK)', 'EJ Keerthana', 'Fake Malayali'] },
  VARSHINII:   { name:'Varshinii',    emoji:'✨', hints:['SASTRA', 'The Unexpected Varshini', 'Chintu'] },
  VACHU:       { name:'Vachu',        emoji:'🍳', hints:['Unekenapa', 'Atthipatti', 'Harish P', 'Jukebox', 'Stove Off Pannava'] },
  ARUN:        { name:'Arun',         emoji:'🏀', hints:['Basketball', 'Panamaram'] },
  NIVETHA:     { name:'Nivetha',      emoji:'🦸', hints:['V Pose', 'The Rock', 'Harish P', 'Batman', 'K-Culture President'] },
  HARSHA:      { name:'Harsha',       emoji:'🎬', hints:['Punctuality Ku Per Ponava', 'Marijuana', 'Tamil Movie/Song Knowledge In Peak'] },
  HARISH:      { name:'Harish',       emoji:'🌾', hints:['Farmer', 'Towel Shirt Lover', 'Ann', 'Jukebox'] },
  HARIKRISHNA: { name:'Hari Krishna', emoji:'🙏', hints:['Mothers Blessings', "Need Wife Who Doesn't Put Makeup", 'Murugan Idly'] },
  MALAVIKAA:   { name:'Malavikaa',    emoji:'🔋', hints:['AA Battery Coz She Has 2 As', 'German Resident Acc To Insta', 'United By Blood'] },
  YESHU:       { name:'Yeshu',        emoji:'✈️', hints:['Canada', 'Bro Unites North And South', 'Cd', 'Rishi', 'SHAHID SAFIULLA'] },
  NISHI:       { name:'Nishi',        emoji:'👑', hints:['Group Oda Mother', 'SHAHID SAFIULLA', 'Meesaiya Murukku'] },
  JEFFREY:     { name:'Jeffrey',      emoji:'⛪', hints:['Church', 'Kusu', 'Robo Shankar', 'Muscat'] },
  JASHWANTH:   { name:'Jashwanth',    emoji:'🎥', hints:['Mla', 'Future Movie Star', 'Future AP CM'] },
  ADITINAG:    { name:'Aditi Nag',    emoji:'📞', hints:['Divs', 'Can We Connect Quickly On Your Leave?', 'Paithyakari'] },
  GOBI:        { name:'Gobi',         emoji:'🗿', hints:['Spartan', 'Tribal Dance', 'Pudhu Maapillai'] },
  DEEPTHI:     { name:'Deepthi',      emoji:'🎉', hints:['Ayyyyyyyyy', 'SHAHID SAFIULLA', 'Shrivanth', 'Vishnu', 'Gopi'] },
};

// ─── 4 pre-computed valid layouts (26×26 grid) ─────────────────────────────────
const LAYOUTS = [
  // Layout 0 (seed 1) — verified no adjacency bugs
  [
    {word:'HARIKRISHNA',row:14,col:8, dir:'H'},
    {word:'VARSHINII',  row:13,col:18,dir:'V'},
    {word:'MALAVIKAA',  row:7, col:9, dir:'V'},
    {word:'JASHWANTH',  row:16,col:16,dir:'H'},
    {word:'KAARTHIK',   row:14,col:21,dir:'V'},
    {word:'ADITINAG',   row:12,col:11,dir:'V'},
    {word:'NIVETHA',    row:18,col:17,dir:'H'},
    {word:'JEFFREY',    row:10,col:13,dir:'V'},
    {word:'DEEPTHI',    row:21,col:12,dir:'H'},
    {word:'HARSHA',     row:18,col:10,dir:'H'},
    {word:'HARISH',     row:8, col:8, dir:'H'},
    {word:'VACHU',      row:13,col:24,dir:'V'},
    {word:'YESHU',      row:20,col:14,dir:'V'},
    {word:'NISHI',      row:4, col:11,dir:'V'},
    {word:'ARUN',       row:24,col:12,dir:'H'},
    {word:'GOBI',       row:12,col:6, dir:'H'},
  ],
  // Layout 1 (seed 2)
  [
    {word:'HARIKRISHNA',row:14,col:8, dir:'H'},
    {word:'VARSHINII',  row:6, col:14,dir:'V'},
    {word:'MALAVIKAA',  row:7, col:6, dir:'H'},
    {word:'JASHWANTH',  row:9, col:9, dir:'V'},
    {word:'KAARTHIK',   row:7, col:12,dir:'V'},
    {word:'ADITINAG',   row:10,col:3, dir:'H'},
    {word:'NIVETHA',    row:9, col:5, dir:'V'},
    {word:'JEFFREY',    row:12,col:0, dir:'H'},
    {word:'DEEPTHI',    row:17,col:4, dir:'H'},
    {word:'HARSHA',     row:2, col:7, dir:'V'},
    {word:'HARISH',     row:14,col:16,dir:'V'},
    {word:'VACHU',      row:19,col:13,dir:'H'},
    {word:'YESHU',      row:16,col:6, dir:'V'},
    {word:'NISHI',      row:17,col:15,dir:'H'},
    {word:'ARUN',       row:20,col:4, dir:'H'},
    {word:'GOBI',       row:4, col:11,dir:'V'},
  ],
  // Layout 2 (seed 3)
  [
    {word:'HARIKRISHNA',row:14,col:8, dir:'H'},
    {word:'VARSHINII',  row:10,col:16,dir:'V'},
    {word:'MALAVIKAA',  row:10,col:12,dir:'H'},
    {word:'JASHWANTH',  row:5, col:19,dir:'V'},
    {word:'KAARTHIK',   row:12,col:9, dir:'V'},
    {word:'ADITINAG',   row:18,col:7, dir:'H'},
    {word:'NIVETHA',    row:6, col:13,dir:'H'},
    {word:'JEFFREY',    row:5, col:19,dir:'H'},
    {word:'DEEPTHI',    row:2, col:17,dir:'V'},
    {word:'HARSHA',     row:13,col:19,dir:'H'},
    {word:'HARISH',     row:8, col:23,dir:'V'},
    {word:'VACHU',      row:17,col:7, dir:'V'},
    {word:'YESHU',      row:21,col:3, dir:'H'},
    {word:'NISHI',      row:8, col:16,dir:'H'},
    {word:'ARUN',       row:14,col:18,dir:'V'},
    {word:'GOBI',       row:11,col:11,dir:'V'},
  ],
  // Layout 3 (seed 4)
  [
    {word:'HARIKRISHNA',row:14,col:8, dir:'H'},
    {word:'VARSHINII',  row:6, col:14,dir:'V'},
    {word:'MALAVIKAA',  row:7, col:18,dir:'V'},
    {word:'JASHWANTH',  row:6, col:16,dir:'V'},
    {word:'KAARTHIK',   row:9, col:8, dir:'V'},
    {word:'ADITINAG',   row:10,col:2, dir:'H'},
    {word:'NIVETHA',    row:13,col:11,dir:'V'},
    {word:'JEFFREY',    row:12,col:4, dir:'H'},
    {word:'DEEPTHI',    row:4, col:6, dir:'V'},
    {word:'HARSHA',     row:19,col:6, dir:'H'},
    {word:'HARISH',     row:9, col:2, dir:'V'},
    {word:'VACHU',      row:16,col:6, dir:'V'},
    {word:'YESHU',      row:20,col:2, dir:'H'},
    {word:'NISHI',      row:6, col:4, dir:'V'},
    {word:'ARUN',       row:15,col:18,dir:'H'},
    {word:'GOBI',       row:11,col:11,dir:'H'},
  ],
];

// ─── Constants ─────────────────────────────────────────────────────────────────
const GRID_SIZE   = 28;
const TIME_NORMAL = 30;
const TIME_HARD   = 18;

// ─── State ─────────────────────────────────────────────────────────────────────
let gameLayout   = [];
let answerGrid   = [];
let playerGrid   = [];
let wordHints    = {};
let wordHintSets = {};  // all shuffled hints per word
let wordHintIdx  = {};  // current hint index per word
let wordStatus   = {};   // 'unsolved' | 'correct' | 'failed'
let activeWord   = null;
let activeInput  = '';
let lives        = 5;
let score        = 0;
let streak       = 0;
let timeLeft     = 0;
let timerID      = null;
let hardMode     = false;
let rootEl       = null;
let modalOpen    = false;
let solvedOrder  = [];   // track order of solves for reveal card

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=~~(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}
function getMultiplier() {
  return streak>=8?4:streak>=5?3:streak>=3?2:1;
}
function getBounds(layout) {
  let minR=GRID_SIZE,maxR=0,minC=GRID_SIZE,maxC=0;
  for(const {word,row,col,dir} of layout){
    const er=dir==='V'?row+word.length-1:row, ec=dir==='H'?col+word.length-1:col;
    minR=Math.min(minR,row);maxR=Math.max(maxR,er);minC=Math.min(minC,col);maxC=Math.max(maxC,ec);
  }
  return {minR:Math.max(0,minR-1),maxR:Math.min(GRID_SIZE-1,maxR+1),minC:Math.max(0,minC-1),maxC:Math.min(GRID_SIZE-1,maxC+1)};
}

// ─── Grid logic ─────────────────────────────────────────────────────────────────
function buildAnswerGrid(layout) {
  const g=Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(null));
  for(const {word,row,col,dir} of layout)
    for(let i=0;i<word.length;i++) {
      const r=dir==='V'?row+i:row, c=dir==='H'?col+i:col;
      if(r<GRID_SIZE&&c<GRID_SIZE) g[r][c]=word[i];
    }
  return g;
}

function numberWords(layout) {
  const sorted=[...layout].sort((a,b)=>a.row!==b.row?a.row-b.row:a.col-b.col);
  const map=new Map(); let n=1;
  const out=[];
  for(const e of sorted){
    const k=`${e.row},${e.col}`;
    if(!map.has(k)) map.set(k,n++);
    out.push({...e,num:map.get(k)});
  }
  return out;
}

// ─── Build UI ──────────────────────────────────────────────────────────────────
function buildUI(bounds) {
  const {minR,maxR,minC,maxC}=bounds;
  const rows=maxR-minR+1, cols=maxC-minC+1;
  const numbered=numberWords(gameLayout);
  const numMap={};
  for(const {row,col,num} of numbered) numMap[`${row},${col}`]=num;

  // Grid HTML
  let gridHTML='';
  for(let r=minR;r<=maxR;r++){
    for(let c=minC;c<=maxC;c++){
      const letter=answerGrid[r]?.[c];
      if(!letter){
        gridHTML+=`<div class="cw3-cell cw3-void"></div>`;
      } else {
        const num=numMap[`${r},${c}`];
        gridHTML+=`
          <div class="cw3-cell cw3-tile" data-r="${r}" data-c="${c}" tabindex="0">
            ${num?`<span class="cw3-num">${num}</span>`:''}
            <span class="cw3-glyph" data-r="${r}" data-c="${c}"></span>
          </div>`;
      }
    }
  }

  // Clue lists
  const across=numbered.filter(e=>e.dir==='H').sort((a,b)=>a.num-b.num);
  const down  =numbered.filter(e=>e.dir==='V').sort((a,b)=>a.num-b.num);

  function clueItem(e) {
    const p=PEOPLE[e.word];
    return `<button class="cw3-clue" data-word="${e.word}" data-num="${e.num}" data-dir="${e.dir}">
      <span class="cw3-cn">${e.num}</span>
      <span class="cw3-ct">${wordHints[e.word]}</span>
      <span class="cw3-cl">${e.word.length}</span>
    </button>`;
  }

  rootEl.innerHTML=`
  <div class="cw3-shell">

    <!-- Header -->
    <div class="cw3-header">
      <div class="cw3-brand">
        <span class="cw3-brand-text">KNOW YOUR PEOPLE</span>
        ${hardMode?'<span class="cw3-hard">HARD 🔥</span>':''}
      </div>
      <div class="cw3-hud">
        <div class="cw3-lives" id="cw3Lives"></div>
        <div class="cw3-stats">
          <div class="cw3-stat"><span id="cw3Score">0</span><small>pts</small></div>
          <div class="cw3-stat"><span id="cw3Streak">0</span><small>🔥</small></div>
          <div class="cw3-stat"><span id="cw3Left">0/${gameLayout.length}</span><small>done</small></div>
        </div>
      </div>

      <!-- Active word bar -->
      <div class="cw3-active-bar" id="cw3ActiveBar">
        <div class="cw3-ab-left">
          <span class="cw3-ab-badge" id="cw3AbBadge"></span>
          <span class="cw3-ab-hint" id="cw3AbHint">← Select a clue or cell to begin</span>
        </div>
        <div class="cw3-ab-right">
          <button class="cw3-hint-cycle" id="cw3HintCycle" title="Different clue">↻</button>
          <span class="cw3-ab-timer" id="cw3AbTimer"></span>
          <div class="cw3-timer-ring" id="cw3TimerRing">
            <svg viewBox="0 0 36 36"><circle class="cw3-ring-bg" cx="18" cy="18" r="15.9"/><circle class="cw3-ring-fill" id="cw3RingFill" cx="18" cy="18" r="15.9"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Body: grid + clues -->
    <div class="cw3-body">
      <div class="cw3-grid-scroll">
        <div class="cw3-grid" id="cw3Grid"
          style="--cw-cols:${cols};--cw-rows:${rows}">
          ${gridHTML}
        </div>
      </div>

      <div class="cw3-sidebar">
        <div class="cw3-clue-group">
          <div class="cw3-cg-head">ACROSS →</div>
          <div class="cw3-cg-list" id="cw3Across">${across.map(clueItem).join('')}</div>
        </div>
        <div class="cw3-clue-group">
          <div class="cw3-cg-head">DOWN ↓</div>
          <div class="cw3-cg-list" id="cw3Down">${down.map(clueItem).join('')}</div>
        </div>
      </div>
    </div>

    <!-- Overlays -->
    <div class="cw3-flash" id="cw3Flash" aria-live="assertive"></div>
    <div class="cw3-combo" id="cw3Combo"></div>
    <div class="cw3-reveal-card" id="cw3RevealCard"></div>
    <div class="cw3-endpanel" id="cw3End"></div>
  </div>`;

  // Wire hint cycle button
  rootEl.querySelector('#cw3HintCycle')?.addEventListener('click', () => {
    if (activeWord) cycleHint(activeWord);
  });

  // Wire grid cell clicks
  rootEl.querySelectorAll('.cw3-tile').forEach(cell=>{
    cell.addEventListener('click',()=>{
      const r=+cell.dataset.r, c=+cell.dataset.c;
      onCellClick(r,c);
    });
  });
  // Wire clue clicks
  rootEl.querySelectorAll('.cw3-clue').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const entry=gameLayout.find(e=>e.word===btn.dataset.word);
      if(entry) startWord(entry);
    });
  });

  updateHUD();
}

// ─── Cell click ────────────────────────────────────────────────────────────────
function onCellClick(r,c) {
  const hits=gameLayout.filter(({word,row,col,dir})=>
    dir==='H'?r===row&&c>=col&&c<col+word.length:c===col&&r>=row&&r<row+word.length
  ).filter(e=>wordStatus[e.word]!=='correct');
  if(!hits.length) return;
  // Toggle between H and V if two words share this cell
  if(hits.length===2&&activeWord===hits[0].word) startWord(hits[1]);
  else startWord(hits[0]);
}

// ─── Start word ────────────────────────────────────────────────────────────────
function startWord(entry) {
  if(wordStatus[entry.word]==='correct') return;
  activeWord=entry.word; activeInput='';
  stopTimer();
  startTimer(entry);
  highlightWord(entry);
  updateActiveBar(entry);
  renderWordInput(entry);
}

function cycleHint(word) {
  const hints = wordHintSets[word];
  if (!hints || hints.length <= 1) return;
  wordHintIdx[word] = (wordHintIdx[word] + 1) % hints.length;
  wordHints[word]   = hints[wordHintIdx[word]];
  // Update active bar if this is the active word
  const entry = gameLayout.find(e => e.word === word);
  if (entry && activeWord === word) updateActiveBar(entry);
  // Update clue list
  const clueText = rootEl?.querySelector(`.cw3-clue[data-word="${word}"] .cw3-ct`);
  if (clueText) clueText.textContent = wordHints[word];
}

function updateActiveBar(entry) {
  const p=PEOPLE[entry.word];
  const numbered=numberWords(gameLayout);
  const num=numbered.find(e=>e.word===entry.word)?.num||'?';
  const badge=rootEl.querySelector('#cw3AbBadge');
  const hint=rootEl.querySelector('#cw3AbHint');
  if(badge) badge.textContent=`${num} ${entry.dir==='H'?'→':'↓'} (${entry.word.length} letters)`;
  if(hint)  hint.textContent=wordHints[entry.word]||'—';
}

// ─── Highlight ─────────────────────────────────────────────────────────────────
function highlightWord(entry) {
  rootEl.querySelectorAll('.cw3-tile').forEach(t=>{
    t.classList.remove('cw3-active','cw3-active-cursor');
  });
  rootEl.querySelectorAll('.cw3-clue').forEach(b=>b.classList.remove('cw3-clue-active'));
  if(!entry) return;
  const {word,row,col,dir}=entry;
  for(let i=0;i<word.length;i++){
    const r=dir==='V'?row+i:row, c=dir==='H'?col+i:col;
    const tile=rootEl.querySelector(`.cw3-tile[data-r="${r}"][data-c="${c}"]`);
    if(tile){
      tile.classList.add('cw3-active');
      if(i===activeInput.length) tile.classList.add('cw3-active-cursor');
    }
  }
  const btn=rootEl.querySelector(`.cw3-clue[data-word="${entry.word}"]`);
  if(btn){btn.classList.add('cw3-clue-active');btn.scrollIntoView({block:'nearest',behavior:'smooth'});}
}

// ─── Render typed letters ───────────────────────────────────────────────────────
function renderWordInput(entry) {
  if(!entry) return;
  const {word,row,col,dir}=entry;
  for(let i=0;i<word.length;i++){
    const r=dir==='V'?row+i:row, c=dir==='H'?col+i:col;
    const g=rootEl.querySelector(`.cw3-glyph[data-r="${r}"][data-c="${c}"]`);
    if(!g) continue;
    // Already solved cells
    if(playerGrid[r]?.[c]){
      g.textContent=playerGrid[r][c]; g.dataset.s='ok'; continue;
    }
    if(i<activeInput.length){
      g.textContent=activeInput[i]; g.dataset.s='typed';
    } else {
      g.textContent=''; g.dataset.s='';
    }
  }
  // Re-highlight cursor position
  highlightWord(entry);
}

// ─── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(entry) {
  timeLeft=hardMode?TIME_HARD:TIME_NORMAL;
  tickTimer(entry);
  timerID=setInterval(()=>{
    timeLeft--;
    tickTimer(entry);
    if(timeLeft<=0){stopTimer();onTimeUp(entry);}
  },1000);
}
function stopTimer(){clearInterval(timerID);timerID=null;}
function tickTimer(entry){
  const max=hardMode?TIME_HARD:TIME_NORMAL;
  const pct=timeLeft/max;
  const el=rootEl?.querySelector('#cw3AbTimer');
  const ring=rootEl?.querySelector('#cw3RingFill');
  if(el){el.textContent=timeLeft;el.dataset.u=timeLeft<=5?'critical':timeLeft<=10?'warn':'ok';}
  if(ring){
    const c=2*Math.PI*15.9;
    ring.style.strokeDasharray=`${c*pct} ${c*(1-pct)}`;
    ring.style.stroke=timeLeft<=5?'var(--rose)':timeLeft<=10?'var(--amber)':'var(--mint)';
  }
}
function onTimeUp(entry){
  streak=0; loseLife(entry,'⏱ Time\'s up!');
  if(lives>0){activeInput='';renderWordInput(entry);advanceWord(entry);}
}

// ─── Key handler ───────────────────────────────────────────────────────────────
function handleKey(e){
  if(!modalOpen||!activeWord) return;
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  const entry=gameLayout.find(w=>w.word===activeWord);
  if(!entry) return;

  if(e.key==='Escape'){activeWord=null;highlightWord(null);stopTimer();return;}
  if(e.key==='Tab'){e.preventDefault();advanceWord(entry);return;}
  if(e.key==='Backspace'){
    e.preventDefault();
    activeInput=activeInput.slice(0,-1);
    renderWordInput(entry);
    return;
  }
  if(/^[a-zA-Z]$/.test(e.key)){
    e.preventDefault();
    if(activeInput.length>=entry.word.length) return;
    const ch=e.key.toUpperCase();
    activeInput+=ch;
    renderWordInput(entry);

    // Per-letter flash feedback
    const idx=activeInput.length-1;
    const correct=entry.word[idx];
    flashCell(entry,idx,ch===correct?'hit':'miss');
    if(ch!==correct){
      streak=0; loseLife(entry,'✗ Wrong letter!');
      if(lives>0){
        // Remove the wrong letter after brief pause
        setTimeout(()=>{
          activeInput=activeInput.slice(0,-1);
          renderWordInput(entry);
        },350);
      }
    } else if(activeInput.length===entry.word.length){
      setTimeout(()=>checkWord(entry),200);
    }
  }
}

function flashCell(entry,idx,type){
  const {row,col,dir}=entry;
  const r=dir==='V'?row+idx:row, c=dir==='H'?col+idx:col;
  const tile=rootEl?.querySelector(`.cw3-tile[data-r="${r}"][data-c="${c}"]`);
  tile?.classList.add(`cw3-${type}`);
  setTimeout(()=>tile?.classList.remove(`cw3-${type}`),320);
}

function loseLife(entry,msg){
  lives=Math.max(0,lives-1);
  updateHUD();
  flash(msg,'error');
  // Shake the whole word
  const {word,row,col,dir}=entry;
  for(let i=0;i<word.length;i++){
    const r=dir==='V'?row+i:row, c=dir==='H'?col+i:col;
    const tile=rootEl?.querySelector(`.cw3-tile[data-r="${r}"][data-c="${c}"]`);
    setTimeout(()=>{tile?.classList.add('cw3-shake');setTimeout(()=>tile?.classList.remove('cw3-shake'),550);},i*30);
  }
  if(lives===0) setTimeout(()=>endGame(false),600);
}

// ─── Check word ─────────────────────────────────────────────────────────────────
function checkWord(entry){
  const {word,row,col,dir}=entry;
  if(activeInput!==word) return; // shouldn't reach here but guard
  stopTimer();
  wordStatus[word]='correct';
  streak++;
  const bonus=Math.max(1,timeLeft)*8*getMultiplier();
  score+=100+bonus;
  // Write to playerGrid
  for(let i=0;i<word.length;i++){
    const r=dir==='V'?row+i:row, c=dir==='H'?col+i:col;
    if(!playerGrid[r]) playerGrid[r]=[];
    playerGrid[r][c]=word[i];
  }
  renderWordInput(entry);
  solvedOrder.push(word);

  // Flash solved tiles
  for(let i=0;i<word.length;i++){
    const r=dir==='V'?row+i:row, c=dir==='H'?col+i:col;
    const tile=rootEl?.querySelector(`.cw3-tile[data-r="${r}"][data-c="${c}"]`);
    setTimeout(()=>{
      tile?.classList.add('cw3-solved');
      rootEl?.querySelector(`.cw3-glyph[data-r="${r}"][data-c="${c}"]`)?.setAttribute('data-s','ok');
    },i*50);
  }

  // Show combo
  if(getMultiplier()>1){
    const el=rootEl?.querySelector('#cw3Combo');
    if(el){el.textContent=`×${getMultiplier()} COMBO  +${bonus}pts`;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2000);}
  }

  // Show reveal card for this person
  showRevealCard(word, entry);

  updateHUD();
  updateClueState(word);

  const unsolved=gameLayout.filter(e=>wordStatus[e.word]!=='correct');
  if(!unsolved.length){
    setTimeout(()=>endGame(true),1800);
  } else {
    setTimeout(()=>advanceWord(entry),1400);
  }
}

// ─── Reveal card ────────────────────────────────────────────────────────────────
function showRevealCard(word, entry) {
  const p=PEOPLE[word];
  if(!p) return;
  const el=rootEl?.querySelector('#cw3RevealCard');
  if(!el) return;
  el.innerHTML=`
    <div class="cw3-rc-inner">
      <span class="cw3-rc-emoji">${p.emoji}</span>
      <div class="cw3-rc-name">${p.name}</div>
      <div class="cw3-rc-clue">"${wordHints[word]}"</div>
    </div>`;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1300);
}

// ─── Advance to next word ───────────────────────────────────────────────────────
function advanceWord(current){
  const numbered=numberWords(gameLayout);
  const unsolved=numbered.filter(e=>wordStatus[e.word]!=='correct');
  if(!unsolved.length) return;
  const ci=unsolved.findIndex(e=>e.word===current?.word);
  startWord(unsolved[(ci+1)%unsolved.length]);
}

// ─── HUD ────────────────────────────────────────────────────────────────────────
function updateHUD(){
  const lv=rootEl?.querySelector('#cw3Lives');
  if(lv) lv.innerHTML=Array.from({length:5},(_,i)=>
    `<span class="cw3-heart${i<lives?'':' lost'}">♥</span>`).join('');
  const sv=rootEl?.querySelector('#cw3Score');   if(sv) sv.textContent=score;
  const st=rootEl?.querySelector('#cw3Streak');  if(st) st.textContent=streak;
  const done=Object.values(wordStatus).filter(s=>s==='correct').length;
  const lf=rootEl?.querySelector('#cw3Left'); if(lf) lf.textContent=`${done}/${gameLayout.length}`;
}

function updateClueState(word){
  const btn=rootEl?.querySelector(`.cw3-clue[data-word="${word}"]`);
  btn?.classList.add('cw3-clue-done');
}

function flash(msg,type='error'){
  const el=rootEl?.querySelector('#cw3Flash');
  if(!el) return;
  el.textContent=msg; el.dataset.type=type; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),1600);
}

// ─── End game ──────────────────────────────────────────────────────────────────
function endGame(won){
  stopTimer();
  activeWord=null; highlightWord(null);
  if(!won){
    // Reveal all unsolved
    for(const e of gameLayout){
      if(wordStatus[e.word]!=='correct'){
        const p=PEOPLE[e.word];
        for(let i=0;i<e.word.length;i++){
          const r=e.dir==='V'?e.row+i:e.row, c=e.dir==='H'?e.col+i:e.col;
          const g=rootEl?.querySelector(`.cw3-glyph[data-r="${r}"][data-c="${c}"]`);
          if(g){g.textContent=e.word[i];g.dataset.s='revealed';}
        }
      }
    }
  } else {
    fireConfetti();
  }

  const solved=Object.values(wordStatus).filter(s=>'correct').length;
  const el=rootEl?.querySelector('#cw3End');
  if(!el) return;
  el.innerHTML=`
    <div class="cw3-ep">
      <div class="cw3-ep-icon">${won?'🎉':'💀'}</div>
      <div class="cw3-ep-title">${won?'YOU KNOW YOUR PEOPLE!':'BETTER LUCK NEXT TIME'}</div>
      <div class="cw3-ep-score">Score: <strong>${score}</strong></div>
      <div class="cw3-ep-sub">${won?`All ${gameLayout.length} friends found!`:`${solvedOrder.length} / ${gameLayout.length} found`}</div>
      ${won?`<div class="cw3-ep-order">${solvedOrder.map(w=>`<span title="${PEOPLE[w]?.name}">${PEOPLE[w]?.emoji}</span>`).join(' ')}</div>`:''}
      <div class="cw3-ep-btns">
        <button class="btn btn-primary" id="cw3Again">Play Again</button>
        <button class="btn btn-ghost" id="cw3Toggle">${hardMode?'Normal Mode':'Hard Mode 🔥'}</button>
      </div>
    </div>`;
  el.classList.add('show');
  el.querySelector('#cw3Again')?.addEventListener('click',()=>{el.classList.remove('show');initGame();});
  el.querySelector('#cw3Toggle')?.addEventListener('click',()=>{hardMode=!hardMode;el.classList.remove('show');initGame();});
}

// ─── Confetti ──────────────────────────────────────────────────────────────────
function fireConfetti(){
  const cv=document.createElement('canvas');
  cv.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9999';
  document.body.appendChild(cv);
  const ctx=cv.getContext('2d');
  cv.width=innerWidth;cv.height=innerHeight;
  const C=['#00FFBD','#FF2D55','#BF5FFF','#FFB800','#FF8C42','#fff'];
  const pts=Array.from({length:130},()=>({x:Math.random()*cv.width,y:-30-Math.random()*100,vx:(Math.random()-.5)*8,vy:Math.random()*3+2,rot:Math.random()*360,spin:(Math.random()-.5)*12,w:Math.random()*12+5,h:Math.random()*6+3,color:C[~~(Math.random()*C.length)]}));
  let alive=true;
  setTimeout(()=>{alive=false;setTimeout(()=>cv.remove(),500);},3200);
  (function f(){if(!alive)return;ctx.clearRect(0,0,cv.width,cv.height);for(const p of pts){p.x+=p.vx;p.y+=p.vy;p.vy+=0.07;p.rot+=p.spin;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,1-p.y/cv.height*1.3);ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}requestAnimationFrame(f);})();
}

// ─── Init game ─────────────────────────────────────────────────────────────────
function initGame(){
  gameLayout=LAYOUTS[~~(Math.random()*LAYOUTS.length)];
  wordHints={}; wordStatus={}; solvedOrder=[];
  for(const {word} of gameLayout){
    const hints = PEOPLE[word]?.hints || ['Who is this?'];
    wordHintSets[word] = shuffle([...hints]);
    wordHintIdx[word]  = 0;
    wordHints[word]    = wordHintSets[word][0];
    wordStatus[word]   = 'unsolved';
  }
  answerGrid=buildAnswerGrid(gameLayout);
  playerGrid=Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(null));
  activeWord=null; activeInput='';
  lives=hardMode?3:5; score=0; streak=0;

  buildUI(getBounds(gameLayout));

  // Auto-start first word
  setTimeout(()=>{
    const first=numberWords(gameLayout).sort((a,b)=>a.num-b.num).find(e=>wordStatus[e.word]!=='correct');
    if(first) startWord(first);
  },400);
}

// ─── Export ─────────────────────────────────────────────────────────────────────
export function initCrossword(){
  const card    =document.getElementById('openCrosswordCard');
  const modal   =document.getElementById('crosswordModal');
  const closeBtn=document.getElementById('crosswordClose');
  const overlay =modal?.querySelector('.modal-overlay');
  const content =document.getElementById('crosswordContent');
  if(!card||!modal||!content) return;

  function open(){
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    modalOpen=true; rootEl=content;
    initGame();
    document.addEventListener('keydown',handleKey);
  }
  function close(){
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    document.body.style.overflow=''; modalOpen=false;
    stopTimer();
    document.removeEventListener('keydown',handleKey);
  }
  card.addEventListener('click',open);
  card.querySelector('.gc-btn')?.addEventListener('click',e=>{e.stopPropagation();open();});
  closeBtn?.addEventListener('click',close);
  overlay?.addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close();});
}
