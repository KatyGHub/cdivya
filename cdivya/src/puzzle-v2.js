/**
 * puzzle-v2.js — Immersive image-tile sliding puzzle
 * Tiles show slices of generated artwork · shake on bad move · audio · drama on win
 */

const SIZE  = 4;
const TOTAL = SIZE * SIZE;

// ── Artwork generator ─────────────────────────────────────────────────────────
const ARTWORKS = [
  { name: "Divya's Palette",  fn: paintPalette  },
  { name: 'Neon Bloom',       fn: paintNeonBloom },
  { name: 'Aurora Borealis',  fn: paintAurora    },
];
let artIndex = 0;

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function paintPalette(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0,   '#FF2D55');
  g.addColorStop(0.3, '#BF5FFF');
  g.addColorStop(0.6, '#00FFBD');
  g.addColorStop(1,   '#FF8C42');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const rng = mulberry32(42);
  for (let i = 0; i < 18; i++) {
    const cx = rng()*w, cy = rng()*h, r = 30+rng()*120;
    const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0, `rgba(255,255,255,${0.08+rng()*0.14})`);
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  }
}

function paintNeonBloom(ctx, w, h) {
  ctx.fillStyle = '#08080f'; ctx.fillRect(0,0,w,h);
  const rng = mulberry32(99);
  const cols = ['#FF2D55','#BF5FFF','#00FFBD','#FFB800','#FF8C42'];
  for (let i = 0; i < 12; i++) {
    const cx=rng()*w, cy=rng()*h, r=60+rng()*180, col=cols[i%cols.length];
    const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0, col+'cc'); cg.addColorStop(0.4, col+'44'); cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  }
}

function paintAurora(ctx, w, h) {
  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#0d0221'); g.addColorStop(0.5,'#0b3d2e'); g.addColorStop(1,'#1a0533');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const rng = mulberry32(7);
  [{col:'#00FFBD',y:h*.4,amp:70},{col:'#BF5FFF',y:h*.55,amp:90},{col:'#00FFBD',y:h*.7,amp:45}]
  .forEach(({col,y,amp}) => {
    ctx.globalAlpha = 0.65;
    for (let x=0; x<=w; x++) {
      const wave = Math.sin(x*0.008 + rng()*6)*amp;
      const cg = ctx.createLinearGradient(x,y+wave-70,x,y+wave+90);
      cg.addColorStop(0,'rgba(0,0,0,0)'); cg.addColorStop(0.35,col+'99'); cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cg; ctx.fillRect(x,0,1,h);
    }
    ctx.globalAlpha=1;
  });
}

function generateArtwork(index) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 640;
  const ctx = cv.getContext('2d');
  ARTWORKS[index % ARTWORKS.length].fn(ctx, 640, 640);
  return cv;
}

function sliceTile(artCanvas, tileIndex) {
  const col = tileIndex % SIZE, row = Math.floor(tileIndex / SIZE);
  const sw = artCanvas.width / SIZE, sh = artCanvas.height / SIZE;
  const cv = document.createElement('canvas');
  cv.width = sw; cv.height = sh;
  cv.getContext('2d').drawImage(artCanvas, col*sw, row*sh, sw, sh, 0, 0, sw, sh);
  return cv.toDataURL();
}

// ── Audio ─────────────────────────────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTick() {
  try {
    const ac=getAudio(), o=ac.createOscillator(), g=ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type='sine';
    o.frequency.setValueAtTime(540, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(740, ac.currentTime+0.05);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.1);
    o.start(); o.stop(ac.currentTime+0.12);
  } catch(e){}
}
function playError() {
  try {
    const ac=getAudio(), o=ac.createOscillator(), g=ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type='sawtooth';
    o.frequency.setValueAtTime(200, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(100, ac.currentTime+0.14);
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.18);
    o.start(); o.stop(ac.currentTime+0.2);
  } catch(e){}
}
function playWin() {
  try {
    const ac=getAudio();
    [523,659,784,1046].forEach((f,i) => {
      const o=ac.createOscillator(), g=ac.createGain();
      o.connect(g); g.connect(ac.destination); o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.14, ac.currentTime+i*0.13);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+i*0.13+0.38);
      o.start(ac.currentTime+i*0.13); o.stop(ac.currentTime+i*0.13+0.45);
    });
  } catch(e){}
}

