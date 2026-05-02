import './style.css';
import { initCursor }       from './cursor.js';
import { initNav }          from './nav.js';
import { initScrollReveal } from './scroll-reveal.js';

function initBioSection() {
  const section   = document.getElementById('bioSection');
  const progressBar = document.getElementById('bioProgress');
  if (!section) return;

  // ── Scroll-reveal for bio paragraphs ──────────────────────────────────────
  const bioEls = section.querySelectorAll('.reveal-bio');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('in-view'), delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  bioEls.forEach(el => observer.observe(el));

  // ── Reading progress bar ───────────────────────────────────────────────────
  if (progressBar) {
    const update = () => {
      const rect   = section.getBoundingClientRect();
      const total  = section.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const pct    = Math.min(scrolled / total, 1);
      progressBar.style.transform = `scaleX(${pct})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ── Highlight shimmer on hover ────────────────────────────────────────────
  section.querySelectorAll('.bio-hl').forEach(hl => {
    hl.addEventListener('mouseenter', () => {
      hl.style.background = 'linear-gradient(120deg, rgba(0,255,189,.22) 0%, rgba(191,95,255,.2) 100%)';
    });
    hl.addEventListener('mouseleave', () => {
      hl.style.background = '';
    });
  });
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
