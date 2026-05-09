/**
 * crossword.js — KNOW YOUR PEOPLE
 * 16 friends. Shuffled layout every game. Shuffled hints every game.
 * Lives · Timer · Streak multiplier · Hard mode
 */

// ─── People data ───────────────────────────────────────────────────────────────
const PEOPLE = {
  KAARTHIK:  ['TVK member', 'Known as EJ Keerthana', 'The fake Malayali of the group', 'Theevira Vijay Kanni'],
  VARSHINII: ['SASTRA alumni', 'The unexpected one', 'Chintu', 'Has double I and still spells it wrong apparently'],
  VACHU:     ['Unekenapa', 'From Atthipatti', 'Harish P\'s person', 'Stove off pannava', 'Jukebox regular'],
  ARUN:      ['Basketball guy', 'Panamaram native', 'The quiet one until he isn\'t'],
  NIVETHA:   ['V pose at every photo', 'The Rock energy', 'Batman fan', 'k-culture president', 'Harish P\'s person too'],
  HARSHA:    ['Punctuality ku per ponava', 'Knows every Tamil movie/song', 'The one who always has something herbal'],
  HARISH:    ['Farmer at heart', 'Never seen without a towel shirt', 'Ann', 'Jukebox collaborator'],
  HARI:      ['Mother\'s blessed child', 'Murugan Idly guy', 'Believes in a wife who doesn\'t put makeup'],
  MALAVIKAA: ['AA Battery — she has 2 A\'s', 'German resident according to Instagram', 'United by blood with someone here'],
  YESHU:     ['Canada based', 'Unites north and south', 'The cd connection', 'Rishi\'s person', 'SHAHID SAFIULLA'],
  NISHI:     ['Group oda mother', 'SHAHID SAFIULLA', 'Meesaiya Murukku', 'The one who keeps everyone together'],
  JEFFREY:   ['Church guy', 'Kusu', 'Robo Shankar vibes', 'Muscat connection', 'The dialer'],
  JASHWANTH: ['Future MLA', 'Future movie star', 'Future AP CM', 'Already acts like all three'],
  ADITI:     ['Divs', 'Can we connect quickly on your leave?', 'Paithyakari', 'Always quick to check in'],
  GOBI:      ['Spartan mindset', 'Tribal dance enthusiast', 'Pudhu maapillai in the making'],
  DEEPTHI:   ['Ayyyyyyyyy', 'SHAHID SAFIULLA', 'Shrivanth', 'Vishnu', 'Gopi', 'The one with the loudest entrance'],
};

