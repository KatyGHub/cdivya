// src/puzzle-game-main.js
import { JigsawPuzzle }      from './jigsaw-engine.js';
import { fetchGalleryImages, isConfigured } from './supabase-images.js';
import './nav.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const container  = document.getElementById('puzzle-canvas');
const progressEl = document.getElementById('pz-progress');
const pieceSel   = document.getElementById('pz-pieces');
const shuffleBtn = document.getElementById('pz-shuffle');
const restartBtn = document.getElementById('pz-restart');
const loadOverlay= document.getElementById('pz-loading');
const solvedBnr  = document.getElementById('pz-solved');

// ── State ─────────────────────────────────────────────────────────────────────
let puzzle    = null;
let imgUrls   = [];
let imgObjs   = [];   // pre-loaded Image objects
let currentIdx = 0;
let totalPieces = 25;

// ── Boot ──────────────────────────────────────────────────────────────────────
async function init() {
  showLoading('Loading images…');

  puzzle = new JigsawPuzzle(container);

  puzzle.onProgress = (groupsLeft, total) => {
    const placed = total - groupsLeft;
    progressEl.textContent = `${placed} / ${total}`;
    progressEl.style.opacity = placed > 0 ? '1' : '0.45';
  };

  puzzle.onSolved = () => {
    solvedBnr.classList.add('visible');
  };

  // Load Supabase images (fall back to a placeholder if not configured)
  if (isConfigured) {
    imgUrls = await fetchGalleryImages();
  }

  if (!imgUrls.length) {
    // Fallback: colourful gradient placeholders so the game still works
    imgUrls = makePlaceholders(6);
  }

  // Pre-load Image objects
  imgObjs = await Promise.all(imgUrls.map(url => loadImg(url)));
  imgObjs = imgObjs.filter(Boolean);

  if (!imgObjs.length) {
    showLoading('No images found :(');
    return;
  }

  hideLoading();
  startGame();
}

function startGame() {
  solvedBnr.classList.remove('visible');
  puzzle.setImage(imgObjs[currentIdx]);
  puzzle.start(totalPieces);
  progressEl.textContent = `0 / ${totalPieces}`;
  progressEl.style.opacity = '0.45';
}

// ── Controls ──────────────────────────────────────────────────────────────────
pieceSel.addEventListener('change', () => {
  totalPieces = parseInt(pieceSel.value, 10);
  startGame();
});

shuffleBtn.addEventListener('click', () => {
  currentIdx = (currentIdx + 1) % imgObjs.length;
  startGame();
});

restartBtn.addEventListener('click', startGame);

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadImg(src) {
  return new Promise(res => {
    const img = new Image();
    img.onload  = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function makePlaceholders(n) {
  const palettes = [
    ['#FF2D55','#BF5FFF'],['#00FFBD','#FF2D55'],['#BF5FFF','#00FFBD'],
    ['#FF8C42','#FF2D55'],['#00FFBD','#BF5FFF'],['#FF2D55','#FF8C42'],
  ];
  return palettes.slice(0, n).map(([c1, c2]) => {
    const cv = document.createElement('canvas');
    cv.width = 800; cv.height = 600;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 800, 600);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 800, 600);
    return cv.toDataURL();
  });
}

function showLoading(msg) {
  loadOverlay.querySelector('p').textContent = msg;
  loadOverlay.style.display = 'flex';
}
function hideLoading() {
  loadOverlay.style.display = 'none';
}

init();
