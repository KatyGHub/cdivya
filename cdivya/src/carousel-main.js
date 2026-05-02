/**
 * carousel-main.js
 * Cinematic full-screen carousel — Supabase images + friend captions
 * Images shuffled. Captions cycled in order. Add more to CAPTIONS array anytime.
 */
import './style.css';
import { initCursor } from './cursor.js';
import { initNav }    from './nav.js';
import { fetchGalleryImages, isConfigured } from './supabase-images.js';

// ─────────────────────────────────────────────────────────────────────────────
// CAPTIONS — add more here whenever. order is preserved, images are shuffled.
// ─────────────────────────────────────────────────────────────────────────────
const CAPTIONS = [
  "She paints. Actually paints.",
  "Photography is just another language she speaks fluently.",
  "Graphic design? That's her bread and butter — and she makes it look effortless.",
  "She writes too. Of course she does.",
  "When she loves you, she makes things for you. actual, thoughtful, beautiful things.",
  "The food she makes hits different. every single time.",
  "She is, genuinely, a brilliant motherfucker.",
  "She catches the things you thought no one noticed. She noticed.",
  "Freelancing on her own terms, building something real.",
  "Her gifts aren't gifts — they're proof that she was paying attention.",
  "Two international trips, no parents, full send. That's her.",
  "Every wedding, every event — she's the one behind the lens making sure we all look like we have our lives together.",
  "Takes Aditi's shit every time and still shows up. every. time.",
  "She takes care of herself even when it costs real money and real effort. she decided she was worth it.",
  "She's the one who made our small wins feel like celebrations. We'll try to do at least 1% of what you do for us.",
  "Every new relationship — she puts herself out there, fully, no matter how the last one went.",
  "That room of yours raised all of us. from school kids to the messed-up adults we are now.",
  "She's talented in ways that are hard to count.",
  "Every stray, every animal just living its life — she sees them. She cares. genuinely.",
  "First person I call when something's stuck in my head and won't move. She always helps it move.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const AUTOPLAY_MS = 5500;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pad(n) { return String(n).padStart(2, '0'); }

function makePlaceholders(n) {
  const palettes = [
    ['#1a0030','#FF2D55'], ['#001a1a','#00FFBD'], ['#1a0010','#BF5FFF'],
    ['#0d0d00','#FFB800'], ['#001020','#00FFBD'], ['#1a1000','#FF8C42'],
  ];
  return Array.from({ length: n }, (_, i) => {
    const [bg, ac] = palettes[i % palettes.length];
    const cv = document.createElement('canvas');
    cv.width = 1200; cv.height = 800;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 1200, 800);
    g.addColorStop(0, bg); g.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1200, 800);
    const rg = ctx.createRadialGradient(600, 400, 0, 600, 400, 500);
    rg.addColorStop(0, ac + '33'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, 1200, 800);
    return cv.toDataURL();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
initCursor();
initNav();

const loadingEl   = document.getElementById('crLoading');
const loadFillEl  = document.getElementById('crLoadFill');
const slidesEl    = document.getElementById('crSlides');
const ambientEl   = document.getElementById('crAmbient');
const dotsEl      = document.getElementById('crDots');
const curEl       = document.getElementById('crCur');
const totEl       = document.getElementById('crTot');
const prevBtn     = document.getElementById('crPrev');
const nextBtn     = document.getElementById('crNext');
const playBtn     = document.getElementById('crPlay');
const progressFill= document.getElementById('crProgressFill');

let slides      = [];   // { imgSrc, caption }
let current     = 0;
let autoplayID  = null;
let isPlaying   = true;
let progressRaf = null;
let progressStart = null;

// ── Load images ──────────────────────────────────────────────────────────────
async function loadImages() {
  // Fake progress bar animation while loading
  let fakeP = 0;
  const fakeID = setInterval(() => {
    fakeP = Math.min(fakeP + Math.random() * 18, 88);
    if (loadFillEl) loadFillEl.style.width = fakeP + '%';
  }, 200);

  let imgSrcs = [];
  if (isConfigured) imgSrcs = await fetchGalleryImages();
  if (!imgSrcs.length) imgSrcs = makePlaceholders(CAPTIONS.length);

  clearInterval(fakeID);
  if (loadFillEl) loadFillEl.style.width = '100%';

  // Shuffle images, cycle captions to match
  const shuffled = shuffle(imgSrcs);
  slides = CAPTIONS.map((caption, i) => ({
    imgSrc: shuffled[i % shuffled.length],
    caption,
  }));

  setTimeout(() => {
    loadingEl.style.opacity = '0';
    setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
    buildSlides();
    goTo(0, false);
    startAutoplay();
  }, 400);
}

// ── Build DOM ────────────────────────────────────────────────────────────────
function buildSlides() {
  slidesEl.innerHTML = '';
  dotsEl.innerHTML   = '';

  if (totEl) totEl.textContent = pad(slides.length);

  slides.forEach((slide, i) => {
    // Slide
    const el = document.createElement('div');
    el.className = 'cr-slide';
    el.setAttribute('role', 'tabpanel');
    el.setAttribute('aria-label', `Slide ${i + 1}`);
    el.innerHTML = `
      <div class="cr-img-wrap">
        <img class="cr-img" src="${slide.imgSrc}" alt="Slide ${i + 1}" loading="${i < 2 ? 'eager' : 'lazy'}" draggable="false" />
        <div class="cr-vignette"></div>
      </div>
      <div class="cr-caption-wrap">
        <div class="cr-caption-inner">
          <span class="cr-quote-mark">"</span>
          <p class="cr-caption-text">${slide.caption}</p>
          <div class="cr-caption-line"></div>
        </div>
      </div>
    `;
    slidesEl.appendChild(el);

    // Dot
    const dot = document.createElement('button');
    dot.className = 'cr-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => { goTo(i); resetAutoplay(); });
    dotsEl.appendChild(dot);
  });
}

// ── Navigation ───────────────────────────────────────────────────────────────
function goTo(index, animate = true) {
  const prev = current;
  current = ((index % slides.length) + slides.length) % slides.length;

  const allSlides = slidesEl.querySelectorAll('.cr-slide');
  const allDots   = dotsEl.querySelectorAll('.cr-dot');

  allSlides.forEach((s, i) => {
    s.classList.remove('active', 'prev', 'entering-right', 'entering-left');
    if (i === current) {
      s.classList.add('active');
      if (animate) {
        s.classList.add(index > prev ? 'entering-right' : 'entering-left');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => s.classList.remove('entering-right', 'entering-left'));
        });
      }
    } else if (i === prev) {
      s.classList.add('prev');
    }
  });

  allDots.forEach((d, i) => {
    d.classList.toggle('active', i === current);
    d.setAttribute('aria-selected', i === current);
  });

  if (curEl) curEl.textContent = pad(current + 1);

  // Update ambient background
  if (ambientEl) ambientEl.style.backgroundImage = `url(${slides[current].imgSrc})`;

  resetProgressBar();
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

