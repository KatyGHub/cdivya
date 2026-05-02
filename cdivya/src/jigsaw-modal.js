/**
 * jigsaw-modal.js
 * Wires the JigsawPuzzle engine into the games page modal.
 * Pulls images from Supabase if configured, else uses vivid gradient placeholders.
 */
import { JigsawPuzzle } from './jigsaw-engine.js';
import { fetchGalleryImages, isConfigured } from './supabase-images.js';

export function initJigsawModal() {
  const openCard   = document.getElementById('openJigsawCard');
  const modal      = document.getElementById('jigsawModal');
  const overlay    = document.getElementById('jigsawOverlay');
  const closeBtn   = document.getElementById('jigsawClose');
  const canvasWrap = document.getElementById('jigsawCanvas');
  const progressEl = document.getElementById('jzProgress');
  const pieceSel   = document.getElementById('jzPieces');
  const shuffleBtn = document.getElementById('jzShuffle');
  const restartBtn = document.getElementById('jzRestart');
  const loadingEl  = document.getElementById('jzLoading');
  const solvedEl   = document.getElementById('jzSolved');
  const playAgain  = document.getElementById('jzPlayAgain');
  const newImgBtn  = document.getElementById('jzNewImg');

  if (!modal || !canvasWrap) return;

  let puzzle     = null;
  let imgObjs    = [];
  let currentIdx = 0;
  let totalPieces = 25;
  let initialized = false;

  // ── Helpers ──────────────────────────────────────────────────────────────────
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
    // Vivid gradient canvases as fallback images
    const palettes = [
      ['#FF2D55','#BF5FFF'], ['#00FFBD','#FF2D55'], ['#BF5FFF','#00FFBD'],
      ['#FF8C42','#FF2D55'], ['#00FFBD','#BF5FFF'], ['#FFB800','#FF2D55'],
    ];
    return palettes.map(([c1, c2]) => {
      const cv = document.createElement('canvas');
      cv.width = 800; cv.height = 600;
      const ctx = cv.getContext('2d');
      const g = ctx.createLinearGradient(0,0,800,600);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fillRect(0,0,800,600);
      // Add a subtle pattern
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 12; i++) {
        const x = Math.random()*800, y = Math.random()*600, r = 40+Math.random()*120;
        const cg = ctx.createRadialGradient(x,y,0,x,y,r);
        cg.addColorStop(0,'white'); cg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const img = new Image();
      img.src = cv.toDataURL();
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

  function startGame() {
    solvedEl.classList.remove('visible');
    if (!puzzle) {
      puzzle = new JigsawPuzzle(canvasWrap);
      puzzle.onProgress = (groupsLeft, total) => {
        const placed = total - groupsLeft;
        if (progressEl) progressEl.textContent = `${placed} / ${total}`;
      };
      puzzle.onSolved = () => {
        solvedEl.classList.add('visible');
      };
    }
    totalPieces = parseInt(pieceSel.value, 10);
    puzzle.setImage(imgObjs[currentIdx % imgObjs.length]);
    puzzle.start(totalPieces);
    if (progressEl) progressEl.textContent = `0 / ${totalPieces}`;
  }

  async function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!initialized) {
      initialized = true;
      await ensureImages();
      startGame();
    }
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ── Events ────────────────────────────────────────────────────────────────────
  openCard?.addEventListener('click', openModal);
  openCard?.querySelector('.gc-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  pieceSel?.addEventListener('change', () => startGame());

  shuffleBtn?.addEventListener('click', () => {
    currentIdx = (currentIdx + 1) % imgObjs.length;
    startGame();
  });

  restartBtn?.addEventListener('click', () => startGame());
  playAgain?.addEventListener('click', () => { solvedEl.classList.remove('visible'); startGame(); });
  newImgBtn?.addEventListener('click', () => {
    currentIdx = (currentIdx + 1) % imgObjs.length;
    solvedEl.classList.remove('visible');
    startGame();
  });
}
