/**
 * mathgame.js — MAKE 24  (v2 — harder, more addictive)
 * Progressive difficulty · combo multiplier · expression trail · achievements
 */

// ─── Solver ────────────────────────────────────────────────────────────────────
function canMake24(nums) {
  if (nums.length === 1) return Math.abs(nums[0] - 24) < 1e-9;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const rest = nums.filter((_, k) => k !== i && k !== j);
      const a = nums[i], b = nums[j];
      const cands = [a+b, a-b, b-a, a*b];
      if (Math.abs(b) > 1e-9) cands.push(a/b);
      if (Math.abs(a) > 1e-9) cands.push(b/a);
      for (const v of cands) if (canMake24([...rest, v])) return true;
    }
  }
  return false;
}

// Find one valid first step
function findStep(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const rest = nums.filter((_, k) => k !== i && k !== j);
      const a = nums[i], b = nums[j];
      const cands = [
        { op:'+', v: a+b }, { op:'-', v: a-b }, { op:'×', v: a*b },
        ...(Math.abs(b) > 1e-9 ? [{ op:'÷', v: a/b }] : []),
      ];
      for (const { op, v } of cands) {
        if (canMake24([...rest, v])) return { aIdx: i, bIdx: j, op, val: v };
      }
    }
  }
  return null;
}

// Generate guaranteed-solvable puzzle for given difficulty (1-5)
function generatePuzzle(difficulty) {
  const maxNum = [0, 6, 8, 10, 13, 13][difficulty] || 9;
  const HARD_POOL = [
    [3,3,8,8],[1,5,5,5],[3,7,8,8],[4,7,8,9],[1,2,7,7],
    [3,4,7,8],[5,6,7,8],[1,3,8,3],[6,6,6,6],[1,5,8,8],
    [2,3,7,7],[1,4,9,9],[5,5,8,9],[3,5,7,9],[4,6,7,7],
    [1,9,9,9],[2,5,7,9],[4,5,8,9],[3,8,9,9],[6,7,8,9],
  ];
  if (difficulty >= 5) {
    const pick = HARD_POOL[Math.floor(Math.random() * HARD_POOL.length)];
    return [...pick].sort(() => Math.random() - 0.5);
  }
  for (let tries = 0; tries < 80; tries++) {
    const nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * maxNum) + 1);
    if (canMake24([...nums])) return nums;
  }
  return [1, 2, 3, 4];
}

// ─── Level Config ──────────────────────────────────────────────────────────────
const LEVELS = [
  null,
  { label: 'WARM UP',    time: 60, winToLevel: 3 },
  { label: 'THINKING',   time: 55, winToLevel: 3 },
  { label: 'HARD',       time: 50, winToLevel: 3 },
  { label: 'EXPERT',     time: 45, winToLevel: 3 },
  { label: 'BEAST MODE', time: 40, winToLevel: 999 },
];

function getMultiplier(streak) {
  if (streak >= 12) return 10;
  if (streak >= 8)  return 5;
  if (streak >= 5)  return 3;
  if (streak >= 3)  return 2;
  return 1;
}

// ─── State ─────────────────────────────────────────────────────────────────────
let tiles         = [];
let selected      = null;
let operator      = null;
let history       = [];
let timerID       = null;
let timeLeft      = 0;
let hintsLeft     = 3;
let score         = 0;
let level         = 1;
let sessionStreak = 0;
let levelStreak   = 0;
let usedHint      = false;
let usedUndo      = false;
let exprLog       = [];
let currentNums   = null;
let rootEl        = null;

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
  return parseFloat(n.toFixed(4)).toString();
}

// ─── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(limit) {
  clearInterval(timerID);
  timeLeft = limit;
  renderTimer();
  timerID = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) { clearInterval(timerID); endGame(false, 'time'); }
  }, 1000);
}

function stopTimer() { clearInterval(timerID); timerID = null; }

