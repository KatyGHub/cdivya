/**
 * puzzle-v2.js — Funnier, more playful 15-puzzle
 */

const SIZE  = 4;
const TOTAL = SIZE * SIZE;

const TAUNTS = [
  "Divya did this in 47 moves. You're at {n}. 🙃",
  "This is going great. Totally. (It's not.)",
  "At this rate, Divya will finish designing a brand before you finish this.",
  "Have you considered that maybe the puzzle is winning?",
  "Okay, {n} moves. Bold strategy. Let's see if it pays off.",
  "You've made {n} moves. The record is 47. We believe in you. (We don't.)",
  "A moment of silence for move number {n}. It was a brave choice.",
  "Tip: the tiles that are already correct don't need moving. Just saying.",
];

let tauntIndex = 0;

function getTaunt(moves) {
  const t = TAUNTS[tauntIndex % TAUNTS.length];
  tauntIndex++;
  return t.replace('{n}', moves);
}

export function burst(canvas) {
  const ctx  = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const COLS = ['#FF2D55','#BF5FFF','#00FFBD','#FFB800','#fff','#FF8C42'];
  const pieces = Array.from({length:140}, () => ({
    x: Math.random()*canvas.width, y:-20-Math.random()*canvas.height*.5,
    r:3+Math.random()*4, c:COLS[Math.floor(Math.random()*COLS.length)],
    vx:(Math.random()-.5)*4, vy:2+Math.random()*4,
    rot:Math.random()*360, drot:(Math.random()-.5)*6,
    w:4+Math.random()*6, h:8+Math.random()*10, dead:false,
  }));
  let raf;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = 0;
    pieces.forEach(p => {
      if (p.dead) return;
      p.x+=p.vx; p.y+=p.vy; p.vy+=.12; p.rot+=p.drot;
      if (p.y>canvas.height+20) { p.dead=true; return; }
      alive++;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if (alive>0) raf=requestAnimationFrame(draw); else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

function isSolvable(tiles) {
  let inv = 0;
  const flat = tiles.filter(t=>t!==0);
  for (let i=0;i<flat.length;i++) for (let j=i+1;j<flat.length;j++) if (flat[i]>flat[j]) inv++;
  const emptyRow = SIZE - Math.floor(tiles.indexOf(0)/SIZE);
  return (inv+emptyRow)%2===1;
}

function shuffleTiles() {
  const a = Array.from({length:TOTAL},(_,i)=>i);
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  if (!isSolvable(a)) { const i1=a.indexOf(1),i2=a.indexOf(2); [a[i1],a[i2]]=[a[i2],a[i1]]; }
  return a;
}

export function initPuzzle() {
  const modal    = document.getElementById('puzzleModal');
  const overlay  = document.getElementById('puzzleOverlay');
  const closeBtn = document.getElementById('puzzleClose');
  const openCard = document.getElementById('openPuzzleCard');
  const shuffBtn = document.getElementById('shuffleBtn');
  const board    = document.getElementById('puzzleBoard');
  const moveEl   = document.getElementById('moveCount');
  const timerEl  = document.getElementById('timerDisplay');
  const hintEl   = document.getElementById('puzzleHint');
  const tauntEl  = document.getElementById('puzzleTaunt');
  const confetti = document.getElementById('confettiCanvas');

  if (!modal||!board) return;

  let tiles=[],moves=0,secs=0,timerID=null,won=false,tauntTID=null;

  const startTimer = () => {
    stopTimer();
    timerID = setInterval(() => {
      secs++;
      if (timerEl) timerEl.textContent = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    },1000);
  };
  const stopTimer = () => { clearInterval(timerID); timerID=null; };

  function scheduleTaunt() {
    clearTimeout(tauntTID);
    if (won) return;
    tauntTID = setTimeout(() => {
      if (!won && moves>0 && tauntEl) tauntEl.textContent = getTaunt(moves);
      scheduleTaunt();
    }, 8000 + Math.random()*7000);
  }

  function render() {
    board.innerHTML='';
    tiles.forEach((val,idx)=>{
      const t=document.createElement('div');
      t.classList.add('p-tile');
      if (val===0) { t.classList.add('p-empty'); }
      else {
        t.textContent=val;
        t.setAttribute('aria-label',`tile ${val}`);
        if (idx===val-1||(val===TOTAL-1&&idx===TOTAL-1)) t.classList.add('p-correct');
        t.addEventListener('click',()=>tryMove(idx));
      }
      board.appendChild(t);
    });
  }

  function tryMove(idx) {
    if (won) return;
    const ei=tiles.indexOf(0);
    const r=Math.floor(idx/SIZE),c=idx%SIZE,er=Math.floor(ei/SIZE),ec=ei%SIZE;
    if (!((Math.abs(r-er)===1&&c===ec)||(r===er&&Math.abs(c-ec)===1))) return;
    [tiles[idx],tiles[ei]]=[tiles[ei],tiles[idx]];
    moves++;
    if (moveEl) moveEl.textContent=moves;
    if (!timerID) startTimer();
    render();
    checkWin();
  }

  function checkWin() {
    if (!tiles.every((v,i)=>i===TOTAL-1?v===0:v===i+1)) return;
    won=true; stopTimer();
    clearTimeout(tauntTID);
    if (tauntEl) tauntEl.textContent = `🎉 Solved in ${moves} moves! Divya's record: 47. ${moves<=47?"She is shook.":"Keep practising."}`;
    if (hintEl) hintEl.textContent = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} total time. Respect.`;
    if (confetti) burst(confetti);
  }

  function newGame() {
    stopTimer(); clearTimeout(tauntTID);
    moves=0; secs=0; won=false; tauntIndex=0;
    if (moveEl)  moveEl.textContent='0';
    if (timerEl) timerEl.textContent='0:00';
    if (hintEl)  hintEl.textContent='';
    if (tauntEl) tauntEl.textContent="Divya's record: 47 moves. Yours: ∞. Arrow keys work too.";
    tiles=shuffleTiles();
    render();
    scheduleTaunt();
  }

  document.addEventListener('keydown',(e)=>{
    if (!modal.classList.contains('open')) return;
    const ei=tiles.indexOf(0), er=Math.floor(ei/SIZE), ec=ei%SIZE;
    let t=-1;
    if (e.key==='ArrowUp'   &&er<SIZE-1) t=ei+SIZE;
    if (e.key==='ArrowDown' &&er>0)      t=ei-SIZE;
    if (e.key==='ArrowLeft' &&ec<SIZE-1) t=ei+1;
    if (e.key==='ArrowRight'&&ec>0)      t=ei-1;
    if (t!==-1) { e.preventDefault(); tryMove(t); }
  });

  const openModal  = () => { newGame(); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; stopTimer(); clearTimeout(tauntTID); };

  openCard?.addEventListener('click', openModal);
  openCard?.querySelector('.gc-btn')?.addEventListener('click',(e)=>{ e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click',  closeModal);
  shuffBtn?.addEventListener('click', newGame);
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeModal(); });
}
