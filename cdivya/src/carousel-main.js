/**
 * carousel-main.js — Immersive cinematic carousel v2
 * Full-bleed image · Ken Burns drift · typewriter caption · chapter marker
 */
import './style.css';
import { initCursor } from './cursor.js';
import { initNav }    from './nav.js';
import { fetchGalleryImages, isConfigured } from './supabase-images.js';

const CAPTIONS = [
  "She paints. Actually paints. Not dabbles — paints.",
  "Photography is just another language she speaks fluently.",
  "Graphic design is her bread and butter. She makes it look embarrassingly effortless.",
  "She writes too. Of course she does. Why wouldn't she.",
  "When she loves you, she makes things for you. Actual, thoughtful, beautiful things.",
  "The food she cooks hits different. Every. Single. Time.",
  "She is, genuinely, a brilliant human being.",
  "She catches the things you thought no one noticed. She noticed.",
  "Freelancing on her own terms. Building something real and entirely hers.",
  "Her gifts aren't gifts — they're proof she was paying attention when everyone else wasn't.",
  "Two international trips, no parents, full send. That's just how she moves.",
  "Every wedding, every event — she's the one behind the lens making sure we all look like we have our lives together.",
  "Takes the chaos every time and still shows up. Every. Time.",
  "She decided she was worth taking care of. She was right.",
  "She made our small wins feel like actual celebrations.",
  "Every new chapter — she puts herself out there, fully, no matter how the last one went.",
  "That room of yours raised all of us. From school kids to the messed-up adults we became.",
  "Talented in ways that are genuinely hard to count.",
  "Every stray animal just living its life — she sees them. She cares. Genuinely.",
  "First person I call when something's stuck in my head. She always helps it move.",
];

const AUTOPLAY_MS   = 7000;
const TYPEWRITER_MS = 26;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pad(n) { return String(n).padStart(2, '0'); }

function makePlaceholder(idx) {
  const pals = [
    ['#160030','#FF2D55'], ['#001a22','#00FFBD'], ['#200018','#BF5FFF'],
    ['#0d0d00','#FFB800'], ['#001428','#0088FF'], ['#1a1000','#FF8C42'],
    ['#0a000a','#BF5FFF'], ['#00120a','#00FFBD'], ['#1a0000','#FF2D55'],
    ['#080814','#4466FF'],
  ];
  const [bg, ac] = pals[idx % pals.length];
  const cv  = document.createElement('canvas');
  cv.width  = 1600; cv.height = 900;
  const ctx = cv.getContext('2d');
  const g   = ctx.createLinearGradient(0, 0, 1600, 900);
  g.addColorStop(0, bg); g.addColorStop(1, '#060606');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1600, 900);
  const rg = ctx.createRadialGradient(800, 450, 0, 800, 450, 650);
  rg.addColorStop(0, ac + '26'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 1600, 900);
  for (let i = 0; i < 250; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    ctx.beginPath(); ctx.arc(Math.random()*1600, Math.random()*900, Math.random()*1.4, 0, Math.PI*2); ctx.fill();
  }
  return cv.toDataURL();
}

let slides = [], current = 0, autoplayID = null, isPlaying = true;
let typewriterID = null, progressRaf = null, progressStart = null;

initCursor(); initNav();

const loadingEl   = document.getElementById('crLoading');
const loadFillEl  = document.getElementById('crLoadFill');
const stageEl     = document.getElementById('crStage');
const prevBtn     = document.getElementById('crPrev');
const nextBtn     = document.getElementById('crNext');
const playBtn     = document.getElementById('crPlay');
const progressFill= document.getElementById('crProgressFill');
const dotsEl      = document.getElementById('crDots');
const curEl       = document.getElementById('crCur');
const totEl       = document.getElementById('crTot');

async function loadImages() {
  let fakeP = 0;
  const fakeID = setInterval(() => {
    fakeP = Math.min(fakeP + Math.random() * 15, 88);
    if (loadFillEl) loadFillEl.style.width = fakeP + '%';
  }, 180);

  let imgSrcs = [];
  if (isConfigured) imgSrcs = await fetchGalleryImages();
  if (!imgSrcs.length) imgSrcs = Array.from({ length: CAPTIONS.length }, (_, i) => makePlaceholder(i));

  clearInterval(fakeID);
  if (loadFillEl) loadFillEl.style.width = '100%';

  const shuffled = shuffle(imgSrcs);
  slides = CAPTIONS.map((caption, i) => ({ imgSrc: shuffled[i % shuffled.length], caption }));

  setTimeout(() => {
    loadingEl.style.opacity = '0';
    setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
    buildStage();
    goTo(0, false);
    startAutoplay();
  }, 350);
}