function renderTimer() {
  const fill  = rootEl?.querySelector('.m24-timer-fill');
  const val   = rootEl?.querySelector('.m24-timer-val');
  const limit = LEVELS[level]?.time || 60;
  if (!fill || !val) return;
  fill.style.width = `${Math.max(0, (timeLeft / limit) * 100)}%`;
  val.textContent   = timeLeft;
  const urg = timeLeft <= 8 ? 'critical' : timeLeft <= 18 ? 'warn' : 'ok';
  fill.dataset.urgency = urg;
  val.dataset.urgency  = urg;
  rootEl?.querySelector('.m24-arena')?.toggleAttribute('data-critical', timeLeft <= 8);
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
    const complex = t.expr !== String(t.value);
    div.innerHTML = `
      <span class="m24-tile-val">${fmtVal(t.value)}</span>
      ${complex ? `<span class="m24-tile-expr">${t.expr}</span>` : ''}
    `;
    div.addEventListener('click', () => onTileClick(t.id));
    wrap.appendChild(div);
    t.el = div;
  }
}

function renderOps() {
  rootEl?.querySelectorAll('.m24-op-btn').forEach(b => {
    b.dataset.active = b.dataset.op === operator ? 'true' : 'false';
  });
}

function renderHud() {
  const multi = getMultiplier(sessionStreak);
  const map = {
    '.m24-score-val':  score,
    '.m24-hints-val':  hintsLeft,
    '.m24-streak-val': sessionStreak,
  };
  Object.entries(map).forEach(([sel, val]) => {
    const el = rootEl?.querySelector(sel);
    if (el) el.textContent = val;
  });
  const lvEl = rootEl?.querySelector('.m24-level-val');
  if (lvEl) lvEl.textContent = LEVELS[level]?.label || `L${level}`;
  const mx = rootEl?.querySelector('.m24-multi-val');
  if (mx) { mx.textContent = `×${multi}`; mx.dataset.active = multi > 1 ? 'true' : 'false'; }
}

function renderExprLog() {
  const el = rootEl?.querySelector('.m24-expr-log');
  if (!el || !exprLog.length) { if (el) el.innerHTML = ''; return; }
  el.innerHTML = exprLog.slice(-4).reverse().map((e, i) =>
    `<div class="m24-expr-entry${i === 0 ? ' m24-expr-new' : ''}">${e}</div>`
  ).join('');
}

function renderAll() { renderTiles(); renderOps(); renderHud(); renderTimer(); renderExprLog(); }

// ─── Interaction ───────────────────────────────────────────────────────────────
function onTileClick(id) {
  if (!tiles.length) return;
  if (selected === null) { selected = id; renderTiles(); }
  else if (selected === id) { selected = null; operator = null; renderTiles(); renderOps(); }
  else if (operator !== null) { doCombine(selected, operator, id); }
  else { selected = id; renderTiles(); }
}

function onOpClick(op) {
  if (selected === null) { flashMsg('Pick a number first'); return; }
  operator = operator === op ? null : op;
  renderOps();
}

function doCombine(aId, op, bId) {
  const a = tiles.find(t => t.id === aId);
  const b = tiles.find(t => t.id === bId);
  if (!a || !b) return;
  const result = applyOp(a.value, op, b.value);
  if (result === null) { flashMsg('No dividing by zero!'); return; }

  history.push(tiles.map(({ id, value, expr }) => ({ id, value, expr })));

  const exprStr  = `(${a.expr} ${op} ${b.expr})`;
  const exprLine = `${a.expr} ${op} ${b.expr} = ${fmtVal(result)}`;
  exprLog.push(exprLine);

  a.el?.classList.add('m24-exit');
  b.el?.classList.add('m24-exit');

  setTimeout(() => {
    const newId = Date.now() + Math.random();
    tiles = tiles.filter(t => t.id !== aId && t.id !== bId);
    tiles.push({ id: newId, value: result, expr: exprStr });
    selected = null; operator = null;
    renderTiles(); renderOps(); renderExprLog();
    const newEl = rootEl?.querySelector(`.m24-tile[data-id="${newId}"]`);
    newEl?.classList.add('m24-enter');
    setTimeout(() => newEl?.classList.remove('m24-enter'), 500);
    if (tiles.length === 1) setTimeout(() => checkWin(tiles[0].value), 400);
  }, 260);
}

