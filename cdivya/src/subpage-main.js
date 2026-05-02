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
    const viewMid = window.innerHeight / 2;

    let closestDist = Infinity;
    let closestIdx  = 0;

    paras.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const elMid = rect.top + rect.height / 2;
      const dist  = Math.abs(elMid - viewMid);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });

    paras.forEach((el, i) => {
      el.classList.remove('focused', 'nearby');
      const diff = Math.abs(i - closestIdx);
      if (diff === 0) el.classList.add('focused');
      else if (diff === 1) el.classList.add('nearby');
    });

    // Progress bar height
    if (progressBar) {
      const rect  = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const pct   = Math.max(0, Math.min(1, -rect.top / total));
      const maxH  = window.innerHeight * 0.4;
      progressBar.style.height = (pct * maxH) + 'px';
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
