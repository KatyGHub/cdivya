/**
 * cursor.js
 * Custom cursor: a sharp dot + a lagging ring.
 * On interactive elements the ring expands and changes colour.
 */

export function initCursor() {
  // Don't run on touch-only devices
  if ('ontouchstart' in window && !window.matchMedia('(pointer:fine)').matches) {
    document.querySelector('.cursor-dot')?.remove();
    document.querySelector('.cursor-ring')?.remove();
    return;
  }

  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let hovering = false;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });

  function tick() {
    // Dot snaps instantly
    dot.style.left = `${mx}px`;
    dot.style.top  = `${my}px`;

    // Ring lags — lerp
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = `${rx}px`;
    ring.style.top  = `${ry}px`;

    rafId = requestAnimationFrame(tick);
  }

  tick();

  // Hover detection
  const SELECTORS = 'a, button, .service-card, .game-card, .p-tile, .nav-link, .btn, .runaway-btn';

  function addHover(el) {
    el.addEventListener('mouseenter', () => {
      if (hovering) return;
      hovering = true;
      dot.classList.add('is-hovering');
      ring.classList.add('is-hovering');
    });
    el.addEventListener('mouseleave', () => {
      hovering = false;
      dot.classList.remove('is-hovering');
      ring.classList.remove('is-hovering');
    });
  }

  document.querySelectorAll(SELECTORS).forEach(addHover);

  // Watch for dynamically added elements (puzzle tiles etc.)
  const observer = new MutationObserver(() => {
    document.querySelectorAll(SELECTORS).forEach(addHover);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
