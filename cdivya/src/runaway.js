/**
 * runaway.js
 * Buttons that flee on hover/touch/click.
 * Uses anime.js for easing physics + CSS classes for the shake animation.
 */

const PADDING = 70; // keep buttons off the very edge

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function safePosition() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: clamp(Math.random() * vw, PADDING, vw - PADDING - 120),
    y: clamp(Math.random() * vh, PADDING, vh - PADDING - 40),
  };
}

function flee(btn, anime) {
  // CSS wiggle class
  btn.classList.add('is-fleeing');
  setTimeout(() => btn.classList.remove('is-fleeing'), 450);

  const { x, y } = safePosition();

  // anime.js handles the movement — easeOutElastic gives a bouncy 'run'
  anime({
    targets: btn,
    left: `${x}px`,
    top:  `${y}px`,
    easing: 'easeOutElastic(1, 0.55)',
    duration: 550 + Math.random() * 300,
  });
}

export function initRunawayButtons(anime) {
  const buttons = document.querySelectorAll('.runaway-btn');
  if (!buttons.length) return;

  // Place them at random starting positions once sizes are known
  requestAnimationFrame(() => {
    buttons.forEach((btn, i) => {
      const { x, y } = safePosition();
      btn.style.left = `${x}px`;
      btn.style.top  = `${y}px`;
      btn.style.opacity = '1';

      // Move away on every interaction
      ['mouseover', 'touchstart', 'click'].forEach((ev) => {
        btn.addEventListener(ev, (e) => {
          e.preventDefault();
          e.stopPropagation();
          flee(btn, anime);
        }, { passive: false });
      });

      // Spontaneous wander (so users can "chase" it)
      setInterval(
        () => { if (Math.random() > 0.55) flee(btn, anime); },
        6000 + i * 2500
      );
    });
  });

  // Re-randomise on resize so buttons don't fall off-screen
  window.addEventListener('resize', () => {
    buttons.forEach((btn) => {
      const { x, y } = safePosition();
      btn.style.left = `${x}px`;
      btn.style.top  = `${y}px`;
    });
  });
}
