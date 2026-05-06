/**
 * wordle.js — DIVYADLE
 * A Divya-themed 5-letter word game. 6 guesses. Daily rotating word.
 * All secret words pulled from design, art & photography vocabulary.
 */

// ─── Word Lists ────────────────────────────────────────────────────────────────

const SECRET_WORDS = [
  'BRUSH','PIXEL','FRAME','SHOOT','LIGHT','CRAFT','BLEND','DRAFT','PRINT','BRAND',
  'GRAIN','BOKEH','SHAPE','LAYER','CURVE','SCALE','STYLE','SHARP','DEPTH','FOCUS',
  'VIVID','PRIDE','SPACE','MOODY','ADOBE','TRACE','MATTE','FLARE','COLOR','FLASH',
  'BLOOM','GLARE','STARK','CRISP','SERIF','ALIGN','SOLID','MUTED','AMBER','CORAL',
  'IVORY','SLATE','ROUGE','OCHRE','SEPIA','NUDGE','CLEAN','PLAIN','GLOSS','TONES',
];

const VALID = new Set([
  ...SECRET_WORDS,
  'ABOUT','ABOVE','ABUSE','ADULT','AFTER','AGAIN','AGENT','AGREE','AHEAD','ALARM',
  'ALBUM','ALERT','ALIEN','ALIKE','ALIVE','ALLEY','ALLOW','ALONE','ALONG','ALTER',
  'ANGEL','ANGLE','ANGRY','ANKLE','ANNEX','APART','APPLE','APPLY','ARENA','ARISE',
  'ARMOR','AROSE','ARRAY','ASIDE','ASKED','ATLAS','ATTIC','AUDIO','AUDIT','AVOID',
  'AWAKE','AWARE','AWFUL','BACON','BADGE','BAKER','BASIC','BASIS','BATCH','BEACH',
  'BEARD','BEAST','BEGAN','BEGIN','BEING','BELOW','BENCH','BIRTH','BLACK','BLADE',
  'BLANK','BLAST','BLAZE','BLEED','BLESS','BLIND','BLOCK','BLOOD','BLOWN','BLUES',
  'BOARD','BONUS','BOOST','BOXER','BRACE','BRAIN','BRAVE','BREAD','BREAK','BREED',
  'BRIBE','BRICK','BRIEF','BRING','BROAD','BROKE','BROWN','BUDDY','BUILD','BUILT',
  'BURST','BUYER','CABIN','CANDY','CARGO','CARRY','CATCH','CAUSE','CEASE','CHAIN',
  'CHAIR','CHASE','CHEAP','CHECK','CHESS','CHEST','CHIEF','CHILD','CHORE','CHUNK',
  'CIVIC','CIVIL','CLAIM','CLASS','CLEAR','CLIMB','CLOSE','CLOUD','COAST','COULD',
  'COUNT','COURT','COVER','CRACK','CRANE','CRASH','CRAZY','CREAM','CRIME','CROSS',
  'CROWD','CROWN','CRUSH','DANCE','DANDY','DIRTY','DIVER','DOUBT','DOZEN','DRAMA',
  'DREAM','DRIVE','DROVE','DRUMS','DWARF','EARLY','EARTH','EIGHT','ELITE','EMPTY',
  'ENEMY','ENJOY','ENTER','EVERY','EXACT','EXTRA','FAINT','FAIRY','FAITH','FALSE',
  'FANCY','FAULT','FEAST','FIELD','FINAL','FIRED','FIXED','FLESH','FLOAT','FLOOD',
  'FLOOR','FLOUR','FORCE','FORGE','FOUND','FRESH','FRONT','FROZE','FRUIT','FULLY',
  'FUNNY','GHOST','GIVEN','GLASS','GLOBE','GLOOM','GLORY','GRACE','GRADE','GRAND',
  'GRANT','GRASP','GRASS','GRAVE','GREAT','GREEN','GRIEF','GRIND','GROUP','GROVE',
  'GROWN','GUARD','GUIDE','GUILD','HAPPY','HARSH','HEART','HEAVY','HENCE','HOBBY',
  'HONEY','HONOR','HOUSE','HUMAN','HUMOR','IDEAL','IMAGE','IMPLY','INNER','ISSUE',
  'JEWEL','JOINT','JUDGE','JUICE','KNIFE','KNOCK','KNOWN','LABOR','LARGE','LASER',
  'LATER','LAUGH','LEARN','LEAVE','LEMON','LEVEL','LIMIT','LIVER','LOCAL','LOOSE',
  'LOWER','LUCKY','LUNAR','MAGIC','MAJOR','MAKER','MAPLE','MARCH','MASON','MATCH',
  'MODEL','MONEY','MONTH','MORAL','MOUSE','MOVED','MOVIE','MUSIC','NERVE','NIGHT',
  'NOBLE','NOISE','NORTH','NOVEL','NURSE','OFFER','OFTEN','OCEAN','ORDER','PAINT',
  'PANEL','PAPER','PATCH','PAUSE','PEACE','PEARL','PHASE','PHOTO','PIANO','PIECE',
  'PILOT','PIZZA','PLACE','PLAID','PLANE','PLANT','PLAZA','PLEAD','PLUSH','POLAR',
  'POWER','PRESS','PRICE','PRIME','PROBE','PRONE','PROSE','QUERY','QUEUE','QUICK',
  'QUIET','QUOTE','RADAR','RADIO','RAISE','RALLY','RANGE','RAPID','RATIO','REACH',
  'REALM','REBEL','REPLY','RESET','RIDER','RIGHT','RIGID','RISKY','RIVAL','ROCKY',
  'ROUND','ROUTE','ROYAL','RULER','SAINT','SCENE','SCORE','SCOUT','SENSE','SERVE',
  'SEVEN','SHADE','SHAKE','SHAME','SHIFT','SHINE','SIGHT','SINCE','SKILL','SKULL',
  'SLEEP','SLICE','SLIDE','SMALL','SMART','SMELL','SMILE','SMOKE','SOUND','SOUTH',
  'SPEAK','SPEND','SPINE','SPLIT','SPORT','SPRAY','SQUAD','STACK','STAFF','STAGE',
  'STAND','STARS','STATE','STEAL','STEAM','STEEL','STONE','STORE','STORM','STORY',
  'STRAP','STUCK','STUDY','SUGAR','SUITE','SUNNY','SUPER','SWEAR','SWEET','SWEPT',
  'SWIFT','SWING','TABLE','TASTE','TEACH','TEARS','TEETH','THEME','THERE','THICK',
  'THINK','THOSE','THREE','THREW','THROW','TIGER','TIGHT','TIMES','TIRED','TITLE',
  'TOAST','TODAY','TOKEN','TOTAL','TOUCH','TOUGH','TOWER','TOXIC','TRACK','TRADE',
  'TRAIL','TRAIN','TRAIT','TREAT','TREND','TRIAL','TRICK','TRIED','TRULY','TRUST',
  'TRUTH','UNDER','UNION','UNITY','UNTIL','UPPER','UPSET','VALUE','VIDEO','VIGOR',
  'VIRAL','VISIT','VITAL','VOICE','WASTE','WATCH','WATER','WEARY','WEIRD','WHITE',
  'WHOLE','WOMEN','WORLD','WORSE','WORTH','WRITE','WRONG','YOUNG','YOUTH','ZEBRA',
]);