// ─── 4 pre-computed valid layouts (grid size 22×22) ───────────────────────────
const LAYOUTS = [
  // Layout 0
  [
    { word:'VARSHINII', row:11, col:6,  dir:'H' },
    { word:'MALAVIKAA', row:4,  col:7,  dir:'V' },
    { word:'JASHWANTH', row:8,  col:10, dir:'V' },
    { word:'KAARTHIK',  row:7,  col:6,  dir:'H' },
    { word:'NIVETHA',   row:13, col:4,  dir:'H' },
    { word:'JEFFREY',   row:3,  col:9,  dir:'V' },
    { word:'DEEPTHI',   row:16, col:5,  dir:'H' },
    { word:'HARSHA',    row:2,  col:8,  dir:'V' },
    { word:'HARISH',    row:2,  col:8,  dir:'H' },
    { word:'VACHU',     row:4,  col:11, dir:'V' },
    { word:'YESHU',     row:0,  col:12, dir:'V' },
    { word:'NISHI',     row:15, col:11, dir:'V' },
    { word:'ADITI',     row:5,  col:11, dir:'H' },
    { word:'ARUN',      row:10, col:4,  dir:'V' },
    { word:'HARI',      row:19, col:8,  dir:'H' },
    { word:'GOBI',      row:9,  col:4,  dir:'H' },
  ],
  // Layout 1
  [
    { word:'VARSHINII', row:11, col:6,  dir:'H' },
    { word:'MALAVIKAA', row:3,  col:7,  dir:'V' },
    { word:'JASHWANTH', row:10, col:6,  dir:'H' },
    { word:'KAARTHIK',  row:6,  col:6,  dir:'H' },
    { word:'NIVETHA',   row:7,  col:5,  dir:'H' },
    { word:'JEFFREY',   row:13, col:5,  dir:'V' },
    { word:'DEEPTHI',   row:5,  col:14, dir:'V' },
    { word:'HARSHA',    row:2,  col:11, dir:'V' },
    { word:'HARISH',    row:3,  col:12, dir:'V' },
    { word:'VACHU',     row:2,  col:8,  dir:'H' },
    { word:'YESHU',     row:18, col:4,  dir:'H' },
    { word:'NISHI',     row:8,  col:3,  dir:'H' },
    { word:'ADITI',     row:4,  col:4,  dir:'V' },
    { word:'ARUN',      row:17, col:4,  dir:'H' },
    { word:'HARI',      row:1,  col:9,  dir:'V' },
    { word:'GOBI',      row:6,  col:1,  dir:'H' },
  ],
  // Layout 2
  [
    { word:'VARSHINII', row:11, col:6,  dir:'H' },
    { word:'MALAVIKAA', row:6,  col:13, dir:'V' },
    { word:'JASHWANTH', row:9,  col:9,  dir:'V' },
    { word:'KAARTHIK',  row:5,  col:11, dir:'V' },
    { word:'NIVETHA',   row:15, col:9,  dir:'H' },
    { word:'JEFFREY',   row:14, col:12, dir:'V' },
    { word:'DEEPTHI',   row:17, col:4,  dir:'H' },
    { word:'HARSHA',    row:10, col:15, dir:'V' },
    { word:'HARISH',    row:9,  col:8,  dir:'V' },
    { word:'VACHU',     row:10, col:7,  dir:'V' },
    { word:'YESHU',     row:16, col:5,  dir:'V' },
    { word:'NISHI',     row:19, col:2,  dir:'H' },
    { word:'ADITI',     row:15, col:3,  dir:'V' },
    { word:'ARUN',      row:8,  col:12, dir:'V' },
    { word:'HARI',      row:15, col:2,  dir:'H' },
    { word:'GOBI',      row:8,  col:14, dir:'V' },
  ],
  // Layout 3
  [
    { word:'VARSHINII', row:11, col:6,  dir:'H' },
    { word:'MALAVIKAA', row:8,  col:7,  dir:'V' },
    { word:'JASHWANTH', row:15, col:2,  dir:'H' },
    { word:'KAARTHIK',  row:16, col:5,  dir:'H' },
    { word:'NIVETHA',   row:10, col:14, dir:'V' },
    { word:'JEFFREY',   row:13, col:9,  dir:'H' },
    { word:'DEEPTHI',   row:14, col:10, dir:'H' },
    { word:'HARSHA',    row:9,  col:2,  dir:'H' },
    { word:'HARISH',    row:4,  col:6,  dir:'V' },
    { word:'VACHU',     row:12, col:14, dir:'H' },
    { word:'YESHU',     row:13, col:4,  dir:'V' },
    { word:'NISHI',     row:7,  col:2,  dir:'H' },
    { word:'ADITI',     row:16, col:14, dir:'H' },
    { word:'ARUN',      row:8,  col:12, dir:'V' },
    { word:'HARI',      row:9,  col:10, dir:'H' },
    { word:'GOBI',      row:6,  col:13, dir:'V' },
  ],
];

// ─── Game state ────────────────────────────────────────────────────────────────
const GRID_SIZE = 22;
let gameLayout   = [];
let answerGrid   = [];
let playerGrid   = [];
let wordHints    = {};    // word → current hint string
let wordStatus   = {};    // word → 'unsolved' | 'correct' | 'failed'
let activeWord   = null;
let activeInput  = '';
let lives        = 5;
let score        = 0;
let streak       = 0;
let timerID      = null;
let timeLeft     = 0;
let hardMode     = false;
let rootEl       = null;
let modalOpen    = false;

const TIME_PER_WORD = 25; // seconds per word (hard: 15)

// ─── Shuffle ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1)); [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ─── Build grids ─────────────────────────────────────────────────────────────
function buildAnswerGrid(layout) {
  const g = Array.from({length:GRID_SIZE}, () => Array(GRID_SIZE).fill(null));
  for (const {word, row, col, dir} of layout) {
    for (let i = 0; i < word.length; i++) {
      const r = dir==='V' ? row+i : row;
      const c = dir==='H' ? col+i : col;
      if (r < GRID_SIZE && c < GRID_SIZE) g[r][c] = word[i];
    }
  }
  return g;
}

