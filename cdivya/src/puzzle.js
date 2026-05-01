/**
 * puzzle.js
 * Classic 15-tile sliding puzzle with:
 *  - Solvability check
 *  - Move counter + timer
 *  - Confetti burst on win
 *  - Keyboard arrow-key support
 */

const SIZE     = 4;
const TOTAL    = SIZE * SIZE;  // 16 cells, tile values 1-15 + 0 (empty)

// ── Confetti ────────────────────────────────────
function burst(canvas) {
  const ctx  = canvas.getContext('2d');
  const w    = canvas.width  = window.innerWidth;
  const h    = canvas.height = window.innerHeight;
  const COLS = ['#FF2D55','#BF5FFF','#00FFBD','#FFB800','#fff','#FF8C42'];
  const pieces = Array.from({ length: 120 }, () => ({
    x:    Math.random() * w,
    y:    -20 - Math.random() * h * 0.5,
    r:    3 + Math.random() * 4,
    c:    COLS[Math.floor(Math.random() * COLS.length)],
    vx:   (Math.random() - 0.5) * 4,
    vy:   2 + Math.random() * 4,
    rot:  Math.random() * 360,
    drot: (Math.random() - 0.5) * 6,
    wide: 4 + Math.random() * 6,
    tall: 8 + Math.random() * 10,
    dead: false,
  }));

  let raf;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    pieces.forEach(p => {
      if (p.dead) return;
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.12;
      p.rot += p.drot;
      if (p.y > h + 20) { p.dead = true; return; }
      alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.wide / 2, -p.tall / 2, p.wide, p.tall);
      ctx.restore();
    });
    if (alive > 0) raf = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, w, h);
  }

  draw();
}

// ── Solvability ─────────────────────────────────
function isSolvable(tiles) {
  let inv = 0;
  const flat = tiles.filter(t => t !== 0);
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++)
      if (flat[i] > flat[j]) inv++;

  const emptyRow = SIZE - Math.floor(tiles.indexOf(0) / SIZE); // row from bottom (1-indexed)
  // For even-size grids: solvable iff (inversions + empty row from bottom) is odd
  return (inv + emptyRow) % 2 === 1;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Guarantee solvability
  if (!isSolvable(a)) {
    // Swap first two non-empty tiles to flip parity
    const i1 = a.indexOf(1);
    const i2 = a.indexOf(2);
    [a[i1], a[i2]] = [a[i2], a[i1]];
  }
  return a;
}

// ── Puzzle module ────────────────────────────────
export function initPuzzle() {
  const modal     = document.getElementById('puzzleModal');
  const overlay   = document.getElementById('modalOverlay');
  const closeBtn  = document.getElementById('modalClose');
  const openBtn   = document.getElementById('openPuzzle');
  const shuffleBtn= document.getElementById('shuffleBtn');
  const board     = document.getElementById('puzzleBoard');
  const moveEl    = document.getElementById('moveCount');
  const timerEl   = document.getElementById('timerDisplay');
  const hintEl    = document.getElementById('puzzleHint');
  const confCanvas= document.getElementById('confettiCanvas');

  if (!modal || !board) return;

  let tiles   = [];
  let moves   = 0;
  let seconds = 0;
  let timerID = null;
  let won     = false;

  // ── Timer ──
  function startTimer() {
    stopTimer();
    timerID = setInterval(() => {
      seconds++;
      const m = Math.floor(seconds / 60);
      const s = String(seconds % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerID);
    timerID = null;
  }

  function resetStats() {
    moves = 0; seconds = 0; won = false;
    if (moveEl)  moveEl.textContent  = '0';
    if (timerEl) timerEl.textContent = '0:00';
    if (hintEl)  hintEl.textContent  = '';
  }

  // ── Render ──
  function isCorrect(val, idx) {
    if (val === 0) return idx === TOTAL - 1;
    return val === idx + 1;
  }

  function render() {
    if (!board) return;
    board.innerHTML = '';

    tiles.forEach((val, idx) => {
      const tile = document.createElement('div');
      tile.classList.add('p-tile');
      tile.setAttribute('role', 'gridcell');

      if (val === 0) {
        tile.classList.add('p-empty');
        tile.setAttribute('aria-label', 'empty');
      } else {
        tile.textContent = val;
        tile.setAttribute('aria-label', `tile ${val}`);
        if (isCorrect(val, idx)) tile.classList.add('p-correct');
        tile.addEventListener('click', () => tryMove(idx));
      }

      board.appendChild(tile);
    });
  }

  // ── Move logic ──
  function tryMove(idx) {
    if (won) return;
    const emptyIdx = tiles.indexOf(0);
    const r = Math.floor(idx / SIZE),      c = idx % SIZE;
    const er = Math.floor(emptyIdx / SIZE), ec = emptyIdx % SIZE;
    const adj = (Math.abs(r - er) === 1 && c === ec) || (r === er && Math.abs(c - ec) === 1);
    if (!adj) return;

    [tiles[idx], tiles[emptyIdx]] = [tiles[emptyIdx], tiles[idx]];
    moves++;
    if (moveEl) moveEl.textContent = moves;

    if (!timerID) startTimer();

    render();
    checkWin();
  }

  // ── Keyboard support ──
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    const empty = tiles.indexOf(0);
    const er = Math.floor(empty / SIZE), ec = empty % SIZE;
    let target = -1;

    // Arrow moves the EMPTY cell; the tile opposite moves INTO it
    if (e.key === 'ArrowUp'    && er < SIZE - 1) target = empty + SIZE;
    if (e.key === 'ArrowDown'  && er > 0)        target = empty - SIZE;
    if (e.key === 'ArrowLeft'  && ec < SIZE - 1) target = empty + 1;
    if (e.key === 'ArrowRight' && ec > 0)        target = empty - 1;

    if (target !== -1) {
      e.preventDefault();
      tryMove(target);
    }
  });

  // ── Win check ──
  function checkWin() {
    const solved = tiles.every((v, i) => i === TOTAL - 1 ? v === 0 : v === i + 1);
    if (!solved) return;

    won = true;
    stopTimer();

    if (hintEl) {
      const m = String(seconds / 60 | 0).padStart(1,'0');
      const s = String(seconds % 60).padStart(2,'0');
      hintEl.textContent = `🎉 Solved in ${moves} moves & ${m}:${s}! Divya's record: 47 moves.`;
    }

    if (confCanvas) burst(confCanvas);
  }

  // ── New game ──
  function newGame() {
    stopTimer();
    resetStats();
    tiles = shuffle(Array.from({ length: TOTAL }, (_, i) => i));
    render();
  }

  // ── Open / close modal ──
  function openModal() {
    newGame();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    board.focus?.();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopTimer();
  }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  shuffleBtn?.addEventListener('click', newGame);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}
