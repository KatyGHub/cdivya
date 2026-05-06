/**
 * mathgame.js — MAKE 24
 * Four numbers. Any operations. Make exactly 24. Beat the clock.
 * Tap a number → tap an operator → tap another number → they combine.
 * Keep going until one number remains. If it's 24, you win.
 */

// ─── Solver ────────────────────────────────────────────────────────────────────
// Recursive brute-force: can these numbers make 24?
function canMake24(nums) {
  if (nums.length === 1) return Math.abs(nums[0] - 24) < 1e-9;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const rest = nums.filter((_, k) => k !== i && k !== j);
      const a = nums[i], b = nums[j];
      const candidates = [a + b, a - b, b - a, a * b];
      if (Math.abs(b) > 1e-9) candidates.push(a / b);
      if (Math.abs(a) > 1e-9) candidates.push(b / a);
      for (const v of candidates) if (canMake24([...rest, v])) return true;
    }
  }
  return false;
}

// Generate a guaranteed-solvable puzzle
function generatePuzzle() {
  // Curated fallbacks by difficulty tier
  const easy = [[1,2,3,4],[2,3,4,6],[4,4,4,6],[2,4,6,8],[1,4,6,8],[1,3,4,6],[2,3,8,3],[4,6,6,4]];
  const med  = [[3,3,8,8],[1,6,7,4],[2,2,6,8],[5,5,5,1],[2,4,8,4],[3,4,6,8],[1,8,3,3],[6,6,6,6]];
  const hard = [[1,3,8,3],[5,5,5,5],[1,5,5,5],[3,7,8,8],[4,7,8,9],[1,2,7,7],[3,4,7,8],[5,6,7,8]];
  const all  = [...easy, ...med, ...hard];

  // Try random first
  for (let i = 0; i < 60; i++) {
    const nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10) + 1);
    if (canMake24([...nums])) return { nums, tier: nums.some(n => n > 7) ? 'hard' : nums.some(n => n > 5) ? 'medium' : 'easy' };
  }
  const pick = all[Math.floor(Math.random() * all.length)];
  return { nums: pick, tier: 'medium' };
}

// ─── State ─────────────────────────────────────────────────────────────────────
let tiles     = [];   // { id, value, expr }
let selected  = null; // id of selected tile
let operator  = null; // queued operator '+' '-' '×' '÷'
let history   = [];   // undo stack (snapshots of tiles array)
let timerID   = null;
let timeLeft  = 0;
let hintsLeft = 3;
let score     = 0;
let puzzle    = null; // current puzzle
let rootEl    = null;
let sessionStreak = 0;

const TIME_LIMIT = 60;

// ─── Math ──────────────────────────────────────────────────────────────────────
function applyOp(a, op, b) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return Math.abs(b) < 1e-9 ? null : a / b;
  return null;
}

function fmtVal(n) {
  if (n === null || isNaN(n) || !isFinite(n)) return '?';
  if (Number.isInteger(n)) return String(n);
  // Show up to 3 decimal places, no trailing zeros
  return parseFloat(n.toFixed(3)).toString();
}

function wrapExpr(a, op, b) {
  return `(${a} ${op} ${b})`;
}

// ─── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerID);
  timeLeft = TIME_LIMIT;
  renderTimer();
  timerID = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) { clearInterval(timerID); handleTimeUp(); }
  }, 1000);
}

function stopTimer() { clearInterval(timerID); timerID = null; }

function renderTimer() {
  const fill = rootEl?.querySelector('.m24-timer-fill');
  const val  = rootEl?.querySelector('.m24-timer-val');
  if (!fill || !val) return;
  const pct = Math.max(0, (timeLeft / TIME_LIMIT)) * 100;
  fill.style.width = `${pct}%`;
  val.textContent  = timeLeft;
  const urgency = timeLeft <= 10 ? 'critical' : timeLeft <= 25 ? 'warn' : 'ok';
  fill.dataset.urgency = urgency;
  val.dataset.urgency  = urgency;
}

function handleTimeUp() {
  endGame(false, 'time');
}

