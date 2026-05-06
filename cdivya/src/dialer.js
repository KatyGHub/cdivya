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
  ringNodes.forEach(n => { try { if (!n._sentinel) n.stop(); } catch (_) {} });
  ringNodes = [];
}

function startRingback() {
  stopAll();
  const ctx = getCtx();

  // Real telephone ring = AM modulation:
  // A ~425Hz carrier whose amplitude is tremolo'd at ~20Hz.
  // That warble is what makes it sound like "brring" not a musical tone.
  function playBurst(startAt, duration) {
    // Carrier — the base tone
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 425;

    // Second carrier slightly detuned adds thickness (like two ringer coils)
    const carrier2 = ctx.createOscillator();
    carrier2.type = 'sine';
    carrier2.frequency.value = 475;

    // Tremolo LFO — 20Hz gives the "brring" warble character
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 20;

    // LFO depth gain — controls how much the amplitude trembles
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.35;

    // Carrier gain node — LFO modulates this
    const carrierGain = ctx.createGain();
    carrierGain.gain.value = 0.35;

    // Envelope on top (sharp attack, hold, clean cutoff)
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, startAt);
    env.gain.linearRampToValueAtTime(1, startAt + 0.012);  // 12ms attack
    env.gain.setValueAtTime(1, startAt + duration - 0.025);
    env.gain.linearRampToValueAtTime(0, startAt + duration); // clean stop

    // Wire: carriers → carrierGain → env → out
    //       lfo → lfoDepth → carrierGain.gain (AM)
    lfo.connect(lfoDepth);
    lfoDepth.connect(carrierGain.gain);
    carrier.connect(carrierGain);
    carrier2.connect(carrierGain);
    carrierGain.connect(env);
    env.connect(ctx.destination);

    [carrier, carrier2, lfo].forEach(n => {
      n.start(startAt);
      n.stop(startAt + duration + 0.02);
      ringNodes.push(n);
    });
  }

  // Double-ring pattern: brring (0.4s) · pause (0.2s) · brring (0.4s) · silence (3s)
  const BURST   = 0.40;
  const GAP     = 0.20;
  const SILENCE = 3.0;
  const CYCLE   = BURST + GAP + BURST + SILENCE;

  const sentinel = { stop: () => {}, _sentinel: true };
  ringNodes.push(sentinel);

  function scheduleCycle(startAt) {
    if (!ringNodes.includes(sentinel)) return;
    playBurst(startAt, BURST);
    playBurst(startAt + BURST + GAP, BURST);
    const nextAt  = startAt + CYCLE;
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