// ─── Daily Word ────────────────────────────────────────────────────────────────
function getDailyWord() {
  const d    = new Date();
  const epoch = Date.UTC(2025, 0, 1);
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diff  = Math.floor((today - epoch) / 86400000);
  return SECRET_WORDS[Math.abs(diff) % SECRET_WORDS.length];
}

// ─── State ─────────────────────────────────────────────────────────────────────
const MAX_GUESSES = 6;
const WORD_LEN    = 5;

let answer     = '';
let guesses    = [];
let currentRow = 0;
let currentStr = '';
let gameOver   = false;
let rootEl     = null;
let _keyHandler = null;

// ─── Evaluate ──────────────────────────────────────────────────────────────────
function evaluate(guess, target) {
  const result = Array(WORD_LEN).fill('absent');
  const tLeft  = target.split('');
  const gLeft  = guess.split('');
  gLeft.forEach((l, i) => {
    if (l === tLeft[i]) { result[i] = 'correct'; tLeft[i] = null; gLeft[i] = null; }
  });
  gLeft.forEach((l, i) => {
    if (!l) return;
    const j = tLeft.indexOf(l);
    if (j !== -1) { result[i] = 'present'; tLeft[j] = null; }
  });
  return result;
}

// ─── DOM ───────────────────────────────────────────────────────────────────────
function getTile(r, c) { return rootEl?.querySelector(`.wl-tile[data-r="${r}"][data-c="${c}"]`); }
function getKey(k)     { return rootEl?.querySelector(`.wl-key[data-k="${k}"]`); }

function renderInput() {
  for (let c = 0; c < WORD_LEN; c++) {
    const t = getTile(currentRow, c);
    if (!t) continue;
    const ch = currentStr[c] || '';
    t.textContent = ch;
    t.dataset.state = ch ? 'filled' : '';
  }
}