// ─── Tiles ─────────────────────────────────────────────────────────────────────
function renderTiles() {
  const wrap = rootEl?.querySelector('.m24-tiles');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const t of tiles) {
    const div = document.createElement('div');
    div.className = 'm24-tile';
    div.dataset.id = t.id;
    if (selected === t.id) div.classList.add('m24-selected');
    const isComplex = t.expr !== String(t.value);
    div.innerHTML = `
      <span class="m24-tile-val">${fmtVal(t.value)}</span>
      ${isComplex ? `<span class="m24-tile-expr">${t.expr}</span>` : ''}
    `;
    div.addEventListener('click', () => onTileClick(t.id));
    wrap.appendChild(div);
    t.el = div;
  }
}

function renderOps() {
  const btns = rootEl?.querySelectorAll('.m24-op-btn');
  btns?.forEach(btn => { btn.dataset.active = btn.dataset.op === operator ? 'true' : 'false'; });
}

function renderHud() {
  const sc = rootEl?.querySelector('.m24-score-val');
  const hl = rootEl?.querySelector('.m24-hints-val');
  const st = rootEl?.querySelector('.m24-streak-val');
  if (sc) sc.textContent = score;
  if (hl) hl.textContent = hintsLeft;
  if (st) st.textContent = sessionStreak;
}

function renderAll() { renderTiles(); renderOps(); renderHud(); renderTimer(); }

// ─── Interaction ───────────────────────────────────────────────────────────────
function onTileClick(id) {
  if (tiles.length === 0) return;

  if (selected === null) {
    selected = id;
    renderTiles();
  } else if (selected === id) {
    // Deselect
    selected = null;
    operator = null;
    renderTiles();
    renderOps();
  } else if (operator !== null) {
    // Have: selectedTile [op] thisTile → combine!
    doCombine(selected, operator, id);
  } else {
    // Different tile, no op yet — swap selection
    selected = id;
    renderTiles();
  }
}

function onOpClick(op) {
  if (selected === null) {
    flashMsg('Select a number first');
    return;
  }
  operator = operator === op ? null : op; // toggle
  renderOps();
}

function doCombine(aId, op, bId) {
  const a = tiles.find(t => t.id === aId);
  const b = tiles.find(t => t.id === bId);
  if (!a || !b) return;

  const result = applyOp(a.value, op, b.value);
  if (result === null) { flashMsg('Division by zero!'); return; }

  // Push undo snapshot (deep copy — no DOM refs)
  history.push(tiles.map(({ id, value, expr }) => ({ id, value, expr })));

  // Animate exit
  a.el?.classList.add('m24-exit');
  b.el?.classList.add('m24-exit');

  setTimeout(() => {
    const newId = Date.now() + Math.random();
    const newTile = {
      id:    newId,
      value: result,
      expr:  wrapExpr(a.expr, op, b.expr),
    };
    tiles = tiles.filter(t => t.id !== aId && t.id !== bId);
    tiles.push(newTile);
    selected = null;
    operator = null;
    renderTiles();
    renderOps();

    // Animate enter
    const newEl = rootEl?.querySelector(`.m24-tile[data-id="${newId}"]`);
    newEl?.classList.add('m24-enter');
    setTimeout(() => newEl?.classList.remove('m24-enter'), 500);

    if (tiles.length === 1) setTimeout(() => checkWin(tiles[0].value), 400);
  }, 260);
}

function checkWin(val) {
  stopTimer();
  if (Math.abs(val - 24) < 1e-9) {
    sessionStreak++;
    const bonus = Math.max(0, timeLeft) * 8 + sessionStreak * 30;
    score += 100 + bonus;
    renderHud();
    fireConfetti();
    setTimeout(() => endGame(true, 'solved'), 600);
  } else {
    endGame(false, 'wrong', val);
  }
}

// ─── Undo ──────────────────────────────────────────────────────────────────────
function doUndo() {
  if (history.length === 0) { flashMsg('Nothing to undo'); return; }
  tiles    = history.pop();
  selected = null;
  operator = null;
  renderTiles();
  renderOps();
}