function buildPlayerGrid(size) {
  return Array.from({length:size}, () => Array(size).fill(null));
}

// Crop to bounding box + padding
function getBounds(layout) {
  let minR=GRID_SIZE, maxR=0, minC=GRID_SIZE, maxC=0;
  for (const {word, row, col, dir} of layout) {
    const endR = dir==='V' ? row+word.length-1 : row;
    const endC = dir==='H' ? col+word.length-1 : col;
    minR = Math.min(minR, row); maxR = Math.max(maxR, endR);
    minC = Math.min(minC, col); maxC = Math.max(maxC, endC);
  }
  const pad = 1;
  return { minR: Math.max(0, minR-pad), maxR: Math.min(GRID_SIZE-1, maxR+pad),
           minC: Math.max(0, minC-pad), maxC: Math.min(GRID_SIZE-1, maxC+pad) };
}

// ─── Word numbering ───────────────────────────────────────────────────────────
function numberWords(layout) {
  // Assign numbers top-left to bottom-right (by row then col)
  const sorted = [...layout].sort((a,b) => a.row!==b.row ? a.row-b.row : a.col-b.col);
  const numbered = [];
  const usedCells = new Map();
  let n = 1;
  for (const entry of sorted) {
    const key = `${entry.row},${entry.col}`;
    if (!usedCells.has(key)) { usedCells.set(key, n++); }
    numbered.push({ ...entry, num: usedCells.get(key) });
  }
  return numbered;
}

// ─── DOM rendering ────────────────────────────────────────────────────────────
function renderGrid(layout, bounds) {
  const { minR, maxR, minC, maxC } = bounds;
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  const numbered = numberWords(layout);
  const numMap   = {};
  for (const {row, col, num} of numbered) numMap[`${row},${col}`] = num;

  const table = document.createElement('div');
  table.className = 'cw2-grid';
  table.style.setProperty('--cw-cols', cols);
  table.style.setProperty('--cw-rows', rows);

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = document.createElement('div');
      cell.dataset.r = r; cell.dataset.c = c;
      const letter = answerGrid[r]?.[c];
      if (!letter) {
        cell.className = 'cw2-cell cw2-cell--blank';
      } else {
        cell.className = 'cw2-cell cw2-cell--letter';
        const num = numMap[`${r},${c}`];
        if (num) {
          const badge = document.createElement('span');
          badge.className = 'cw2-num';
          badge.textContent = num;
          cell.appendChild(badge);
        }
        const letterEl = document.createElement('span');
        letterEl.className = 'cw2-letter';
        letterEl.dataset.r = r; letterEl.dataset.c = c;
        cell.appendChild(letterEl);
        cell.addEventListener('click', () => onCellClick(r, c, layout));
      }
      table.appendChild(cell);
    }
  }
  return table;
}

function onCellClick(r, c, layout) {
  // Find which word(s) this cell belongs to
  const words = layout.filter(({word, row, col, dir}) => {
    if (dir==='H') return r===row && c>=col && c<col+word.length;
    else           return c===col && r>=row && r<row+word.length;
  });
  if (!words.length) return;
  // Toggle between words if cell has two
  if (words.length === 2 && activeWord === words[0].word) {
    startWord(words[1]);
  } else {
    startWord(words[0]);
  }
}

// ─── Clue panel ───────────────────────────────────────────────────────────────
function renderClues(numbered) {
  const across = numbered.filter(e => e.dir==='H').sort((a,b) => a.num-b.num);
  const down   = numbered.filter(e => e.dir==='V').sort((a,b) => a.num-b.num);

  const el = rootEl.querySelector('.cw2-clues');
  if (!el) return;

  function section(title, list) {
    const div = document.createElement('div');
    div.className = 'cw2-clue-section';
    div.innerHTML = `<h3 class="cw2-clue-heading">${title}</h3>`;
    for (const entry of list) {
      const item = document.createElement('div');
      item.className = `cw2-clue-item ${wordStatus[entry.word]==='correct'?'cw2-clue--done':''}`;
      item.dataset.word = entry.word;
      item.innerHTML = `
        <span class="cw2-clue-num">${entry.num}</span>
        <span class="cw2-clue-text">${wordHints[entry.word] || '—'}</span>
        <span class="cw2-clue-len">(${entry.word.length})</span>
      `;
      item.addEventListener('click', () => startWord(entry));
      div.appendChild(item);
    }
    return div;
  }

  el.innerHTML = '';
  el.appendChild(section('ACROSS →', across));
  el.appendChild(section('DOWN ↓', down));
}

