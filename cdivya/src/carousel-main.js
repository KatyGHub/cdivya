/**
 * carousel-main.js — v3: Dark editorial — words AND image coexist beautifully
 * Layout: Left ~55% caption · Right ~45% photo (contained, not zoomed)
 * Words are the hero. Image accompanies. Minimal. Cinematic.
 */
import './style.css';
import { initCursor } from './cursor.js';
import { initNav }    from './nav.js';
import { fetchGalleryImages, isConfigured } from './supabase-images.js';

const CAPTIONS = [
  { text: "She paints. Actually paints. Not dabbles — paints.", attr: "Kaarthik" },
  { text: "Photography is just another language she speaks fluently.", attr: "Varshinii" },
  { text: "Graphic design is her bread and butter. She makes it look embarrassingly effortless.", attr: "Vachu" },
  { text: "She writes too. Of course she does. Why wouldn't she.", attr: "Arun" },
  { text: "When she loves you, she makes things for you. Actual, thoughtful, beautiful things.", attr: "Nivetha" },
  { text: "The food she cooks hits different. Every. Single. Time.", attr: "Harsha" },
  { text: "She is, genuinely, a brilliant human being.", attr: "Harish" },
  { text: "She catches the things you thought no one noticed. She noticed.", attr: "Hari Krishna" },
  { text: "Freelancing on her own terms. Building something real and entirely hers.", attr: "Malavikaa" },
  { text: "Her gifts aren't gifts — they're proof she was paying attention when everyone else wasn't.", attr: "Yeshu" },
  { text: "Two international trips, no parents, full send. That's just how she moves.", attr: "Nishi" },
  { text: "Every wedding, every event — she's the one behind the lens making sure we all look like we have our lives together.", attr: "Jeffrey" },
  { text: "Takes the chaos every time and still shows up. Every. Time.", attr: "Jashwanth" },
  { text: "She decided she was worth taking care of. She was right.", attr: "Aditi Nag" },
  { text: "She made our small wins feel like actual celebrations.", attr: "Gobi" },
  { text: "Every new chapter — she puts herself out there, fully, no matter how the last one went.", attr: "Deepthi" },
  { text: "That room of yours raised all of us. From school kids to the messed-up adults we became.", attr: "The whole gang" },
  { text: "Talented in ways that are genuinely hard to count.", attr: "Everyone who's worked with her" },
  { text: "Every stray animal just living its life — she sees them. She cares. Genuinely.", attr: "Every cat she's ever met" },
  { text: "First person I call when something's stuck in my head. She always helps it move.", attr: "More than one person, independently" },
];

const AUTOPLAY_MS   = 8000;
const TYPEWRITER_MS = 22;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pad(n) { return String(n).padStart(2, '0'); }

// Elegant placeholder canvas matching brand palette
function makePlaceholder(idx) {
  const pals = [
    { bg: '#0e0012', ac: '#BF5FFF', ac2: '#FF2D55' },
    { bg: '#00141a', ac: '#00FFBD', ac2: '#0088FF' },
    { bg: '#14000a', ac: '#FF2D55', ac2: '#FF8C42' },
    { bg: '#0a0a00', ac: '#FFB800', ac2: '#FF8C42' },
    { bg: '#00101c', ac: '#00FFBD', ac2: '#BF5FFF' },
  ];
  const { bg, ac, ac2 } = pals[idx % pals.length];
  const cv = document.createElement('canvas');
  cv.width = 900; cv.height = 1200; // portrait
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 900, 1200);
  const g1 = ctx.createRadialGradient(450, 300, 0, 450, 300, 550);
  g1.addColorStop(0, ac + '30'); g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, 900, 1200);
  const g2 = ctx.createRadialGradient(250, 900, 0, 250, 900, 400);
  g2.addColorStop(0, ac2 + '20'); g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, 900, 1200);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    ctx.beginPath();
    ctx.arc(Math.random()*900, Math.random()*1200, Math.random()*1.8, 0, Math.PI*2);
    ctx.fill();
  }
  return cv.toDataURL();
}

// ── State ─────────────────────────────────────────────────────────────────────
let slides       = [];
let current      = 0;
let autoplayID   = null;
let isPlaying    = true;
let typewriterID = null;
let progressRaf  = null;
let progressStart = null;

initCursor(); initNav();

const loadingEl    = document.getElementById('crLoading');
const loadFillEl   = document.getElementById('crLoadFill');
const stageEl      = document.getElementById('crStage');
const prevBtn      = document.getElementById('crPrev');
const nextBtn      = document.getElementById('crNext');
const playBtn      = document.getElementById('crPlay');
const progressFill = document.getElementById('crProgressFill');
const dotsEl       = document.getElementById('crDots');
const curEl        = document.getElementById('crCur');
const totEl        = document.getElementById('crTot');