// ─── Hint ──────────────────────────────────────────────────────────────────────
function doHint() {
  if (hintsLeft <= 0) { flashMsg('No hints left!'); return; }
  const pair = findHintPair();
  if (!pair) { flashMsg('No hint available'); return; }
  hintsLeft--;
  renderHud();
  tiles.forEach(t => {
    if (t.id === pair[0] || t.id === pair[1]) {
      t.el?.classList.add('m24-hint-pulse');
      setTimeout(() => t.el?.classList.remove('m24-hint-pulse'), 2000);
    }
  });
  const btn = rootEl?.querySelector('#m24HintBtn');
  if (btn) btn.textContent = `💡 Hint (${hintsLeft})`;
}

function findHintPair() {
  for (let i = 0; i < tiles.length; i++) {
    for (let j = 0; j < tiles.length; j++) {
      if (i === j) continue;
      const rest = tiles.filter((_, k) => k !== i && k !== j).map(t => t.value);
      const a = tiles[i].value, b = tiles[j].value;
      const candidates = [a+b, a-b, b-a, a*b];
      if (Math.abs(b) > 1e-9) candidates.push(a/b);
      if (Math.abs(a) > 1e-9) candidates.push(b/a);
      for (const v of candidates) if (canMake24([...rest, v])) return [tiles[i].id, tiles[j].id];
    }
  }
  return null;
}

// ─── Flash message ─────────────────────────────────────────────────────────────
let _flashTimer;
function flashMsg(msg) {
  const el = rootEl?.querySelector('.m24-flash');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_flashTimer);
  _flashTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ─── End Game ──────────────────────────────────────────────────────────────────
function endGame(won, reason, wrongVal) {
  stopTimer();
  const el = rootEl?.querySelector('.m24-result');
  if (!el) return;

  if (won) {
    el.innerHTML = `
      <div class="m24r-icon">🎉</div>
      <div class="m24r-title">MADE IT!</div>
      <div class="m24r-msg">
        Score: <strong>${score}</strong> · Streak: <strong>${sessionStreak}</strong>
      </div>
      <div class="m24r-sub">Time left: +${Math.max(0, timeLeft) * 8}pts · Streak: +${sessionStreak * 30}pts</div>
      <button class="btn btn-primary m24r-btn m24r-next">Next Puzzle →</button>
    `;
  } else if (reason === 'time') {
    sessionStreak = 0;
    el.innerHTML = `
      <div class="m24r-icon">⏱️</div>
      <div class="m24r-title">TIME'S UP</div>
      <div class="m24r-msg">The numbers had other plans.</div>
      <div class="m24r-sub">Score this session: ${score}</div>
      <div class="m24r-actions">
        <button class="btn btn-primary m24r-btn m24r-retry">Try Again</button>
        <button class="btn btn-ghost m24r-btn m24r-newpuzz">New Puzzle</button>
      </div>
    `;
  } else {
    sessionStreak = 0;
    el.innerHTML = `
      <div class="m24r-icon">😅</div>
      <div class="m24r-title">GOT ${fmtVal(wrongVal)}</div>
      <div class="m24r-msg">Not 24. So close and yet so far.</div>
      <div class="m24r-sub">Score this session: ${score}</div>
      <div class="m24r-actions">
        <button class="btn btn-primary m24r-btn m24r-retry">Retry Same</button>
        <button class="btn btn-ghost m24r-btn m24r-newpuzz">New Puzzle</button>
      </div>
    `;
  }

  el.classList.add('visible');

  el.querySelector('.m24r-next')?.addEventListener('click', () => {
    el.classList.remove('visible');
    newPuzzle();
  });
  el.querySelector('.m24r-retry')?.addEventListener('click', () => {
    el.classList.remove('visible');
    startPuzzle(puzzle);
  });
  el.querySelector('.m24r-newpuzz')?.addEventListener('click', () => {
    el.classList.remove('visible');
    newPuzzle();
  });
}

// ─── Confetti ──────────────────────────────────────────────────────────────────
function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;

  const COLS = ['#00FFBD','#FF2D55','#BF5FFF','#FFB800','#FF8C42','#ffffff'];
  const pts  = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: -30 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 7,
    vy: Math.random() * 3 + 2,
    rot: Math.random() * 360,
    spin: (Math.random() - 0.5) * 12,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: COLS[Math.floor(Math.random() * COLS.length)],
    drag: 0.98 + Math.random() * 0.015,
  }));

  let alive = true;
  setTimeout(() => { alive = false; setTimeout(() => canvas.remove(), 500); }, 3000);

  (function frame() {
    if (!alive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.vx *= p.drag; p.rot += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height * 1.2);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  })();
}