// ─── Highlight ────────────────────────────────────────────────────────────────
function highlightWord(wordEntry) {
  rootEl.querySelectorAll('.cw2-cell--letter').forEach(c => {
    c.classList.remove('cw2-highlight', 'cw2-highlight-cursor');
  });
  rootEl.querySelectorAll('.cw2-clue-item').forEach(c => {
    c.classList.remove('cw2-clue-active');
  });

  if (!wordEntry) return;

  const { word, row, col, dir } = wordEntry;
  for (let i = 0; i < word.length; i++) {
    const r = dir==='V' ? row+i : row;
    const c2 = dir==='H' ? col+i : col;
    const cell = rootEl.querySelector(`.cw2-cell[data-r="${r}"][data-c="${c2}"]`);
    if (cell) {
      cell.classList.add('cw2-highlight');
      if (i === activeInput.length) cell.classList.add('cw2-highlight-cursor');
    }
  }

  const clueItem = rootEl.querySelector(`.cw2-clue-item[data-word="${word}"]`);
  clueItem?.classList.add('cw2-clue-active');
  clueItem?.scrollIntoView({ block:'nearest', behavior:'smooth' });
}

// ─── Active word input ────────────────────────────────────────────────────────
function startWord(entry) {
  if (!entry || wordStatus[entry.word] === 'correct') return;
  if (activeWord === entry.word) return;
  activeWord  = entry.word;
  activeInput = '';
  stopWordTimer();
  startWordTimer(entry);
  highlightWord(entry);
  updateInputDisplay(entry);
  updateActiveMeta(entry);
}

function updateActiveMeta(entry) {
  const metaEl = rootEl.querySelector('.cw2-active-meta');
  if (!metaEl || !entry) return;
  const numbered = numberWords(gameLayout);
  const num = numbered.find(e => e.word === entry.word)?.num;
  metaEl.innerHTML = `
    <span class="cw2-active-num">${num || '?'}${entry.dir==='H'?' →':' ↓'}</span>
    <span class="cw2-active-hint">${wordHints[entry.word]}</span>
    <span class="cw2-active-len">${entry.word.length} letters</span>
  `;
}

function updateInputDisplay(entry) {
  if (!entry) return;
  const { word, row, col, dir } = entry;
  for (let i = 0; i < word.length; i++) {
    const r = dir==='V' ? row+i : row;
    const c = dir==='H' ? col+i : col;
    const letterEl = rootEl.querySelector(`.cw2-letter[data-r="${r}"][data-c="${c}"]`);
    if (!letterEl) continue;
    if (playerGrid[r]?.[c]) {
      letterEl.textContent = playerGrid[r][c];
      letterEl.dataset.state = 'correct';
    } else if (i < activeInput.length) {
      letterEl.textContent = activeInput[i];
      letterEl.dataset.state = 'typing';
    } else {
      letterEl.textContent = '';
      letterEl.dataset.state = '';
    }
  }
  highlightWord(entry);
}

// ─── Word timer ───────────────────────────────────────────────────────────────
function startWordTimer(entry) {
  timeLeft = hardMode ? 15 : TIME_PER_WORD;
  renderTimer();
  timerID = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      stopWordTimer();
      onWordFail(entry, 'time');
    }
  }, 1000);
}

function stopWordTimer() { clearInterval(timerID); timerID = null; }

function renderTimer() {
  const el = rootEl?.querySelector('.cw2-timer-fill');
  const vl = rootEl?.querySelector('.cw2-timer-val');
  const max = hardMode ? 15 : TIME_PER_WORD;
  if (el) {
    el.style.width = `${Math.max(0, (timeLeft/max)*100)}%`;
    el.dataset.urgency = timeLeft <= 5 ? 'critical' : timeLeft <= 10 ? 'warn' : 'ok';
  }
  if (vl) {
    vl.textContent = timeLeft;
    vl.dataset.urgency = timeLeft <= 5 ? 'critical' : 'ok';
  }
}