// ─── Win check ─────────────────────────────────────────────────────────────────
function checkWin(val) {
  stopTimer();
  if (Math.abs(val - 24) < 1e-9) {
    const timeBonus = Math.max(0, timeLeft) * 10;
    const multi = getMultiplier(sessionStreak);
    const pts = Math.round((100 + timeBonus) * multi);
    score += pts;
    sessionStreak++;
    levelStreak++;
    if (levelStreak >= (LEVELS[level]?.winToLevel || 3) && level < 5) {
      level++; levelStreak = 0;
      setTimeout(() => showLevelUp(), 200);
    }
    fireConfetti();
    triggerAchievements(timeLeft);
    setTimeout(() => endGame(true, 'solved', pts, timeBonus, multi), 700);
  } else {
    sessionStreak = 0; levelStreak = Math.max(0, levelStreak - 1);
    endGame(false, 'wrong', 0, 0, 0, val);
  }
}

// ─── Achievements ──────────────────────────────────────────────────────────────
function triggerAchievements(timeRemaining) {
  const cfg = LEVELS[level]?.time || 60;
  if (timeRemaining >= Math.floor(cfg * 5 / 6)) showAchievement('SPEED DEMON ⚡', 'Blazing fast solve!');
  if (!usedHint)                                  showAchievement('HINT-FREE 🧠', 'Pure brain, no help.');
  if (sessionStreak === 3)                         showAchievement('COMBO ×2 🎯', 'Multiplier unlocked!');
  if (sessionStreak === 5)                         showAchievement('ON FIRE 🔥', 'Five in a row!');
  if (sessionStreak === 8)                         showAchievement('COMBO ×5 🎯', '×5 multiplier!');
  if (sessionStreak === 10)                        showAchievement('NUMBER NINJA 🥷', 'Ten consecutive solves!');
  if (sessionStreak === 12)                        showAchievement('COMBO ×10 💀', 'Maximum multiplier!');
  if (level === 5 && levelStreak === 1)            showAchievement('BEAST UNLOCKED 💀', 'Welcome to hell.');
}