// ── Taunts ────────────────────────────────────────────────────────────────────
const TAUNTS = [
  "Divya did this in 47 moves. You're at {n}. 🙃",
  "The puzzle is winning. The puzzle knows.",
  "At this rate, Divya will design an entire brand before you finish.",
  "Have you tried looking at the image? Just a thought.",
  "{n} moves. Bold strategy. Let's see if it pays off.",
  "The tiles would like to go home. Please.",
  "Tip: tiles already correct don't need moving. Radical concept.",
  "Fun fact: Divya solved this left-handed. While eating.",
  "{n} moves in and we are... somewhere. Somewhere is a place.",
  "The empty tile is lonely. It waits. It judges.",
];
let tauntIndex = 0;
function getTaunt(moves) {
  const t = TAUNTS[tauntIndex % TAUNTS.length];
  tauntIndex++;
  return t.replace('{n}', moves);
}

// ── Solvability ───────────────────────────────────────────────────────────────
function isSolvable(tiles) {
  let inv = 0;
  const flat = tiles.filter(t=>t!==0);
  for (let i=0;i<flat.length;i++) for (let j=i+1;j<flat.length;j++) if(flat[i]>flat[j]) inv++;
  const emptyRow = SIZE - Math.floor(tiles.indexOf(0)/SIZE);
  return (inv+emptyRow)%2===1;
}
function shuffleTiles() {
  const a = Array.from({length:TOTAL},(_,i)=>i);
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  if (!isSolvable(a)) { const i1=a.indexOf(1),i2=a.indexOf(2); [a[i1],a[i2]]=[a[i2],a[i1]]; }
  return a;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
export function burst(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const COLS=['#FF2D55','#BF5FFF','#00FFBD','#FFB800','#fff','#FF8C42'];
  const pieces = Array.from({length:160},()=>({
    x:Math.random()*canvas.width, y:-20-Math.random()*canvas.height*.5,
    c:COLS[Math.floor(Math.random()*COLS.length)],
    vx:(Math.random()-.5)*5, vy:2+Math.random()*5,
    rot:Math.random()*360, drot:(Math.random()-.5)*7,
    w:5+Math.random()*8, h:9+Math.random()*12, dead:false,
  }));
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=0;
    pieces.forEach(p => {
      if(p.dead) return;
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.13; p.rot+=p.drot;
      if(p.y>canvas.height+20){p.dead=true;return;}
      alive++;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if(alive>0) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

// ── Main export ───────────────────────────────────────────────────────────────
export function initPuzzle() {
  const modal    = document.getElementById('puzzleModal');
  const overlay  = document.getElementById('puzzleOverlay');
  const closeBtn = document.getElementById('puzzleClose');
  const openCard = document.getElementById('openPuzzleCard');
  const shuffBtn = document.getElementById('shuffleBtn');
  const artBtn   = document.getElementById('artBtn');
  const board    = document.getElementById('puzzleBoard');
  const moveEl   = document.getElementById('moveCount');
  const timerEl  = document.getElementById('timerDisplay');
  const hintEl   = document.getElementById('puzzleHint');
  const tauntEl  = document.getElementById('puzzleTaunt');
  const confetti = document.getElementById('confettiCanvas');
  const previewEl= document.getElementById('puzzlePreview');
  const artNameEl= document.getElementById('artName');

  if (!modal||!board) return;

  let tiles=[], moves=0, secs=0, timerID=null, won=false, tauntTID=null;
  let artCanvas=null, slices=[];

  function buildSlices() {
    artCanvas = generateArtwork(artIndex);
    slices = Array.from({length:TOTAL},(_,i) => sliceTile(artCanvas, i));
    if (previewEl) previewEl.style.backgroundImage = `url(${artCanvas.toDataURL()})`;
    if (artNameEl) artNameEl.textContent = ARTWORKS[artIndex%ARTWORKS.length].name;
  }

  const startTimer = () => {
    stopTimer();
    timerID = setInterval(() => {
      secs++;
      if(timerEl) timerEl.textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    },1000);
  };
  const stopTimer = () => { clearInterval(timerID); timerID=null; };

  function scheduleTaunt() {
    clearTimeout(tauntTID);
    if(won) return;
    tauntTID = setTimeout(()=>{
      if(!won&&moves>0&&tauntEl) tauntEl.textContent=getTaunt(moves);
      scheduleTaunt();
    }, 9000+Math.random()*8000);
  }

  function render() {
    board.innerHTML='';
    tiles.forEach((val,idx)=>{
      const t=document.createElement('div');
      t.classList.add('p-tile');
      if(val===0) {
        t.classList.add('p-empty');
      } else {
        const isCorrect = idx===val-1;
        if(isCorrect) t.classList.add('p-correct');
        t.style.backgroundImage=`url(${slices[val-1]})`;
        t.style.backgroundSize='100% 100%';
        const num=document.createElement('span');
        num.classList.add('p-num');
        num.textContent=val;
        t.appendChild(num);
        t.setAttribute('aria-label',`tile ${val}`);
        t.addEventListener('click',()=>tryMove(idx));
      }
      board.appendChild(t);
    });
  }

  function tryMove(idx) {
    if(won) return;
    const ei=tiles.indexOf(0);
    const r=Math.floor(idx/SIZE),c=idx%SIZE,er=Math.floor(ei/SIZE),ec=ei%SIZE;
    const adj=(Math.abs(r-er)===1&&c===ec)||(r===er&&Math.abs(c-ec)===1);
    if(!adj){
      playError();
      board.classList.add('shake');
      setTimeout(()=>board.classList.remove('shake'),400);
      return;
    }
    [tiles[idx],tiles[ei]]=[tiles[ei],tiles[idx]];
    moves++; playTick();
    if(moveEl) moveEl.textContent=moves;
    if(!timerID) startTimer();
    render(); checkWin();
  }

  function checkWin() {
    if(!tiles.every((v,i)=>i===TOTAL-1?v===0:v===i+1)) return;
    won=true; stopTimer(); clearTimeout(tauntTID); playWin();
    board.style.backgroundImage=`url(${artCanvas.toDataURL()})`;
    board.classList.add('p-solved');
    if(tauntEl) tauntEl.textContent=`🎉 Solved in ${moves} moves! Divya's record: 47. ${moves<=47?'She is shook.':'Keep practising.'}`;
    if(hintEl)  hintEl.textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} total time. Respect.`;
    if(confetti) burst(confetti);
  }

  function newGame() {
    stopTimer(); clearTimeout(tauntTID);
    moves=0; secs=0; won=false; tauntIndex=0;
    board.style.backgroundImage=''; board.classList.remove('p-solved');
    if(moveEl)  moveEl.textContent='0';
    if(timerEl) timerEl.textContent='0:00';
    if(hintEl)  hintEl.textContent='';
    if(tauntEl) tauntEl.textContent="Divya's record: 47 moves. Yours: ∞. Arrow keys work too.";
    buildSlices(); tiles=shuffleTiles(); render(); scheduleTaunt();
  }

  document.addEventListener('keydown',(e)=>{
    if(!modal.classList.contains('open')) return;
    const ei=tiles.indexOf(0),er=Math.floor(ei/SIZE),ec=ei%SIZE;
    let t=-1;
    if(e.key==='ArrowUp'   &&er<SIZE-1) t=ei+SIZE;
    if(e.key==='ArrowDown' &&er>0)      t=ei-SIZE;
    if(e.key==='ArrowLeft' &&ec<SIZE-1) t=ei+1;
    if(e.key==='ArrowRight'&&ec>0)      t=ei-1;
    if(t!==-1){e.preventDefault();tryMove(t);}
  });

  const openModal=()=>{newGame();modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';};
  const closeModal=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';stopTimer();clearTimeout(tauntTID);};

  openCard?.addEventListener('click',openModal);
  openCard?.querySelector('.gc-btn')?.addEventListener('click',(e)=>{e.stopPropagation();openModal();});
  closeBtn?.addEventListener('click',closeModal);
  overlay?.addEventListener('click',closeModal);
  shuffBtn?.addEventListener('click',newGame);
  artBtn?.addEventListener('click',()=>{
    artIndex=(artIndex+1)%ARTWORKS.length;
    newGame();
  });
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeModal();});
}