function shakeRow(r) {
  for (let c = 0; c < WORD_LEN; c++) {
    const t = getTile(r, c);
    t?.classList.add('wl-shake');
    setTimeout(() => t?.classList.remove('wl-shake'), 600);
  }
}

function revealRow(r, result, done) {
  const DELAY = 95, DUR = 400;
  for (let c = 0; c < WORD_LEN; c++) {
    const t = getTile(r, c);
    if (!t) continue;
    const state  = result[c];
    const letter = t.textContent;
    setTimeout(() => {
      t.classList.add('wl-flip-out');
      setTimeout(() => {
        t.classList.remove('wl-flip-out');
        t.classList.add('wl-flip-in', `wl-${state}`);
        t.dataset.state = state;
        const k = getKey(letter);
        if (k) {
          const pri = { correct: 3, present: 2, absent: 1 };
          const cur = k.dataset.state || '';
          if ((pri[state] || 0) > (pri[cur] || 0)) k.dataset.state = state;
        }
        setTimeout(() => t.classList.remove('wl-flip-in'), DUR);
      }, DUR / 2);
    }, c * DELAY);
  }
  setTimeout(done, WORD_LEN * DELAY + DUR + 120);
}

function bounceRow(r) {
  for (let c = 0; c < WORD_LEN; c++) {
    const t = getTile(r, c);
    setTimeout(() => t?.classList.add('wl-bounce'), c * 80);
    setTimeout(() => t?.classList.remove('wl-bounce'), c * 80 + 800);
  }
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, dur = 1800) {
  const el = rootEl?.querySelector('.wl-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), dur);
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
const LS_KEY = 'cdivya_divyadle';
function loadStats() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } }
function saveStats(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {} }

function recordResult(won, attempts) {
  const s = loadStats();
  s.played = (s.played || 0) + 1;
  s.won    = (s.won    || 0) + (won ? 1 : 0);
  s.streak = won ? (s.streak || 0) + 1 : 0;
  s.maxStreak = Math.max(s.maxStreak || 0, s.streak);
  if (won) { s.dist = s.dist || {}; s.dist[attempts] = (s.dist[attempts] || 0) + 1; }
  saveStats(s);
  return s;
}

// ─── Personality Badges ────────────────────────────────────────────────────────
function getBadge(won, attempts) {
  if (!won) return { badge: 'The Font Got Away', msg: 'It escaped. Like every deadline.', emoji: '😔' };
  const badges = [
    { badge: 'LITERALLY PSYCHIC',     msg: 'One guess. We have no explanation.',      emoji: '🔮' },
    { badge: 'Absolute Elite',         msg: 'Two guesses. That\'s art school energy.', emoji: '👑' },
    { badge: 'Golden Ratio Brain',     msg: 'Three. The mathematically perfect score.',emoji: '✨' },
    { badge: 'Not Bad For A Designer', msg: 'Four tries. Kerning still better than most.',emoji: '🎨'},
    { badge: 'The Comeback',           msg: 'Five guesses and you nailed it. Classic Divya.', emoji: '🔥'},
    { badge: 'Last Pixel Standing',    msg: 'Six. Barely. But you made it count.',     emoji: '🎲' },
  ];
  return badges[(attempts - 1)] || badges[5];
}

// ─── Result Panel ──────────────────────────────────────────────────────────────
function showResult(won, attempts) {
  const el = rootEl?.querySelector('.wl-result');
  if (!el) return;
  const s    = recordResult(won, attempts);
  const b    = getBadge(won, attempts);
  const pct  = s.played ? Math.round((s.won / s.played) * 100) : 0;

  el.innerHTML = `
    <div class="wlr-inner">
      <div class="wlr-emoji">${b.emoji}</div>
      <div class="wlr-badge">${b.badge}</div>
      <div class="wlr-tagline">${b.msg}</div>
      <div class="wlr-word">The word was <span class="wlr-answer">${answer}</span></div>
      <div class="wlr-stats">
        <div class="wlrs-box"><span>${s.played}</span><small>Played</small></div>
        <div class="wlrs-box"><span>${pct}%</span><small>Win%</small></div>
        <div class="wlrs-box"><span>${s.streak}</span><small>Streak 🔥</small></div>
        <div class="wlrs-box"><span>${s.maxStreak}</span><small>Best</small></div>
      </div>
      <button class="wlr-share" id="wlShareBtn">Share 📋</button>
    </div>
  `;

  setTimeout(() => el.classList.add('wl-result--visible'), 200);
  el.querySelector('#wlShareBtn')?.addEventListener('click', () => shareResult(won, attempts));
}