let _achTimer;
function showAchievement(title, sub) {
  const el = rootEl?.querySelector('.m24-achievement');
  if (!el) return;
  el.innerHTML = `<div class="m24-ach-title">${title}</div><div class="m24-ach-sub">${sub}</div>`;
  el.classList.add('show');
  clearTimeout(_achTimer);
  _achTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function showLevelUp() {
  const el = rootEl?.querySelector('.m24-levelup');
  if (!el) return;
  el.textContent = `LEVEL UP → ${LEVELS[level]?.label || ''}`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}

// ─── End Game ──────────────────────────────────────────────────────────────────
function endGame(won, reason, pts, timeBonus, multi, wrongVal) {
  stopTimer();
  const el = rootEl?.querySelector('.m24-result');
  if (!el) return;

  if (won) {
    el.innerHTML = `
      <div class="m24r-icon">🎉</div>
      <div class="m24r-title">MADE 24!</div>
      <div class="m24r-breakdown">
        <div class="m24r-row"><span>Base</span><strong>100</strong></div>
        <div class="m24r-row"><span>Time bonus</span><strong>+${timeBonus}</strong></div>
        <div class="m24r-row m24r-row--multi"><span>Multiplier</span><strong>×${multi}</strong></div>
        <div class="m24r-row m24r-row--total"><span>Round total</span><strong>+${pts}</strong></div>
      </div>
      <div class="m24r-totals">Score: <strong>${score}</strong> · Streak: <strong>${sessionStreak} 🔥</strong></div>
      <div class="m24r-level">Level: <strong>${LEVELS[level]?.label || `L${level}`}</strong></div>
      <button class="btn btn-primary m24r-btn" id="m24rNext">Next Puzzle →</button>
    `;
  } else if (reason === 'time') {
    sessionStreak = 0; levelStreak = Math.max(0, levelStreak - 1);
    el.innerHTML = `
      <div class="m24r-icon">⏱️</div>
      <div class="m24r-title">TIME'S UP</div>
      <div class="m24r-totals">Score: <strong>${score}</strong></div>
      <div class="m24r-actions">
        <button class="btn btn-primary m24r-btn" id="m24rRetry">Same Puzzle</button>
        <button class="btn btn-ghost m24r-btn" id="m24rNext">New Puzzle</button>
      </div>
    `;
  } else {
    sessionStreak = 0; levelStreak = Math.max(0, levelStreak - 1);
    el.innerHTML = `
      <div class="m24r-icon">😅</div>
      <div class="m24r-title">GOT ${fmtVal(wrongVal)}</div>
      <div class="m24r-totals">Not 24. Score: <strong>${score}</strong></div>
      <div class="m24r-actions">
        <button class="btn btn-primary m24r-btn" id="m24rRetry">Retry</button>
        <button class="btn btn-ghost m24r-btn" id="m24rNext">New Puzzle</button>
      </div>
    `;
  }

  el.classList.add('visible');
  renderHud();

  el.querySelector('#m24rNext')?.addEventListener('click', () => { el.classList.remove('visible'); newPuzzle(); });
  el.querySelector('#m24rRetry')?.addEventListener('click', () => { el.classList.remove('visible'); restartPuzzle(); });
}

// ─── Undo ──────────────────────────────────────────────────────────────────────
function doUndo() {
  if (!history.length) { flashMsg('Nothing to undo'); return; }
  usedUndo = true;
  tiles = history.pop().map(t => ({ ...t }));
  selected = null; operator = null;
  if (exprLog.length) exprLog.pop();
  renderTiles(); renderOps(); renderExprLog();
}

// ─── Hint ──────────────────────────────────────────────────────────────────────
function doHint() {
  if (hintsLeft <= 0) { flashMsg('No hints left!'); return; }
  const step = findStep(tiles.map(t => t.value));
  if (!step) { flashMsg('Hmm, no hint found'); return; }
  hintsLeft--; usedHint = true;
  renderHud();
  const tA = tiles[step.aIdx], tB = tiles[step.bIdx];
  [tA, tB].forEach(t => {
    if (!t) return;
    t.el?.classList.add('m24-hint-pulse');
    setTimeout(() => t.el?.classList.remove('m24-hint-pulse'), 2400);
  });
  const hint = tA && tB
    ? `Try: ${fmtVal(tA.value)} ${step.op} ${fmtVal(tB.value)} = ${fmtVal(step.val)}`
    : 'Look for a non-obvious combination';
  flashMsg(hint, 3200);
  const btn = rootEl?.querySelector('#m24HintBtn');
  if (btn) btn.textContent = `💡 Hint (${hintsLeft})`;
}

// ─── Flash ─────────────────────────────────────────────────────────────────────
let _flashTimer;
function flashMsg(msg, dur = 2000) {
  const el = rootEl?.querySelector('.m24-flash');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_flashTimer);
  _flashTimer = setTimeout(() => el.classList.remove('show'), dur);
}

// ─── Confetti ──────────────────────────────────────────────────────────────────
function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const COLS = ['#00FFBD','#FF2D55','#BF5FFF','#FFB800','#FF8C42','#fff'];
  const pts  = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width, y: -30 - Math.random() * 120,
    vx: (Math.random() - 0.5) * 8, vy: Math.random() * 3 + 2,
    rot: Math.random() * 360, spin: (Math.random() - 0.5) * 14,
    w: Math.random() * 12 + 5, h: Math.random() * 7 + 3,
    color: COLS[Math.floor(Math.random() * COLS.length)],
  }));
  let alive = true;
  setTimeout(() => { alive = false; setTimeout(() => canvas.remove(), 500); }, 3200);
  (function frame() {
    if (!alive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.rot += p.spin;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height * 1.3);
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
    }
    requestAnimationFrame(frame);
  })();
}

// ─── Puzzle lifecycle ──────────────────────────────────────────────────────────
function startPuzzle(nums) {
  currentNums = nums;
  tiles    = nums.map((n, i) => ({ id: i * 1000 + Date.now(), value: n, expr: String(n) }));
  selected = null; operator = null; history = [];
  hintsLeft = 3; usedHint = false; usedUndo = false; exprLog = [];
  rootEl?.querySelector('.m24-result')?.classList.remove('visible');
  rootEl?.querySelector('.m24-achievement')?.classList.remove('show');
  const hb = rootEl?.querySelector('#m24HintBtn');
  if (hb) hb.textContent = '💡 Hint (3)';
  renderAll();
  startTimer(LEVELS[level]?.time || 60);
}

