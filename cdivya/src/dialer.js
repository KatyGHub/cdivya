/**
 * dialer.js — iPhone-style calling loop trap
 * Jeffrey ↔ Nishi loop. Escape: open dialpad, type 11051999.
 */

const CONTACTS = [
  { name: 'Jeffrey',  initials: 'J',  color: ['#34C759', '#1a7a2e'] },
  { name: 'Nishi',    initials: 'N',  color: ['#BF5FFF', '#6b1fa8'] },
];
const ESCAPE_CODE = '11051999';

/* ─── Audio ──────────────────────────────────────────────────────────────── */
let audioCtx = null;
let ringNodes = [];

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function stopAll() {
  ringNodes.forEach(n => { try { n.stop && n.stop(); } catch (_) {} });
  ringNodes = [];
}

function startRingback() {
  stopAll();
  const ctx = getCtx();

  // One "burst": bell-like tone using 3 harmonics with natural attack+decay envelope
  // freq: ~440Hz root + 2nd + 3rd partial, classic telephone timbre
  function playBurst(startAt, duration) {
    const freqs   = [440, 880, 1320];
    const weights = [0.55, 0.30, 0.15];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      // Sharp attack (5ms), hold, then decay over last 30% of duration
      const attackEnd = startAt + 0.005;
      const decayStart = startAt + duration * 0.7;
      g.gain.setValueAtTime(0, startAt);
      g.gain.linearRampToValueAtTime(0.32 * weights[i], attackEnd);
      g.gain.setValueAtTime(0.32 * weights[i], decayStart);
      g.gain.linearRampToValueAtTime(0, startAt + duration);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.01);
      ringNodes.push(osc);
    });
  }

  // Pattern: burst — short gap — burst — long silence — repeat
  // Burst: 0.38s | Gap: 0.22s | Burst: 0.38s | Silence: 3.2s → cycle: ~4.18s
  const BURST   = 0.38;
  const GAP     = 0.22;
  const SILENCE = 3.2;
  const CYCLE   = BURST + GAP + BURST + SILENCE;

  // Sentinel to detect stopAll() calls
  const id = Symbol();
  ringNodes.push({ stop: () => {}, _id: id });

  function scheduleCycle(startAt) {
    if (!ringNodes.some(n => n._id === id)) return; // stopped
    playBurst(startAt, BURST);
    playBurst(startAt + BURST + GAP, BURST);
    const nextAt = startAt + CYCLE;
    const delayMs = Math.max(0, (nextAt - ctx.currentTime - 0.05) * 1000);
    setTimeout(() => scheduleCycle(nextAt), delayMs);
  }

  scheduleCycle(ctx.currentTime);
}

function playHangup() {
  stopAll();
  const ctx = getCtx();
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.35, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
  g.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(480, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.18);
  osc.connect(g);
  osc.start(); osc.stop(ctx.currentTime + 0.2);
}

const DTMF = {
  '1':[697,1209],'2':[697,1336],'3':[697,1477],
  '4':[770,1209],'5':[770,1336],'6':[770,1477],
  '7':[852,1209],'8':[852,1336],'9':[852,1477],
  '*':[941,1209],'0':[941,1336],'#':[941,1477],
};
function playDTMF(key) {
  const pair = DTMF[key]; if (!pair) return;
  const ctx = getCtx();
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
  g.connect(ctx.destination);
  pair.forEach(f => {
    const osc = ctx.createOscillator();
    osc.frequency.value = f;
    osc.connect(g);
    osc.start(); osc.stop(ctx.currentTime + 0.12);
  });
}

function playWin() {
  stopAll();
  const ctx = getCtx();
  [523, 659, 784, 1047].forEach((f, i) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime + i * 0.14);
    g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.14 + 0.02);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.14 + 0.18);
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.frequency.value = f;
    osc.connect(g);
    osc.start(ctx.currentTime + i * 0.14);
    osc.stop(ctx.currentTime + i * 0.14 + 0.2);
  });
}

/* ─── State ─────────────────────────────────────────────────────────────── */
let currentIdx  = 0;
let callTimer   = null;
let callSeconds = 0;
let dialInput   = '';
let numpadOpen  = false;
let busy        = false;

/* ─── DOM refs ───────────────────────────────────────────────────────────── */
let overlay, screen, nameEl, initialsEl, avatarEl, statusEl,
    timerEl, keypadBtn, hangupBtn, numpadEl, numpadDisplay,
    timeEl, numpadBack, callHintEl, escapedOverlay;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function pad(n) { return String(n).padStart(2, '0'); }