// ── Autoplay ─────────────────────────────────────────────────────────────────
function startAutoplay() {
  stopAutoplay();
  if (!isPlaying) return;
  autoplayID = setInterval(() => { next(); }, AUTOPLAY_MS);
  animateProgressBar();
}

function stopAutoplay() {
  clearInterval(autoplayID);
  autoplayID = null;
  cancelAnimationFrame(progressRaf);
}

function resetAutoplay() {
  stopAutoplay();
  startAutoplay();
}

function togglePlay() {
  isPlaying = !isPlaying;
  playBtn.textContent = isPlaying ? '⏸' : '▶';
  playBtn.setAttribute('aria-label', isPlaying ? 'Pause autoplay' : 'Play autoplay');
  if (isPlaying) startAutoplay(); else stopAutoplay();
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function resetProgressBar() {
  if (progressFill) { progressFill.style.transition = 'none'; progressFill.style.width = '0%'; }
  cancelAnimationFrame(progressRaf);
  requestAnimationFrame(animateProgressBar);
}

function animateProgressBar() {
  if (!isPlaying || !progressFill) return;
  progressStart = performance.now();
  function tick(now) {
    const elapsed = now - progressStart;
    const pct = Math.min((elapsed / AUTOPLAY_MS) * 100, 100);
    progressFill.style.transition = 'none';
    progressFill.style.width = pct + '%';
    if (pct < 100) progressRaf = requestAnimationFrame(tick);
  }
  progressRaf = requestAnimationFrame(tick);
}

// ── Events ────────────────────────────────────────────────────────────────────
prevBtn?.addEventListener('click', () => { prev(); resetAutoplay(); });
nextBtn?.addEventListener('click', () => { next(); resetAutoplay(); });
playBtn?.addEventListener('click', togglePlay);

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
  if (e.key === 'ArrowLeft')  { prev(); resetAutoplay(); }
  if (e.key === ' ')          { e.preventDefault(); togglePlay(); }
});

// Touch/swipe
let touchStartX = 0;
document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); resetAutoplay(); }
});

// Pause on hover over caption
document.querySelector('.carousel')?.addEventListener('mouseenter', stopAutoplay);
document.querySelector('.carousel')?.addEventListener('mouseleave', () => { if (isPlaying) startAutoplay(); });

// ── Go ────────────────────────────────────────────────────────────────────────
loadImages();