function newPuzzle()     { startPuzzle(generatePuzzle(level)); }
function restartPuzzle() { if (currentNums) startPuzzle(currentNums); else newPuzzle(); }

// ─── Init ──────────────────────────────────────────────────────────────────────
export function initMathGame() {
  const card     = document.getElementById('openMathCard');
  const modal    = document.getElementById('mathModal');
  const closeBtn = document.getElementById('mathClose');
  const overlay  = modal?.querySelector('.modal-overlay');
  const content  = document.getElementById('mathContent');
  if (!card || !modal || !content) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    score = 0; sessionStreak = 0; levelStreak = 0;
    showLevelPicker(content);
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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

function showLevelPicker(container) {
  rootEl = container;
  rootEl.innerHTML = `
    <div class="m24-picker">
      <div class="m24-picker-title">MAKE 24</div>
      <p class="m24-picker-sub">Pick your starting level. Win 3 in a row to advance.</p>
      <div class="m24-picker-grid">
        ${[1,2,3,4,5].map(l => `
          <button class="m24-level-card" data-lvl="${l}">
            <div class="m24-lc-num">L${l}</div>
            <div class="m24-lc-name">${LEVELS[l].label}</div>
            <div class="m24-lc-detail">Numbers 1–${[6,8,10,13,13][l-1]} · ${LEVELS[l].time}s</div>
          </button>`).join('')}
      </div>
    </div>
  `;
  rootEl.querySelectorAll('.m24-level-card').forEach(btn => {
    btn.addEventListener('click', () => {
      level = parseInt(btn.dataset.lvl);
      bootUI(container);
      newPuzzle();
    });
  });
}

function bootUI(container) {
  rootEl = container;
  rootEl.innerHTML = `
    <div class="m24-header">
      <div class="m24-title-row">
        <h2 class="m24-title">MAKE 24</h2>
        
      </div>
      <p class="m24-sub">Tap a number → tap an operator → tap another number. Combine all 4 to reach <strong>24</strong>. Win 3 times to level up.</p>
    </div>

    <div class="m24-hud">
      <div class="m24-timer-block">
        <div class="m24-timer-bar"><div class="m24-timer-fill" data-urgency="ok"></div></div>
        <div class="m24-timer-row"><span class="m24-timer-val">60</span><span class="m24-timer-unit">s</span></div>
      </div>
      <div class="m24-counters">
        <div class="m24-counter m24-counter--level"><span class="m24-level-val">WARM UP</span><small>level</small></div>
        <div class="m24-counter m24-counter--multi"><span class="m24-multi-val" data-active="false">×1</span><small>combo</small></div>
        <div class="m24-counter"><span class="m24-score-val">0</span><small>score</small></div>
        <div class="m24-counter"><span class="m24-streak-val">0</span><small>streak 🔥</small></div>
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
      <div class="m24-expr-log" aria-live="polite"></div>
    </div>

    <div class="m24-controls">
      <button class="btn btn-ghost btn-sm" id="m24UndoBtn">↩ Undo</button>
      <button class="btn btn-ghost btn-sm" id="m24HintBtn">💡 Hint (3)</button>
      <button class="btn btn-ghost btn-sm" id="m24SkipBtn">Skip ⏭</button>
    </div>

    <div class="m24-flash" aria-live="assertive"></div>
    <div class="m24-achievement" aria-live="polite"></div>
    <div class="m24-levelup" aria-live="polite"></div>
    <div class="m24-result" aria-live="polite"></div>
  `;

  rootEl.querySelectorAll('.m24-op-btn').forEach(btn => {
    btn.addEventListener('click', () => onOpClick(btn.dataset.op));
  });
  rootEl.querySelector('#m24UndoBtn')?.addEventListener('click', doUndo);
  rootEl.querySelector('#m24HintBtn')?.addEventListener('click', doHint);
  rootEl.querySelector('#m24SkipBtn')?.addEventListener('click', () => {
    rootEl.querySelector('.m24-result')?.classList.remove('visible');
    sessionStreak = 0; levelStreak = 0;
    renderHud(); newPuzzle();
  });
}
