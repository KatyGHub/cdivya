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

  // ── Ultra-realistic PSTN telephone ring ───────────────────────────────────
  // Real telephone ringers use a ~90V AC signal at 20Hz that vibrates an
  // electromagnetic bell. This creates a complex harmonic series, NOT a pure
  // tone. We simulate it with:
  //   • Four harmonically-related oscillators (fundamental + overtones)
  //   • A slow AM modulation at 20Hz (the mechanical bell vibration rate)
  //   • A bandpass filter centered at 800Hz (earpiece resonance)
  //   • Mild saturation via waveshaper (mechanical distortion of old ringer)
  //   • Soft noise floor (room ambience / telephone circuit hiss)

  function makeSaturator(amount) {
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    const ws = ctx.createWaveShaper();
    ws.curve = curve;
    ws.oversample = '2x';
    return ws;
  }

  function playBurst(startAt, duration) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, startAt);
    masterGain.gain.linearRampToValueAtTime(0.55, startAt + 0.018); // 18ms mechanical attack
    masterGain.gain.setValueAtTime(0.55, startAt + duration - 0.03);
    masterGain.gain.linearRampToValueAtTime(0, startAt + duration);
    masterGain.connect(ctx.destination);

    // Bandpass filter — telephone speaker resonance
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 820;
    bpf.Q.value = 1.4;
    bpf.connect(makeSaturator(18));
    makeSaturator(18).connect(masterGain);
    // Re-wire: osc → bpf → saturator → masterGain
    const sat = makeSaturator(18);
    bpf.disconnect(); bpf.connect(sat); sat.connect(masterGain);

    // Harmonic oscillators: fundamental 440Hz + 2nd + 3rd + 5th partial
    const harmonics = [
      { freq: 440,  gain: 0.55, type: 'sawtooth'  },
      { freq: 880,  gain: 0.28, type: 'square'    },
      { freq: 1320, gain: 0.14, type: 'sine'      },
      { freq: 468,  gain: 0.22, type: 'sine'      }, // slight detune for beating
    ];
    const oscMix = ctx.createGain();
    oscMix.gain.value = 0.7;
    oscMix.connect(bpf);

    harmonics.forEach(({ freq, gain: g, type }) => {
      const osc  = ctx.createOscillator();
      const gn   = ctx.createGain();
      osc.type   = type;
      osc.frequency.value = freq;
      gn.gain.value = g;
      osc.connect(gn); gn.connect(oscMix);
      osc.start(startAt); osc.stop(startAt + duration + 0.04);
      ringNodes.push(osc);
    });

    // 20Hz AM tremolo — the mechanical ringer bell rate
    const lfo      = ctx.createOscillator();
    const lfoGain  = ctx.createGain();
    const lfoBase  = ctx.createGain();
    lfo.type       = 'sine';
    lfo.frequency.value = 20;
    lfoGain.gain.value  = 0.40; // depth
    lfoBase.gain.value  = 0.60; // DC offset keeps it positive
    lfo.connect(lfoGain);
    lfoGain.connect(oscMix.gain);
    lfoBase.connect(oscMix.gain);
    lfo.start(startAt); lfo.stop(startAt + duration + 0.04);
    ringNodes.push(lfo);

    // Very soft broadband hiss — telephone circuit noise
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const noiseData   = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseHpf = ctx.createBiquadFilter();
    noiseHpf.type = 'highpass'; noiseHpf.frequency.value = 2000;
    const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.012;
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer  = noiseBuffer;
    noiseNode.loop    = true;
    noiseNode.connect(noiseHpf); noiseHpf.connect(noiseGain); noiseGain.connect(masterGain);
    noiseNode.start(startAt); noiseNode.stop(startAt + duration + 0.04);
    ringNodes.push(noiseNode);
  }

  // Indian/international PSTN: 0.4s ring · 0.2s pause · 0.4s ring · 2.0s silence
  const BURST   = 0.42;
  const GAP     = 0.20;
  const SILENCE = 2.0;
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