// ── Load ─────────────────────────────────────────────────────────────────────
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
  slides = CAPTIONS.map((cap, i) => ({
    imgSrc: shuffled[i % shuffled.length],
    text:   cap.text,
    attr:   cap.attr,
  }));

  setTimeout(() => {
    loadingEl.style.opacity = '0';
    setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
    buildStage();
    goTo(0, false);
    startAutoplay();
  }, 350);
}

// ── Build stage ───────────────────────────────────────────────────────────────
function buildStage() {
  if (!stageEl) return;
  stageEl.innerHTML = '';
  if (totEl) totEl.textContent = pad(slides.length);

  slides.forEach((slide, i) => {
    const frame = document.createElement('div');
    frame.className = 'cr3-frame';
    frame.dataset.idx = i;
    frame.innerHTML = `
      <div class="cr3-left">
        <div class="cr3-index">${pad(i+1)}<span class="cr3-idx-sep"> / </span>${pad(slides.length)}</div>
        <div class="cr3-quote">"</div>
        <blockquote class="cr3-text"></blockquote>
        <div class="cr3-cursor">|</div>
        <cite class="cr3-attr"></cite>
        <div class="cr3-rule"></div>
      </div>
      <div class="cr3-right">
        <div class="cr3-img-frame">
          <img class="cr3-img" src="${slide.imgSrc}" alt="" draggable="false" loading="${i < 3 ? 'eager' : 'lazy'}" />
          <div class="cr3-img-vignette"></div>
        </div>
        <div class="cr3-img-num">${pad(i+1)}</div>
      </div>
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

// ── Typewriter ────────────────────────────────────────────────────────────────
function typewrite(frameEl, text, attr, onDone) {
  clearInterval(typewriterID);
  const textEl   = frameEl.querySelector('.cr3-text');
  const cursorEl = frameEl.querySelector('.cr3-cursor');
  const attrEl   = frameEl.querySelector('.cr3-attr');
  const ruleEl   = frameEl.querySelector('.cr3-rule');
  if (!textEl) return;
  textEl.textContent = '';
  if (attrEl)  { attrEl.textContent = ''; attrEl.style.opacity = '0'; }
  if (cursorEl) cursorEl.style.opacity = '1';
  if (ruleEl)   ruleEl.classList.remove('cr3-rule--on');
  let i = 0;
  typewriterID = setInterval(() => {
    if (i >= text.length) {
      clearInterval(typewriterID);
      if (cursorEl) cursorEl.style.opacity = '0';
      if (ruleEl) ruleEl.classList.add('cr3-rule--on');
      // Fade in attribution after text finishes
      setTimeout(() => {
        if (attrEl) { attrEl.textContent = `— ${attr}`; attrEl.style.opacity = '1'; }
        onDone?.();
      }, 300);
      return;
    }
    textEl.textContent += text[i++];
  }, TYPEWRITER_MS);
}

// ── Navigate ──────────────────────────────────────────────────────────────────
function goTo(index, animate = true) {
  const prev  = current;
  current     = ((index % slides.length) + slides.length) % slides.length;
  const frames = stageEl?.querySelectorAll('.cr3-frame') || [];

  clearInterval(typewriterID);

  frames.forEach((frame, i) => {
    frame.classList.remove('cr3-active', 'cr3-prev', 'cr3-enter-r', 'cr3-enter-l');
    const ruleEl = frame.querySelector('.cr3-rule');
    ruleEl?.classList.remove('cr3-rule--on');
    const txtEl = frame.querySelector('.cr3-text');
    if (txtEl) txtEl.textContent = '';
    const curEl2 = frame.querySelector('.cr3-cursor');
    if (curEl2) curEl2.style.opacity = '0';
    const attrEl = frame.querySelector('.cr3-attr');
    if (attrEl) { attrEl.textContent = ''; attrEl.style.opacity = '0'; }

    if (i === current) {
      if (animate) {
        frame.classList.add(index > prev ? 'cr3-enter-r' : 'cr3-enter-l');
        requestAnimationFrame(() => {
          frame.classList.add('cr3-active');
          setTimeout(() => frame.classList.remove('cr3-enter-r', 'cr3-enter-l'), 700);
          setTimeout(() => typewrite(frame, slides[i].text, slides[i].attr), 200);
        });
      } else {
        frame.classList.add('cr3-active');
        setTimeout(() => typewrite(frame, slides[i].text, slides[i].attr), 150);
      }
    } else if (i === prev) {
      frame.classList.add('cr3-prev');
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

// ── Autoplay ──────────────────────────────────────────────────────────────────
function startAutoplay() {
  stopAutoplay(); if (!isPlaying) return;
  autoplayID = setInterval(next, AUTOPLAY_MS);
  animateProgressBar();
}
function stopAutoplay()  { clearInterval(autoplayID); cancelAnimationFrame(progressRaf); }
function resetAutoplay() { stopAutoplay(); startAutoplay(); }
function togglePlay() {
  isPlaying = !isPlaying;
  if (playBtn) playBtn.textContent = isPlaying ? '⏸' : '▶';
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

// ── Events ────────────────────────────────────────────────────────────────────
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
