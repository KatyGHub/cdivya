/**
 * wordle.js — DIVYADLE v2
 * Easier to understand. Trickier to solve.
 *
 * Changes from v1:
 * - How-to panel auto-opens on first ever play (sessionStorage)
 * - Animated demo row shows the mechanic in motion
 * - Category hint shown per puzzle ("today's word is about: light & exposure")
 * - Smarter, trickier word list — design terms that sound familiar but trip you up
 * - Untried letters highlighted on keyboard (dim the used ones)
 * - Better toast copy — warmer, funnier, more specific
 * - "You're close" encouragement toast at guess 4/5
 * - Guess counter visible ("3 of 6")
 */

// ─── Word List — tricky design/photo/art vocabulary ───────────────────────────
// Each entry: [WORD, category hint, flavour clue shown on solve]
const SECRET_WORDS = [
  // Light & exposure
  ['BOKEH', 'light & optics',    'Those dreamy blurred backgrounds she creates so effortlessly.'],
  ['FLARE', 'light & optics',    'When the light source bleeds into the lens. Intentional. Always.'],
  ['GRAIN', 'film & texture',    'The texture that makes a photo feel lived-in rather than sterile.'],
  ['SHARP', 'optics',            'The first thing she checks. Always. Before anything else.'],
  ['GLARE', 'light & optics',    'The enemy of outdoor portraits. She fixes it in post anyway.'],
  ['DEPTH', 'composition',       'The illusion that a flat image has distance. She engineers it.'],
  ['LIGHT', 'fundamentals',      'Everything starts and ends here. She knows this better than anyone.'],
  // Colour
  ['OCHRE', 'colour',            'The warm earthy yellow-orange. Used with restraint. Devastatingly well.'],
  ['SEPIA', 'colour & tone',     'The warm brownish tone of aged photographs. Timeless.'],
  ['TONAL', 'colour theory',     'Related to the range of values from light to dark in an image.'],
  ['MUTED', 'colour',            'Desaturated. Quieter. Still saying everything.'],
  ['VIVID', 'colour',            'When she wants you to feel it before you understand it.'],
  ['AMBER', 'colour',            'Warm. Golden. The light at 5pm that she always shoots in.'],
  ['ROUGE', 'colour',            'French for red. She\'d know this without being told.'],
  ['IVORY', 'colour',            'Not white. Warmer than white. The difference matters.'],
  ['CORAL', 'colour',            'The colour that lives between orange and pink. Perpetually in season.'],
  ['SLATE', 'colour',            'Cool grey with a blue undertone. A sophisticated neutral.'],
  // Typography
  ['SERIF', 'typography',        'The little feet on letters. Cormorant Garamond has them. She notices.'],
  ['GLYPH', 'typography',        'A single character form. The atom of written language.'],
  ['KERNH', 'typography',        'The space between two specific letters, adjusted for optical harmony.'],
  ['TRACK', 'typography',        'Uniform spacing applied across a range of characters.'],
  ['ALEXA', 'typography',        'A typeface classification. She knows all of them.'],
  ['SPINE', 'typography',        'The curved stroke in the letter S. Yes, letters have anatomy.'],
  // Layout & composition
  ['BLEED', 'print & layout',    'When artwork extends to the very edge of the page. Intentional.'],
  ['GUTTER','print & layout',    'The inner margin where pages meet in a spread.'],
  ['MOTIF', 'design language',   'A recurring visual element that builds meaning across a system.'],
  ['SCALE', 'composition',       'The size relationship between elements. She always gets this right.'],
  ['ALIGN', 'layout',            'The invisible grid holding everything together. Her instinct.'],
  ['LAYER', 'process',           'How she builds: one decision at a time, always reversible.'],
  ['FRAME', 'composition',       'What you choose to include — and exclude — is the whole art.'],
  ['GRIDS', 'layout',            'The invisible scaffolding. Nobody sees it. Everyone feels it.'],
  // Tools & process
  ['BRUSH', 'tools',             'Digital or physical, she handles both with equal precision.'],
  ['PIXEL', 'digital',           'The smallest unit. She\'s thought about it more than most.'],
  ['TRACE', 'process',           'The first step in understanding a form is to redraw it.'],
  ['DRAFT', 'process',           'Version one is just permission to make version two better.'],
  ['BLEND', 'process',           'Where two things become one. She does this with ideas too.'],
  ['CRAFT', 'fundamentals',      'The thing you can\'t fake. Time + attention. She has both.'],
  ['PROOF', 'print process',     'The final check before committing. She never skips this.'],
  ['PATCH', 'process',           'Small correction. Big difference. She knows which is which.'],
  ['SWIPE', 'process',           'To move quickly through options. Her scroll speed is legendary.'],
  // Photography specific
  ['SHOOT', 'photography',       'The moment before the moment. She lives here.'],
  ['PRIME', 'optics',            'A fixed focal length lens. She probably owns three.'],
  ['TONES', 'photo editing',     'The complete range of values across a photograph.'],
  ['DODGE', 'darkroom',          'To selectively lighten an area. From the darkroom. She knows.'],
  ['BURST', 'photography',       'Multiple frames fired in rapid succession. Safety net for chaos.'],
  // Finishing & output
  ['GLOSS', 'finish',            'High shine paper stock. The opposite of her usual matte preference.'],
  ['MATTE', 'finish',            'Flat, non-reflective. Her preferred surface for print. Always.'],
  ['PROOF', 'print',             'Final check before the press run. One more look.'],
  ['PRINT', 'output',            'When the digital becomes physical. The moment of truth.'],
  ['STOCK', 'print',             'The paper itself. She has opinions about this. Strong ones.'],
];