// ─── Key input ────────────────────────────────────────────────────────────────
function handleCrosswordKey(e) {
  if (!modalOpen || !activeWord) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const entry = gameLayout.find(w => w.word === activeWord);
  if (!entry) return;

  if (e.key === 'Escape') { activeWord = null; highlightWord(null); stopWordTimer(); return; }
  if (e.key === 'Backspace') {
    activeInput = activeInput.slice(0, -1);
    updateInputDisplay(entry);
    e.preventDefault(); return;
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    advanceWord(entry);
    return;
  }
  if (/^[a-zA-Z]$/.test(e.key)) {
    const ch = e.key.toUpperCase();
    if (activeInput.length < entry.word.length) {
      activeInput += ch;
      updateInputDisplay(entry);
      // Flash correct/wrong per letter
      const idx = activeInput.length - 1;
      const correct = entry.word[idx];
      if (ch === correct) {
        flashLetter(entry, idx, 'hit');
      } else {
        flashLetter(entry, idx, 'miss');
        loseLife(entry);
      }
      if (activeInput.length === entry.word.length) {
        setTimeout(() => checkWord(entry), 200);
      }
    }
    e.preventDefault();
  }
}

function flashLetter(entry, idx, type) {
  const { row, col, dir } = entry;
  const r = dir==='V' ? row+idx : row;
  const c = dir==='H' ? col+idx : col;
  const cell = rootEl.querySelector(`.cw2-cell[data-r="${r}"][data-c="${c}"]`);
  cell?.classList.add(`cw2-flash-${type}`);
  setTimeout(() => cell?.classList.remove(`cw2-flash-${type}`), 350);
}

function advanceWord(current) {
  const numbered = numberWords(gameLayout);
  const unsolved = numbered.filter(e => wordStatus[e.word] !== 'correct');
  if (!unsolved.length) return;
  const ci = unsolved.findIndex(e => e.word === current?.word);
  const next = unsolved[(ci + 1) % unsolved.length];
  startWord(next);
}

// ─── Check word ───────────────────────────────────────────────────────────────
function checkWord(entry) {
  const { word, row, col, dir } = entry;
  if (activeInput === word) {
    // Correct!
    stopWordTimer();
    wordStatus[word] = 'correct';
    streak++;
    const bonus  = Math.max(1, timeLeft) * 5 * getMultiplier();
    score       += 100 + bonus;
    // Write to playerGrid
    for (let i = 0; i < word.length; i++) {
      const r = dir==='V' ? row+i : row;
      const c = dir==='H' ? col+i : col;
      if (playerGrid[r]) playerGrid[r][c] = word[i];
    }
    // Reveal in grid
    updateInputDisplay(entry);
    triggerWordWin(entry, bonus);
    updateHUD();
    renderClues(numberWords(gameLayout));
    // Auto-advance to next unsolved
    setTimeout(() => {
      const unsolved = gameLayout.filter(e => wordStatus[e.word] !== 'correct');
      if (!unsolved.length) {
        onAllSolved();
      } else {
        advanceWord(entry);
      }
    }, 700);
  } else {
    // Wrong full word
    streak = 0;
    loseLife(entry);
    activeInput = '';
    updateInputDisplay(entry);
    updateHUD();
  }
}