function updateClock() {
  const d = new Date();
  if (timeEl) timeEl.textContent = `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
}

function setContact(idx) {
  const c = CONTACTS[idx];
  nameEl.textContent     = c.name;
  initialsEl.textContent = c.initials;
  avatarEl.style.background = `radial-gradient(circle at 38% 38%, ${c.color[0]}, ${c.color[1]})`;
  statusEl.textContent   = 'Calling\u2026';
  statusEl.classList.remove('ended');
  timerEl.textContent    = '';
  callSeconds = 0;
  clearInterval(callTimer);
}

function startCallTimer() {
  clearInterval(callTimer);
  callTimer = setInterval(() => {
    callSeconds++;
    timerEl.textContent = `${pad(Math.floor(callSeconds / 60))}:${pad(callSeconds % 60)}`;
  }, 1000);
}

function resetUI() {
  screen.classList.remove('ending', 'show-numpad');
  numpadEl.classList.remove('visible');
  numpadOpen  = false;
  dialInput   = '';
  numpadDisplay.textContent = '';
  if (callHintEl) callHintEl.style.opacity = '0';
  escapedOverlay.classList.remove('active');
}

function openDialer() {
  currentIdx  = 0;
  busy        = false;
  updateClock();
  resetUI();
  setContact(currentIdx);
  overlay.classList.add('active');
  startRingback();
}

function doHangup() {
  if (busy) return;
  busy = true;
  playHangup();
  clearInterval(callTimer);
  stopAll();
  callSeconds = 0;
  timerEl.textContent  = '';
  statusEl.textContent = 'Call ended';
  statusEl.classList.add('ended');
  screen.classList.add('ending');

  numpadEl.classList.remove('visible');
  screen.classList.remove('show-numpad');
  numpadOpen = false;
  dialInput  = '';
  numpadDisplay.textContent = '';
  if (callHintEl) callHintEl.style.opacity = '0';

  setTimeout(() => {
    if (!overlay.classList.contains('active')) return;
    screen.classList.remove('ending');
    currentIdx = (currentIdx + 1) % CONTACTS.length;
    setContact(currentIdx);
    startRingback();
    busy = false;
  }, 1200);
}

function checkEscape() {
  // Keep last 8 chars for comparison
  const toCheck = dialInput.length > ESCAPE_CODE.length
    ? dialInput.slice(-ESCAPE_CODE.length)
    : dialInput;
  if (toCheck === ESCAPE_CODE) {
    stopAll();
    clearInterval(callTimer);
    playWin();
    escapedOverlay.classList.add('active');
  }
}

function toggleNumpad() {
  numpadOpen = !numpadOpen;
  numpadEl.classList.toggle('visible', numpadOpen);
  screen.classList.toggle('show-numpad', numpadOpen);
  dialInput = '';
  numpadDisplay.textContent = '';
  if (callHintEl) callHintEl.style.opacity = numpadOpen ? '1' : '0';
}

/* ─── Init ────────────────────────────────────────────────────────────────── */
export function initDialer() {
  const trigger = document.getElementById('clickbaitBtn');
  overlay        = document.getElementById('dialerOverlay');
  screen         = document.getElementById('dialerScreen');
  nameEl         = document.getElementById('dialerName');
  initialsEl     = document.getElementById('dialerInitials');
  avatarEl       = document.getElementById('dialerAvatar');
  statusEl       = document.getElementById('dialerStatus');
  timerEl        = document.getElementById('dialerTimer');
  keypadBtn      = document.getElementById('dialerKeypadBtn');
  hangupBtn      = document.getElementById('dialerHangup');
  numpadEl       = document.getElementById('dialerNumpad');
  numpadDisplay  = document.getElementById('dnpDisplay');
  timeEl         = document.getElementById('dialerTime');
  numpadBack     = document.getElementById('dnpBack');
  callHintEl     = document.getElementById('dialerHint');
  escapedOverlay = document.getElementById('dialerEscapedOverlay');

  if (!trigger || !overlay) return;

  updateClock();
  setInterval(updateClock, 10000);

  trigger.addEventListener('click', openDialer);
  hangupBtn.addEventListener('click', doHangup);
  keypadBtn.addEventListener('click', toggleNumpad);

  numpadBack?.addEventListener('click', () => {
    dialInput = dialInput.slice(0, -1);
    numpadDisplay.textContent = dialInput;
  });

  document.querySelectorAll('.dnp-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      playDTMF(k);
      dialInput += k;
      const display = dialInput.length > 10 ? dialInput.slice(-10) : dialInput;
      numpadDisplay.textContent = display;
      checkEscape();
    });
  });

  document.getElementById('escClose')?.addEventListener('click', () => {
    overlay.classList.remove('active');
    stopAll();
    clearInterval(callTimer);
    busy = false;
    setTimeout(() => {
      resetUI();
      setContact(0);
    }, 350);
  });
}