// De-dupe and extract just the word strings
const WORD_ENTRIES = SECRET_WORDS.filter((e, i, arr) =>
  arr.findIndex(x => x[0] === e[0]) === i
);
const WORDS_ONLY = WORD_ENTRIES.map(e => e[0]);

const VALID = new Set([
  ...WORDS_ONLY,
  'ABOUT','ABOVE','ADULT','AFTER','AGAIN','AGENT','AGREE','AHEAD','ALARM',
  'ALBUM','ALERT','ALIVE','ALLOW','ALONE','ALTER','ANGEL','ANGLE','ANGRY',
  'APART','APPLY','ARISE','ARRAY','ASIDE','AUDIO','AVOID','AWAKE','AWARE',
  'BACON','BADGE','BASIC','BASIS','BATCH','BEACH','BEARD','BEGAN','BEGIN',
  'BEING','BELOW','BENCH','BIRTH','BLACK','BLADE','BLANK','BLAST','BLAZE',
  'BLIND','BLOCK','BLOOD','BLOWN','BLUES','BOARD','BONUS','BOOST','BRACE',
  'BRAIN','BRAVE','BREAD','BREAK','BREED','BRICK','BRIEF','BRING','BROAD',
  'BROKE','BROWN','BUDDY','BUILD','BUILT','BURST','BUYER','CABIN','CANDY',
  'CARRY','CATCH','CAUSE','CHAIN','CHAIR','CHASE','CHECK','CHESS','CHEST',
  'CHIEF','CHILD','CLAIM','CLASS','CLEAR','CLIMB','CLOSE','CLOUD','COAST',
  'COULD','COUNT','COURT','COVER','CRACK','CRANE','CRASH','CRAZY','CREAM',
  'CRIME','CROSS','CROWD','CROWN','CRUSH','DANCE','DIRTY','DOUBT','DRAMA',
  'DREAM','DRIVE','DROVE','DRUMS','EARLY','EARTH','EIGHT','ELITE','EMPTY',
  'ENEMY','ENJOY','ENTER','EVERY','EXACT','EXTRA','FAINT','FAITH','FALSE',
  'FANCY','FAULT','FEAST','FIELD','FINAL','FIRED','FIXED','FLOAT','FLOOD',
  'FLOOR','FORCE','FORGE','FOUND','FRESH','FRONT','FROZE','FULLY','FUNNY',
  'GHOST','GIVEN','GLASS','GLOBE','GLORY','GRACE','GRADE','GRAND','GRANT',
  'GRASP','GRASS','GRAVE','GREAT','GREEN','GRIEF','GRIND','GROUP','GROWN',
  'GUARD','GUIDE','HAPPY','HARSH','HEART','HEAVY','HONEY','HONOR','HOUSE',
  'HUMAN','HUMOR','IDEAL','IMAGE','INNER','JEWEL','JOINT','JUDGE','JUICE',
  'KNIFE','KNOCK','KNOWN','LABOR','LARGE','LASER','LATER','LAUGH','LEARN',
  'LEAVE','LEMON','LIMIT','LOCAL','LOOSE','LOWER','LUCKY','MAGIC','MAJOR',
  'MAKER','MARCH','MASON','MATCH','MODEL','MONEY','MONTH','MORAL','MOUSE',
  'MOVIE','MUSIC','NERVE','NIGHT','NOBLE','NOISE','NORTH','NOVEL','NURSE',
  'OFFER','OFTEN','OCEAN','ORDER','PAINT','PANEL','PAPER','PAUSE','PEACE',
  'PEARL','PHASE','PHOTO','PIANO','PIECE','PILOT','PLACE','PLANE','PLANT',
  'POWER','PRESS','PRICE','PROBE','PROSE','QUERY','QUEUE','QUICK','QUIET',
  'QUOTE','RADAR','RADIO','RAISE','RALLY','RANGE','RAPID','RATIO','REACH',
  'REALM','REBEL','REPLY','RESET','RIDER','RIGHT','RIGID','RISKY','RIVAL',
  'ROCKY','ROUND','ROUTE','ROYAL','RULER','SAINT','SCENE','SCORE','SCOUT',
  'SENSE','SERVE','SEVEN','SHADE','SHAKE','SHAME','SHIFT','SHINE','SIGHT',
  'SKILL','SKULL','SLEEP','SLICE','SLIDE','SMALL','SMART','SMELL','SMILE',
  'SMOKE','SOUND','SOUTH','SPEAK','SPEND','SPLIT','SPORT','SPRAY','SQUAD',
  'STACK','STAFF','STAGE','STAND','STARS','STATE','STEAL','STEAM','STEEL',
  'STONE','STORE','STORM','STORY','STUCK','STUDY','SUGAR','SUITE','SUNNY',
  'SUPER','SWEET','SWIFT','SWING','TABLE','TASTE','TEACH','TEARS','TEETH',
  'THEME','THICK','THINK','THREE','THROW','TIGER','TIGHT','TIMES','TIRED',
  'TITLE','TOAST','TODAY','TOKEN','TOTAL','TOUCH','TOUGH','TOWER','TRACK',
  'TRADE','TRAIL','TRAIN','TRAIT','TREAT','TREND','TRIAL','TRICK','TRIED',
  'TRULY','TRUST','TRUTH','UNDER','UNION','UNITY','UNTIL','UPPER','UPSET',
  'VALUE','VIDEO','VIRAL','VISIT','VITAL','VOICE','WASTE','WATCH','WATER',
  'WEARY','WEIRD','WHITE','WHOLE','WOMEN','WORLD','WORSE','WORTH','WRITE',
  'WRONG','YOUNG','YOUTH','ZEBRA','SHOWN','SHOWN','COLOR','STYLE','PROUD',
  'SPACE','MOODY','ADOBE','CRISP','SOLID','NUDGE','CLEAN','PLAIN','BLOOM',
  'STARK','FLASH','SHOOT','CURVE','SHAPE','BRAND','PRINT','GLOSS','GLYPH',
  'MOTIF','GRIDS','SWIPE','PRIME','TONAL','DODGE','PROOF','STOCK','GUTTER',
  'PATCH','BURST','DEPTH','FOCUS','GRAIN','SPEED','SPARE','SPARK','DRAFT',
]);