function shareResult(won, attempts) {
  const lines = [];
  for (let r = 0; r < (won ? attempts : MAX_GUESSES); r++) {
    const g = guesses[r]; if (!g) break;
    lines.push(evaluate(g, answer).map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join(''));
  }
  const txt = `DIVYADLE ${won ? attempts : 'X'}/${MAX_GUESSES}\n\n${lines.join('\n')}`;
  navigator.clipboard?.writeText(txt).then(() => toast('Copied! ✓', 1400));
}

// ─── Input ─────────────────────────────────────────────────────────────────────
function submitGuess() {
  if (currentStr.length < WORD_LEN) { shakeRow(currentRow); toast('Need 5 letters'); return; }
  const upper = currentStr.toUpperCase();
  if (!VALID.has(upper)) { shakeRow(currentRow); toast('Not in word list'); return; }

  guesses[currentRow] = upper;
  const result = evaluate(upper, answer);

  revealRow(currentRow, result, () => {
    const won = result.every(r => r === 'correct');
    if (won) {
      bounceRow(currentRow);
      setTimeout(() => showResult(true, currentRow + 1), 500);
      gameOver = true;
    } else if (currentRow + 1 >= MAX_GUESSES) {
      setTimeout(() => { toast(`The word was ${answer}`, 3200); showResult(false, 0); }, 400);
      gameOver = true;
    }
    currentRow++;
    currentStr = '';
  });
}

function handleKey(k) {
  if (gameOver) return;
  k = k.toUpperCase();
  if (k === 'ENTER' || k === '↵') {
    submitGuess();
  } else if (k === 'BACKSPACE' || k === '⌫') {
    currentStr = currentStr.slice(0, -1);
    renderInput();
  } else if (/^[A-Z]$/.test(k) && currentStr.length < WORD_LEN) {
    currentStr += k;
    renderInput();
    const t = getTile(currentRow, currentStr.length - 1);
    t?.classList.add('wl-pop');
    setTimeout(() => t?.classList.remove('wl-pop'), 130);
  }
}

// ─── Build ─────────────────────────────────────────────────────────────────────
function buildHTML() {
  let grid = '<div class="wl-grid">';
  for (let r = 0; r < MAX_GUESSES; r++) {
    grid += '<div class="wl-row">';
    for (let c = 0; c < WORD_LEN; c++) grid += `<div class="wl-tile" data-r="${r}" data-c="${c}"></div>`;
    grid += '</div>';
  }
  grid += '</div>';

  const rows = ['QWERTYUIOP', 'ASDFGHJKL', '⌫ZXCVBNM↵'];
  let kb = '<div class="wl-kb">';
  for (const row of rows) {
    kb += '<div class="wl-kb-row">';
    for (const ch of [...row]) {
      const wide  = (ch === '⌫' || ch === '↵') ? ' wl-key--wide' : '';
      const label = ch === '↵' ? 'ENTER' : ch;
      kb += `<button class="wl-key${wide}" data-k="${ch}">${label}</button>`;
    }
    kb += '</div>';
  }
  kb += '</div>';

  return `
    <div class="wl-header">
      <h2 class="wl-title">DIVYADLE</h2>
      <p class="wl-sub">Design vocabulary · 5 letters · 6 guesses · daily word</p>
    </div>
    <div class="wl-toast" aria-live="assertive"></div>
    ${grid}
    ${kb}
    <div class="wl-result" aria-live="polite"></div>
  `;
}

// ─── Public API ────────────────────────────────────────────────────────────────
export function initWordle() {
  const card    = document.getElementById('openWordleCard');
  const modal   = document.getElementById('wordleModal');
  const closeBtn = document.getElementById('wordleClose');
  const overlay = modal?.querySelector('.modal-overlay');
  const content = document.getElementById('wordleContent');
  if (!card || !modal || !content) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    startGame(content);
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    endGame();
  }

  card.addEventListener('click', openModal);
  card.querySelector('.gc-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
}

function startGame(container) {
  rootEl     = container;
  answer     = getDailyWord();
  guesses    = [];
  currentRow = 0;
  currentStr = '';
  gameOver   = false;

  rootEl.innerHTML = buildHTML();

  rootEl.querySelectorAll('.wl-key').forEach(btn => {
    btn.addEventListener('click', () => handleKey(btn.dataset.k));
  });

  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  _keyHandler = (e) => {
    if (!document.getElementById('wordleModal')?.classList.contains('open')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') handleKey('ENTER');
    else if (e.key === 'Backspace') handleKey('BACKSPACE');
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key);
  };
  document.addEventListener('keydown', _keyHandler);
}

function endGame() {
  if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
}