// ─── Puzzle lifecycle ──────────────────────────────────────────────────────────
function startPuzzle(puz) {
  puzzle   = puz;
  tiles    = puz.nums.map((n, i) => ({ id: i * 1000 + Date.now(), value: n, expr: String(n) }));
  selected = null;
  operator = null;
  history  = [];
  hintsLeft = 3;
  rootEl?.querySelector('.m24-result')?.classList.remove('visible');
  rootEl?.querySelector('#m24HintBtn') && (rootEl.querySelector('#m24HintBtn').textContent = '💡 Hint (3)');
  renderAll();
  startTimer();
}

function newPuzzle() {
  const puz = generatePuzzle();
  startPuzzle(puz);
}

// ─── Init ──────────────────────────────────────────────────────────────────────
export function initMathGame() {
  const card    = document.getElementById('openMathCard');
  const modal   = document.getElementById('mathModal');
  const closeBtn = document.getElementById('mathClose');
  const overlay  = modal?.querySelector('.modal-overlay');
  const content  = document.getElementById('mathContent');
  if (!card || !modal || !content) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    bootGame(content);
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopTimer();
  }

  card.addEventListener('click', openModal);
  card.querySelector('.gc-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
}

function bootGame(container) {
  rootEl = container;
  score  = 0;
  sessionStreak = 0;

  rootEl.innerHTML = `
    <div class="m24-header">
      <div class="m24-title-wrap">
        <h2 class="m24-title">MAKE 24</h2>
        <span class="m24-target">= 24</span>
      </div>
      <p class="m24-sub">Tap a number → tap an operator → tap another number. Combine all 4 to equal <strong>24</strong>.</p>
    </div>

    <div class="m24-hud">
      <div class="m24-timer-block">
        <div class="m24-timer-bar"><div class="m24-timer-fill" data-urgency="ok"></div></div>
        <div class="m24-timer-row"><span class="m24-timer-val">60</span><span class="m24-timer-unit">sec</span></div>
      </div>
      <div class="m24-counters">
        <div class="m24-counter"><span class="m24-score-val">0</span><small>score</small></div>
        <div class="m24-counter"><span class="m24-streak-val">0</span><small>streak 🔥</small></div>
        <div class="m24-counter"><span class="m24-hints-val">3</span><small>hints</small></div>
      </div>
    </div>

    <div class="m24-arena">
      <div class="m24-tiles"></div>
      <div class="m24-ops-wrap">
        <button class="m24-op-btn" data-op="+" data-active="false">+</button>
        <button class="m24-op-btn" data-op="-" data-active="false">−</button>
        <button class="m24-op-btn" data-op="×" data-active="false">×</button>
        <button class="m24-op-btn" data-op="÷" data-active="false">÷</button>
      </div>
    </div>

    <div class="m24-controls">
      <button class="btn btn-ghost btn-sm" id="m24UndoBtn">↩ Undo</button>
      <button class="btn btn-ghost btn-sm" id="m24HintBtn">💡 Hint (3)</button>
      <button class="btn btn-ghost btn-sm" id="m24SkipBtn">Skip ⏭</button>
    </div>

    <div class="m24-flash" aria-live="assertive"></div>
    <div class="m24-result" aria-live="polite"></div>
  `;

  rootEl.querySelectorAll('.m24-op-btn').forEach(btn => {
    btn.addEventListener('click', () => onOpClick(btn.dataset.op));
  });
  rootEl.querySelector('#m24UndoBtn')?.addEventListener('click', doUndo);
  rootEl.querySelector('#m24HintBtn')?.addEventListener('click', doHint);
  rootEl.querySelector('#m24SkipBtn')?.addEventListener('click', () => {
    rootEl.querySelector('.m24-result')?.classList.remove('visible');
    newPuzzle();
  });

  newPuzzle();
}