// ─── Daily Word ────────────────────────────────────────────────────────────────
function getDailyEntry() {
  const d     = new Date();
  const epoch = Date.UTC(2025, 0, 1);
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diff  = Math.floor((today - epoch) / 86400000);
  return WORD_ENTRIES[Math.abs(diff) % WORD_ENTRIES.length];
}

// ─── State ─────────────────────────────────────────────────────────────────────
const MAX_GUESSES = 6;
const WORD_LEN    = 5;

let answer      = '';
let answerEntry = null;
let guesses     = [];
let currentRow  = 0;
let currentStr  = '';
let gameOver    = false;
let rootEl      = null;
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

// ─── DOM Helpers ───────────────────────────────────────────────────────────────
function getTile(r, c) { return rootEl?.querySelector(`.wl-tile[data-r="${r}"][data-c="${c}"]`); }
function getKey(k)     { return rootEl?.querySelector(`.wl-key[data-k="${k}"]`); }

function renderInput() {
  for (let c = 0; c < WORD_LEN; c++) {
    const t  = getTile(currentRow, c);
    if (!t) continue;
    const ch = currentStr[c] || '';
    t.textContent = ch;
    t.dataset.state = ch ? 'filled' : '';
  }
  // Update guess counter
  const ctr = rootEl?.querySelector('.wl-guess-ctr');
  if (ctr) ctr.textContent = `${currentRow + 1} of ${MAX_GUESSES}`;
}