function buildStage() {
  if (!stageEl) return;
  stageEl.innerHTML = '';
  if (totEl) totEl.textContent = pad(slides.length);

  slides.forEach((slide, i) => {
    const frame = document.createElement('div');
    frame.className = 'cr2-frame';
    frame.dataset.idx = i;
    frame.innerHTML = `
      <div class="cr2-img-layer">
        <img class="cr2-img" src="${slide.imgSrc}" alt="" draggable="false" loading="${i < 3 ? 'eager' : 'lazy'}" />
        <div class="cr2-overlay"></div>
      </div>
      <div class="cr2-caption-layer">
        <div class="cr2-chapter">${pad(i + 1)} — ${pad(slides.length)}</div>
        <div class="cr2-quote-glyph">"</div>
        <p class="cr2-text"></p>
        <span class="cr2-cursor">|</span>
        <div class="cr2-underline"></div>
      </div>
      <div class="cr2-lb cr2-lb-top"></div>
      <div class="cr2-lb cr2-lb-bot"></div>
    `;
    stageEl.appendChild(frame);
  });

  if (dotsEl) {
    dotsEl.innerHTML = '';
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'cr-dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.addEventListener('click', () => { goTo(i); resetAutoplay(); });
      dotsEl.appendChild(d);
    });
  }
}

function typewrite(frameEl, text, onDone) {
  clearInterval(typewriterID);
  const el     = frameEl.querySelector('.cr2-text');
  const cursor = frameEl.querySelector('.cr2-cursor');
  const uline  = frameEl.querySelector('.cr2-underline');
  if (!el) return;
  el.textContent = '';
  if (uline) uline.classList.remove('cr2-underline--on');
  if (cursor) cursor.style.opacity = '1';
  let i = 0;
  typewriterID = setInterval(() => {
    if (i >= text.length) {
      clearInterval(typewriterID);
      if (cursor) cursor.style.opacity = '0';
      if (uline)  uline.classList.add('cr2-underline--on');
      onDone?.();
      return;
    }
    el.textContent += text[i++];
  }, TYPEWRITER_MS);
}

function goTo(index, animate = true) {
  const prev = current;
  current    = ((index % slides.length) + slides.length) % slides.length;
  const frames = stageEl?.querySelectorAll('.cr2-frame') || [];

  clearInterval(typewriterID);

  frames.forEach((frame, i) => {
    frame.classList.remove('cr2-active', 'cr2-prev');
    const ul = frame.querySelector('.cr2-underline');
    if (ul) ul.classList.remove('cr2-underline--on');
    const txt = frame.querySelector('.cr2-text');
    if (txt) txt.textContent = '';
    const cur = frame.querySelector('.cr2-cursor');
    if (cur) cur.style.opacity = '0';

    if (i === current) {
      frame.classList.add('cr2-active');
      const img = frame.querySelector('.cr2-img');
      img?.classList.remove('cr2-kb');
      void img?.offsetWidth;
      img?.classList.add('cr2-kb');
      const delay = animate ? 400 : 150;
      setTimeout(() => typewrite(frame, slides[i].caption), delay);
    } else if (i === prev) {
      frame.classList.add('cr2-prev');
    }
  });

  dotsEl?.querySelectorAll('.cr-dot').forEach((d, i) => {
    d.classList.toggle('active', i === current);
    d.setAttribute('aria-selected', i === current);
  });

  if (curEl) curEl.textContent = pad(current + 1);
  resetProgressBar();
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

function startAutoplay() {
  stopAutoplay(); if (!isPlaying) return;
  autoplayID = setInterval(next, AUTOPLAY_MS);
  animateProgressBar();
}
function stopAutoplay() { clearInterval(autoplayID); cancelAnimationFrame(progressRaf); }
function resetAutoplay() { stopAutoplay(); startAutoplay(); }
function togglePlay() {
  isPlaying = !isPlaying;
  if (playBtn) { playBtn.textContent = isPlaying ? '⏸' : '▶'; }
  isPlaying ? startAutoplay() : stopAutoplay();
}

function resetProgressBar() {
  if (progressFill) { progressFill.style.transition = 'none'; progressFill.style.width = '0%'; }
  cancelAnimationFrame(progressRaf);
  requestAnimationFrame(animateProgressBar);
}
function animateProgressBar() {
  if (!isPlaying || !progressFill) return;
  progressStart = performance.now();
  function tick(now) {
    const pct = Math.min(((now - progressStart) / AUTOPLAY_MS) * 100, 100);
    progressFill.style.transition = 'none';
    progressFill.style.width = pct + '%';
    if (pct < 100) progressRaf = requestAnimationFrame(tick);
  }
  progressRaf = requestAnimationFrame(tick);
}

prevBtn?.addEventListener('click', () => { prev(); resetAutoplay(); });
nextBtn?.addEventListener('click', () => { next(); resetAutoplay(); });
playBtn?.addEventListener('click', togglePlay);
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
  if (e.key === 'ArrowLeft')  { prev(); resetAutoplay(); }
  if (e.key === ' ')          { e.preventDefault(); togglePlay(); }
});
let tStartX = 0;
document.addEventListener('touchstart', e => { tStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tStartX;
  if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); resetAutoplay(); }
});
stageEl?.addEventListener('mouseenter', stopAutoplay);
stageEl?.addEventListener('mouseleave', () => { if (isPlaying) startAutoplay(); });

loadImages();
