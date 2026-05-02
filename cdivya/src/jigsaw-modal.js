/**
 * jigsaw-modal.js — Preview phase → Start → timer + scoring + personal best
 */
import { JigsawPuzzle } from './jigsaw-engine.js';
import { fetchGalleryImages, isConfigured } from './supabase-images.js';

export function initJigsawModal() {
  // ── DOM refs ────────────────────────────────────────────────────────────────
  const openCard   = document.getElementById('openJigsawCard');
  const modal      = document.getElementById('jigsawModal');
  const overlay    = document.getElementById('jigsawOverlay');
  const closeBtn   = document.getElementById('jigsawClose');
  const canvasWrap = document.getElementById('jigsawCanvas');
  const progressEl = document.getElementById('jzProgress');
  const timerEl    = document.getElementById('jzTimer');
  const pieceSel   = document.getElementById('jzPieces');
  const shuffleBtn = document.getElementById('jzShuffle');
  const restartBtn = document.getElementById('jzRestart');

  // Preview overlay
  const previewEl  = document.getElementById('jzPreview');
  const previewImg = document.getElementById('jzPreviewImg');
  const startBtn   = document.getElementById('jzStartBtn');
  const countdownEl= document.getElementById('jzCountdown');

  // Loading
  const loadingEl  = document.getElementById('jzLoading');

  // Solved banner
  const solvedEl   = document.getElementById('jzSolved');
  const starsEl    = document.getElementById('jzStars');
  const finalTime  = document.getElementById('jzFinalTime');
  const finalPieces= document.getElementById('jzFinalPieces');
  const finalScore = document.getElementById('jzFinalScore');
  const pbMsg      = document.getElementById('jzPbMsg');
  const bestBlock  = document.getElementById('jzBestBlock');
  const bestEl     = document.getElementById('jzBest');
  const playAgain  = document.getElementById('jzPlayAgain');
  const newImgBtn  = document.getElementById('jzNewImg');

  if (!modal || !canvasWrap) return;

  // ── State ───────────────────────────────────────────────────────────────────
  let puzzle       = null;
  let imgObjs      = [];
  let currentIdx   = 0;
  let totalPieces  = 25;
  let initialized  = false;

  // Timer state
  let timerID      = null;
  let secs         = 0;
  let gameActive   = false;

  // Countdown state
  let countdownID  = null;

  // Personal best: keyed by piece count
  const PB_KEY = (n) => `jz_pb_${n}`;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmtTime(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

  function getBest(n) {
    const v = localStorage.getItem(PB_KEY(n));
    return v ? parseInt(v, 10) : null;
  }
  function setBest(n, s) { localStorage.setItem(PB_KEY(n), s); }

  function showLoading() { loadingEl.style.display = 'flex'; }
  function hideLoading() { loadingEl.style.display = 'none'; }

  function loadImg(src) {
    return new Promise(res => {
      const img = new Image();
      img.onload  = () => res(img);
      img.onerror = () => res(null);
      img.crossOrigin = 'anonymous';
      img.src = src;
    });
  }

  function makePlaceholders() {
    const palettes = [
      ['#FF2D55','#BF5FFF'],['#00FFBD','#FF2D55'],['#BF5FFF','#FF8C42'],
      ['#FFB800','#FF2D55'],['#00FFBD','#BF5FFF'],['#FF8C42','#00FFBD'],
    ];
    return palettes.map(([c1, c2]) => {
      const cv = document.createElement('canvas');
      cv.width = 800; cv.height = 600;
      const ctx = cv.getContext('2d');
      const g = ctx.createLinearGradient(0,0,800,600);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fillRect(0,0,800,600);
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 10; i++) {
        const x=Math.random()*800, y=Math.random()*600, r=50+Math.random()*130;
        const cg=ctx.createRadialGradient(x,y,0,x,y,r);
        cg.addColorStop(0,'white'); cg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const dataUrl = cv.toDataURL();
      const img = new Image();
      img.src = dataUrl;
      return img;
    });
  }

  async function ensureImages() {
    if (imgObjs.length) return;
    showLoading();
    let urls = [];
    if (isConfigured) urls = await fetchGalleryImages();
    if (urls.length) {
      const loaded = await Promise.all(urls.map(loadImg));
      imgObjs = loaded.filter(Boolean);
    }
    if (!imgObjs.length) imgObjs = makePlaceholders();
    hideLoading();
  }

  // ── Timer ────────────────────────────────────────────────────────────────────
  function startTimer() {
    stopTimer();
    secs = 0;
    if (timerEl) timerEl.textContent = '0:00';
    timerID = setInterval(() => {
      secs++;
      if (timerEl) timerEl.textContent = fmtTime(secs);
    }, 1000);
  }
  function stopTimer() { clearInterval(timerID); timerID = null; }

  // ── Score ────────────────────────────────────────────────────────────────────
  function calcScore(seconds, pieces) {
    // Higher pieces = more points, faster = more points
    const base = pieces * 100;
    const timeBonus = Math.max(0, 3000 - seconds * 8);
    return Math.round(base + timeBonus);
  }

  function calcStars(seconds, pieces) {
    // Rough par times per piece count
    const par = { 16: 90, 25: 180, 36: 300 };
    const p = par[pieces] || 180;
    if (seconds <= p * 0.6) return 3;
    if (seconds <= p * 1.0) return 2;
    return 1;
  }

  function renderStars(n) {
    if (!starsEl) return;
    starsEl.innerHTML = [1,2,3].map(i =>
      `<span class="jz-star ${i <= n ? 'filled' : 'empty'}">${i <= n ? '★' : '☆'}</span>`
    ).join('');
  }

  // ── Preview phase ─────────────────────────────────────────────────────────────
  function showPreview() {
    stopTimer(); stopCountdown(); gameActive = false;
    solvedEl.classList.remove('visible');

    const img = imgObjs[currentIdx % imgObjs.length];
    // blob URLs from Supabase are same-origin — use directly
    previewImg.src = img.src;

    startCountdown.count = 5;
    if (countdownEl) countdownEl.textContent = '5';
    previewEl.style.display = 'flex';
    previewEl.classList.remove('fading');

    // Init puzzle engine (hidden, no pieces yet)
    if (!puzzle) {
      puzzle = new JigsawPuzzle(canvasWrap);
      puzzle.onProgress = (groupsLeft, total) => {
        const placed = total - groupsLeft;
        if (progressEl) progressEl.textContent = `${placed} / ${total}`;
      };
      puzzle.onSolved = onSolved;
    }

    // Auto-start countdown after preview renders
    startCountdown();
  }

  function startCountdown() {
    stopCountdown();
    let n = 5;
    countdownID = setInterval(() => {
      n--;
      if (countdownEl) countdownEl.textContent = n;
      if (n <= 0) {
        stopCountdown();
        triggerStart();
      }
    }, 1000);
  }
  function stopCountdown() { clearInterval(countdownID); countdownID = null; }

  function triggerStart() {
    previewEl.classList.add('fading');
    setTimeout(() => { previewEl.style.display = 'none'; }, 400);

    totalPieces = parseInt(pieceSel.value, 10);
    puzzle.setImage(imgObjs[currentIdx % imgObjs.length]);
    puzzle.start(totalPieces);
    if (progressEl) progressEl.textContent = `0 / ${totalPieces}`;

    // Show personal best
    const pb = getBest(totalPieces);
    if (pb && bestEl && bestBlock) {
      bestEl.textContent = fmtTime(pb);
      bestBlock.style.display = '';
    }

    startTimer();
    gameActive = true;
  }

  // ── Solved ───────────────────────────────────────────────────────────────────
  function onSolved() {
    stopTimer(); gameActive = false;
    const score  = calcScore(secs, totalPieces);
    const stars  = calcStars(secs, totalPieces);
    const pb     = getBest(totalPieces);
    const isNewPB = !pb || secs < pb;
    if (isNewPB) setBest(totalPieces, secs);

    if (finalTime)   finalTime.textContent   = fmtTime(secs);
    if (finalPieces) finalPieces.textContent = `${totalPieces} pcs`;
    if (finalScore)  finalScore.textContent  = score.toLocaleString();
    renderStars(stars);

    if (pbMsg) {
      pbMsg.textContent = isNewPB
        ? '🏆 New personal best!'
        : `Personal best: ${fmtTime(pb)}`;
      pbMsg.className = 'jz-pb-msg ' + (isNewPB ? 'is-pb' : '');
    }

    // Update header best
    if (bestEl && bestBlock) {
      bestEl.textContent = fmtTime(getBest(totalPieces));
      bestBlock.style.display = '';
    }

    // Staggered reveal
    setTimeout(() => solvedEl.classList.add('visible'), 300);

    // Confetti
    const confetti = document.getElementById('confettiCanvas');
    if (confetti) {
      import('./puzzle-v2.js').then(m => m.burst(confetti));
    }
  }

  // ── Game flow ────────────────────────────────────────────────────────────────
  async function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!initialized) {
      initialized = true;
      showLoading();
      await ensureImages();
      hideLoading();
    }
    showPreview();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopTimer(); stopCountdown(); gameActive = false;
  }

  function doRestart() {
    stopTimer(); stopCountdown(); gameActive = false;
    solvedEl.classList.remove('visible');
    showPreview();
  }

  function doNewImage() {
    currentIdx = (currentIdx + 1) % imgObjs.length;
    stopTimer(); stopCountdown(); gameActive = false;
    solvedEl.classList.remove('visible');
    showPreview();
  }

  // ── Events ────────────────────────────────────────────────────────────────────
  openCard?.addEventListener('click', openModal);
  openCard?.querySelector('.gc-btn')?.addEventListener('click', e => { e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  startBtn?.addEventListener('click', () => { stopCountdown(); triggerStart(); });
  pieceSel?.addEventListener('change', doRestart);
  shuffleBtn?.addEventListener('click', doNewImage);
  restartBtn?.addEventListener('click', doRestart);
  playAgain?.addEventListener('click', doRestart);
  newImgBtn?.addEventListener('click', doNewImage);

}