function updateGuessCounter() {
  const ctr = rootEl?.querySelector('.wl-guess-ctr');
  if (ctr) ctr.textContent = `${Math.min(currentRow + 1, MAX_GUESSES)} of ${MAX_GUESSES}`;
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

// Context-aware toast messages
const ENCOURAGE_4 = ['Two more shots. You\'ve got this.', 'Getting closer. Think design.', 'You know this world better than most.'];
const ENCOURAGE_5 = ['Last chance. Trust your instincts.', 'One more. Think: what would she use every day?', 'Final guess. Go with your gut.'];

// ─── Stats ─────────────────────────────────────────────────────────────────────
const LS_KEY = 'cdivya_divyadle_v2';
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
  if (!won) return { badge: 'Design Block', msg: 'Even the best designers need a redraw.', emoji: '😔' };
  const badges = [
    { badge: 'LITERALLY PSYCHIC',     msg: 'One guess. You either knew or you lied.',         emoji: '🔮' },
    { badge: 'Absolute Elite',         msg: 'Two guesses. That\'s just showing off.',          emoji: '👑' },
    { badge: 'Golden Ratio Brain',     msg: 'Three. The mathematically satisfying solve.',     emoji: '✨' },
    { badge: 'Good Eye',               msg: 'Four tries. Solid. Like good kerning.',           emoji: '🎨' },
    { badge: 'The Comeback',           msg: 'Five guesses. Squeezed it out. Very Divya.',      emoji: '🔥' },
    { badge: 'Last Pixel Standing',    msg: 'Six. The wire. You made it count.',               emoji: '🎲' },
  ];
  return badges[(attempts - 1)] || badges[5];
}

