/**
 * main.js
 * Entry point. Bootstraps all modules after DOM is ready.
 * anime.js is loaded dynamically to avoid blocking the initial render.
 */

import './style.css';
import { initCursor }       from './cursor.js';
import { initNav }          from './nav.js';
import { initParticles }    from './particles.js';
import { initPuzzle }       from './puzzle.js';
import { initScrollReveal } from './scroll-reveal.js';
import { initRunawayButtons } from './runaway.js';

async function bootstrap() {
  // ── 1. Non-animation modules (instant) ──
  initCursor();
  initNav();
  initScrollReveal();
  initPuzzle();

  // ── 2. Hero canvas particles ──
  initParticles();

  // ── 3. Runaway buttons need anime.js ──
  try {
    const animeModule = await import('animejs');
    // animejs v3 default export works in both CJS and ESM contexts
    const anime = animeModule.default ?? animeModule;
    initRunawayButtons(anime);
  } catch (err) {
    console.warn('[cdivya] anime.js failed to load; runaway buttons will still move via CSS.', err);
    // Graceful degradation: buttons still have CSS wiggle animation
    document.querySelectorAll('.runaway-btn').forEach(btn => {
      const fallbackMove = () => {
        const vw = window.innerWidth, vh = window.innerHeight;
        btn.style.transition = 'left .6s cubic-bezier(0.34, 1.56, 0.64, 1), top .6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        btn.style.left = `${Math.random() * (vw - 140) + 20}px`;
        btn.style.top  = `${Math.random() * (vh - 60)  + 20}px`;
      };
      ['mouseover', 'touchstart', 'click'].forEach(ev => btn.addEventListener(ev, fallbackMove));
      btn.style.left = `${Math.random() * (window.innerWidth  - 140) + 20}px`;
      btn.style.top  = `${Math.random() * (window.innerHeight - 60)  + 20}px`;
      btn.style.opacity = '1';
    });
  }

  // ── 4. Floating chips appear after hero animations finish ──
  setTimeout(() => {
    document.querySelectorAll('.chip').forEach(chip => {
      chip.classList.add('visible');
    });
  }, 2200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