function triggerWordWin(entry, bonus) {
  const { row, col, dir, word } = entry;
  // Flash all cells green
  for (let i = 0; i < word.length; i++) {
    const r = dir==='V' ? row+i : row;
    const c = dir==='H' ? col+i : col;
    const cell = rootEl.querySelector(`.cw2-cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) {
      setTimeout(() => {
        cell.classList.add('cw2-cell--solved');
      }, i * 60);
    }
  }
  const multEl = rootEl.querySelector('.cw2-combo');
  if (multEl && getMultiplier() > 1) {
    multEl.textContent = `×${getMultiplier()} COMBO`;
    multEl.classList.add('show');
    setTimeout(() => multEl.classList.remove('show'), 1800);
  }
}

function loseLife(entry) {
  if (lives <= 0) return;
  lives--;
  updateHUD();
  if (lives === 0) {
    setTimeout(() => onGameOver(), 400);
    return;
  }
  // Shake the active word cells
  const { word, row, col, dir } = entry;
  for (let i = 0; i < word.length; i++) {
    const r = dir==='V' ? row+i : row;
    const c = dir==='H' ? col+i : col;
    const cell = rootEl.querySelector(`.cw2-cell[data-r="${r}"][data-c="${c}"]`);
    cell?.classList.add('cw2-shake');
    setTimeout(() => cell?.classList.remove('cw2-shake'), 600);
  }
}

function onWordFail(entry, reason) {
  streak = 0;
  loseLife(entry);
  activeInput = '';
  updateInputDisplay(entry);
  if (lives > 0) {
    const msg = reason === 'time' ? '⏱ Time\'s up!' : '✗ Wrong!';
    showFlash(msg);
    advanceWord(entry);
  }
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function getMultiplier() {
  if (streak >= 8) return 4;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

function updateHUD() {
  const livesEl = rootEl?.querySelector('.cw2-lives');
  const scoreEl = rootEl?.querySelector('.cw2-score-val');
  const streakEl = rootEl?.querySelector('.cw2-streak-val');
  if (livesEl) livesEl.innerHTML = Array.from({length:5},(_,i) => `<span class="cw2-heart${i<lives?'':' lost'}">❤</span>`).join('');
  if (scoreEl) scoreEl.textContent = score;
  if (streakEl) streakEl.textContent = streak;

  const leftEl = rootEl?.querySelector('.cw2-words-left');
  if (leftEl) {
    const done = Object.values(wordStatus).filter(s=>s==='correct').length;
    leftEl.textContent = `${done} / ${gameLayout.length}`;
  }
}

function showFlash(msg) {
  const el = rootEl?.querySelector('.cw2-flash-msg');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1600);
}

// ─── End states ──────────────────────────────────────────────────────────────
function onAllSolved() {
  stopWordTimer();
  activeWord = null;
  highlightWord(null);
  fireConfetti();
  showEndPanel(true);
}

function onGameOver() {
  stopWordTimer();
  activeWord = null;
  highlightWord(null);
  // Reveal all unsolved words
  for (const entry of gameLayout) {
    if (wordStatus[entry.word] !== 'correct') {
      revealEntry(entry);
    }
  }
  showEndPanel(false);
}

function revealEntry(entry) {
  const { word, row, col, dir } = entry;
  for (let i = 0; i < word.length; i++) {
    const r = dir==='V' ? row+i : row;
    const c = dir==='H' ? col+i : col;
    const letterEl = rootEl.querySelector(`.cw2-letter[data-r="${r}"][data-c="${c}"]`);
    if (letterEl) { letterEl.textContent = word[i]; letterEl.dataset.state = 'revealed'; }
  }
}

function showEndPanel(won) {
  const el = rootEl?.querySelector('.cw2-endpanel');
  if (!el) return;
  const solved = Object.values(wordStatus).filter(s=>s==='correct').length;
  el.innerHTML = `
    <div class="cw2-ep-inner">
      <div class="cw2-ep-icon">${won ? '🎉' : '💀'}</div>
      <div class="cw2-ep-title">${won ? 'YOU KNOW YOUR PEOPLE' : 'GAME OVER'}</div>
      <div class="cw2-ep-score">Score: <strong>${score}</strong></div>
      <div class="cw2-ep-detail">${solved} / ${gameLayout.length} words · Best streak: ${streak}</div>
      <div class="cw2-ep-actions">
        <button class="btn btn-primary cw2-ep-btn" id="cw2PlayAgain">Play Again</button>
        <button class="btn btn-ghost cw2-ep-btn" id="cw2HardToggle">${hardMode?'Normal Mode':'Hard Mode 🔥'}</button>
      </div>
    </div>
  `;
  el.classList.add('visible');
  el.querySelector('#cw2PlayAgain')?.addEventListener('click', () => {
    el.classList.remove('visible');
    initGame();
  });
  el.querySelector('#cw2HardToggle')?.addEventListener('click', () => {
    hardMode = !hardMode;
    el.classList.remove('visible');
    initGame();
  });
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth; canvas.height = innerHeight;
  const C=['#00FFBD','#FF2D55','#BF5FFF','#FFB800','#FF8C42','#fff'];
  const pts=Array.from({length:120},()=>({x:Math.random()*canvas.width,y:-30-Math.random()*100,vx:(Math.random()-.5)*8,vy:Math.random()*3+2,rot:Math.random()*360,spin:(Math.random()-.5)*12,w:Math.random()*12+5,h:Math.random()*6+3,color:C[~~(Math.random()*C.length)]}));
  let alive=true;
  setTimeout(()=>{alive=false;setTimeout(()=>canvas.remove(),500);},3200);
  (function frame(){if(!alive)return;ctx.clearRect(0,0,canvas.width,canvas.height);for(const p of pts){p.x+=p.vx;p.y+=p.vy;p.vy+=0.07;p.rot+=p.spin;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,1-p.y/canvas.height*1.3);ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}requestAnimationFrame(frame);})();
}

// ─── Game init ─────────────────────────────────────────────────────────────────
function initGame() {
  // Pick random layout
  gameLayout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];

  // Shuffle hints per word
  wordHints  = {};
  wordStatus = {};
  for (const { word } of gameLayout) {
    const hints = PEOPLE[word] || ['Who are they?'];
    wordHints[word]  = shuffle(hints)[0]; // pick one random hint
    wordStatus[word] = 'unsolved';
  }

  // Build grids
  answerGrid = buildAnswerGrid(gameLayout);
  playerGrid = buildPlayerGrid(GRID_SIZE);
  activeWord = null;
  activeInput = '';
  lives  = hardMode ? 3 : 5;
  score  = 0;
  streak = 0;

  const bounds   = getBounds(gameLayout);
  const numbered = numberWords(gameLayout);

  rootEl.innerHTML = `
    <div class="cw2-wrapper">
      <div class="cw2-header">
        <div class="cw2-title-row">
          <h2 class="cw2-title">KNOW YOUR PEOPLE</h2>
          ${hardMode ? '<span class="cw2-hard-badge">HARD 🔥</span>' : ''}
        </div>
        <div class="cw2-hud">
          <div class="cw2-lives"></div>
          <div class="cw2-hud-right">
            <div class="cw2-hud-item"><span class="cw2-score-val">0</span><small>score</small></div>
            <div class="cw2-hud-item"><span class="cw2-streak-val">0</span><small>streak 🔥</small></div>
            <div class="cw2-hud-item"><span class="cw2-words-left">0/${gameLayout.length}</span><small>solved</small></div>
          </div>
        </div>
        <div class="cw2-active-meta-bar">
          <div class="cw2-timer-bar"><div class="cw2-timer-fill" data-urgency="ok"></div></div>
          <div class="cw2-active-meta"><span class="cw2-meta-placeholder">← Click a clue or grid cell</span></div>
          <span class="cw2-timer-val">—</span>
        </div>
      </div>

      <div class="cw2-body">
        <div class="cw2-grid-wrap" id="cw2GridWrap"></div>
        <div class="cw2-clues"></div>
      </div>

      <div class="cw2-flash-msg" aria-live="assertive"></div>
      <div class="cw2-combo" aria-live="polite"></div>
      <div class="cw2-endpanel" aria-live="polite"></div>
    </div>
  `;

  const gridWrap = rootEl.querySelector('#cw2GridWrap');
  gridWrap.appendChild(renderGrid(gameLayout, bounds));
  renderClues(numbered);
  updateHUD();

  // Auto-start first unsolved word
  setTimeout(() => {
    const first = numbered.sort((a,b)=>a.num-b.num).find(e=>wordStatus[e.word]!=='correct');
    if (first) startWord(first);
  }, 300);
}

// ─── Public init ─────────────────────────────────────────────────────────────
export function initCrossword() {
  const card     = document.getElementById('openCrosswordCard');
  const modal    = document.getElementById('crosswordModal');
  const closeBtn = document.getElementById('crosswordClose');
  const overlay  = modal?.querySelector('.modal-overlay');
  const content  = document.getElementById('crosswordContent');
  if (!card || !modal || !content) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalOpen = true;
    rootEl = content;
    initGame();
    document.addEventListener('keydown', handleCrosswordKey);
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalOpen = false;
    stopWordTimer();
    document.removeEventListener('keydown', handleCrosswordKey);
  }

  card.addEventListener('click', openModal);
  card.querySelector('.gc-btn')?.addEventListener('click', e => { e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });
}