// ─── Result Panel ──────────────────────────────────────────────────────────────
function showResult(won, attempts) {
  const el = rootEl?.querySelector('.wl-result');
  if (!el) return;
  const s   = recordResult(won, attempts);
  const b   = getBadge(won, attempts);
  const pct = s.played ? Math.round((s.won / s.played) * 100) : 0;
  const flavour = answerEntry?.[2] || '';

  el.innerHTML = `
    <div class="wlr-inner">
      <div class="wlr-emoji">${b.emoji}</div>
      <div class="wlr-badge">${b.badge}</div>
      <div class="wlr-tagline">${b.msg}</div>
      <div class="wlr-word">The word was <span class="wlr-answer">${answer}</span></div>
      ${flavour ? `<div class="wlr-flavour">${flavour}</div>` : ''}
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
  const txt = `DIVYADLE ${won ? attempts : 'X'}/${MAX_GUESSES}\n\n${lines.join('\n')}\ncdivya.pocketprojects.in`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(txt)
      .then(() => toast('Copied! ✓', 1400))
      .catch(() => { try { fallbackCopy(txt); toast('Copied! ✓', 1400); } catch { toast(txt, 5000); } });
  } else { try { fallbackCopy(txt); toast('Copied! ✓', 1400); } catch { toast(txt, 5000); } }
}

function fallbackCopy(txt) {
  const ta = document.createElement('textarea');
  ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(ta); ta.focus(); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ─── Input ─────────────────────────────────────────────────────────────────────
function submitGuess() {
  if (currentStr.length < WORD_LEN) {
    shakeRow(currentRow);
    toast('Need 5 letters');
    return;
  }
  const upper = currentStr.toUpperCase();
  if (!VALID.has(upper)) {
    shakeRow(currentRow);
    toast('Not a word I know — try a design term');
    return;
  }

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
    } else {
      // Encouragement at guess 3 → 4 and 4 → 5
      if (currentRow === 3) {
        setTimeout(() => toast(ENCOURAGE_4[Math.floor(Math.random() * ENCOURAGE_4.length)], 2200), 600);
      } else if (currentRow === 4) {
        setTimeout(() => toast(ENCOURAGE_5[Math.floor(Math.random() * ENCOURAGE_5.length)], 2400), 600);
      }
    }
    currentRow++;
    currentStr = '';
    updateGuessCounter();
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

// ─── Build HTML ────────────────────────────────────────────────────────────────
function buildHTML(entry) {
  const [word, category] = entry;

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

  // How-to panel — detailed, with live legend dots
  const howTo = `
    <div class="wl-howto" id="wlHowTo">
      <div class="wl-howto-inner">
        <p class="wl-howto-rule">
          Guess the 5-letter word in 6 tries. Every word is from <strong>Divya's world</strong> — design, photography, art, typography. After each guess, the tiles colour-code your result.
        </p>
        <div class="wl-howto-legend">
          <div class="wl-howto-row">
            <div class="wl-demo-tile wl-correct">G</div>
            <div>
              <strong>Green</strong> — right letter, right position
            </div>
          </div>
          <div class="wl-howto-row">
            <div class="wl-demo-tile wl-present">R</div>
            <div>
              <strong>Yellow</strong> — letter is in the word, wrong position
            </div>
          </div>
          <div class="wl-howto-row">
            <div class="wl-demo-tile wl-absent">X</div>
            <div>
              <strong>Grey</strong> — letter is not in the word at all
            </div>
          </div>
        </div>
        <div class="wl-howto-example">
          <p class="wl-howto-eg-label">Example — guessing LAYER:</p>
          <div class="wl-howto-demo-row">
            <div class="wl-demo-tile wl-correct">L</div>
            <div class="wl-demo-tile wl-absent">A</div>
            <div class="wl-demo-tile wl-present">Y</div>
            <div class="wl-demo-tile wl-correct">E</div>
            <div class="wl-demo-tile wl-absent">R</div>
          </div>
          <p class="wl-howto-eg-note">
            <strong>L</strong> and <strong>E</strong> are in the right positions. <strong>Y</strong> is in the word but in a different spot. <strong>A</strong> and <strong>R</strong> are not in the word.
          </p>
        </div>
        <p class="wl-howto-tip">💡 Tip: start with a word that covers lots of common letters — RAISE, STARE, CRANE — then use what you know.</p>
      </div>
    </div>
  `;

  return `
    <div class="wl-header">
      <div class="wl-title-row">
        <h2 class="wl-title">DIVYADLE</h2>
        <button class="wl-help-btn" id="wlHelpBtn" aria-label="How to play">?</button>
      </div>
      <p class="wl-sub">
        <span class="wl-category">Category: <strong>${category}</strong></span>
        <span class="wl-day-sep">·</span>
        <span id="wlDayNum"></span>
      </p>
    </div>
    ${howTo}
    <div class="wl-toast" aria-live="assertive"></div>
    ${grid}
    <div class="wl-guess-ctr" aria-live="polite">1 of ${MAX_GUESSES}</div>
    ${kb}
    <div class="wl-result" aria-live="polite"></div>
  `;
}

// ─── Public API ────────────────────────────────────────────────────────────────
export function initWordle() {
  const card     = document.getElementById('openWordleCard');
  const modal    = document.getElementById('wordleModal');
  const closeBtn = document.getElementById('wordleClose');
  const overlay  = modal?.querySelector('.modal-overlay');
  const content  = document.getElementById('wordleContent');
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
  rootEl      = container;
  answerEntry = getDailyEntry();
  answer      = answerEntry[0];
  guesses     = [];
  currentRow  = 0;
  currentStr  = '';
  gameOver    = false;

  rootEl.innerHTML = buildHTML(answerEntry);

  // Day counter
  const dayNumEl = rootEl.querySelector('#wlDayNum');
  if (dayNumEl) {
    const epoch = Date.UTC(1999, 4, 11);
    const today = Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const day   = Math.floor((today - epoch) / 86400000);
    dayNumEl.textContent = `Day ${day.toLocaleString()} of being Divya`;
  }

  // How-to toggle
  const helpBtn = rootEl.querySelector('#wlHelpBtn');
  const howToEl = rootEl.querySelector('#wlHowTo');
  if (helpBtn && howToEl) {
    // Auto-open on first ever play
    const seen = sessionStorage.getItem('divyadle_seen');
    if (!seen) {
      howToEl.classList.add('wl-howto--open');
      helpBtn.textContent = '✕';
      sessionStorage.setItem('divyadle_seen', '1');
    }
    helpBtn.addEventListener('click', () => {
      const open = howToEl.classList.toggle('wl-howto--open');
      helpBtn.textContent = open ? '✕' : '?';
    });
  }

  // Keyboard
  rootEl.querySelectorAll('.wl-key').forEach(btn => {
    btn.addEventListener('click', () => handleKey(btn.dataset.k));
  });

  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  _keyHandler = (e) => {
    if (!document.getElementById('wordleModal')?.classList.contains('open')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter')     handleKey('ENTER');
    else if (e.key === 'Backspace') handleKey('BACKSPACE');
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key);
  };
  document.addEventListener('keydown', _keyHandler);
}

function endGame() {
  if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
}
