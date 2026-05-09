import './style.css';
import { initCursor }       from './cursor.js';
import { initNav }          from './nav.js';
import { initScrollReveal } from './scroll-reveal.js';

function initBioSection() {
  const section    = document.getElementById('bioSection');
  const progressBar= document.getElementById('bioProgress');
  if (!section) return;

  const paras = Array.from(section.querySelectorAll('.bio-para'));
  if (!paras.length) return;

  // Show progress bar only while inside section
  const sectionObserver = new IntersectionObserver(([e]) => {
    if (progressBar) progressBar.classList.toggle('visible', e.isIntersecting);
  }, { threshold: 0 });
  sectionObserver.observe(section);

  // ── Spotlight on scroll ───────────────────────────────────────────────────
  // The paragraph whose vertical center is closest to the viewport center gets 'focused'.
  // Adjacent ones get 'nearby'. All others stay dim.
  function updateSpotlight() {
    // Use 40% from top on mobile (where viewport is shorter),
    // 50% (center) on desktop — stops two paragraphs activating simultaneously
    const focalPoint = window.innerHeight * (window.innerWidth < 768 ? 0.38 : 0.50);

    let closestDist = Infinity;
    let closestIdx  = 0;

    paras.forEach((el, i) => {
      const rect  = el.getBoundingClientRect();
      const elMid = rect.top + rect.height / 2;
      const dist  = Math.abs(elMid - focalPoint);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });

    // Only mark focused if it's actually near the focal point (not off-screen)
    const focusedRect = paras[closestIdx]?.getBoundingClientRect();
    const onScreen = focusedRect && focusedRect.bottom > 0 && focusedRect.top < window.innerHeight;

    paras.forEach((el, i) => {
      el.classList.remove('focused', 'nearby');
      if (!onScreen) return;
      const diff = Math.abs(i - closestIdx);
      if (diff === 0) el.classList.add('focused');
      else if (diff === 1) el.classList.add('nearby');
    });

    // Progress bar height
    if (progressBar) {
      const rect  = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const pct   = Math.max(0, Math.min(1, -rect.top / total));
      if (window.innerWidth <= 768) {
        progressBar.style.height = '3px';
        progressBar.style.width  = (pct * 100) + '%';
      } else {
        const maxH = window.innerHeight * 0.4;
        progressBar.style.height = (pct * maxH) + 'px';
        progressBar.style.width  = '';
      }
    }
  }

  // Run on scroll and immediately
  window.addEventListener('scroll', updateSpotlight, { passive: true });
  updateSpotlight();
}

function bootstrap() {
  initCursor();
  initNav();
  initScrollReveal();
  initBioSection();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
