/**
 * runaway.js — hover-only. Buttons sit still. Move ONLY when hovered.
 */

const PAD = 80;

function safePos() {
  return {
    x: PAD + Math.random() * (window.innerWidth  - PAD * 2 - 130),
    y: PAD + Math.random() * (window.innerHeight - PAD * 2 - 50),
  };
}

function flee(btn, anime) {
  btn.classList.add('fleeing');
  setTimeout(() => btn.classList.remove('fleeing'), 450);
  const { x, y } = safePos();
  anime({ targets: btn, left: `${x}px`, top: `${y}px`, easing: 'easeOutElastic(1, 0.55)', duration: 500 + Math.random() * 300 });
}

export function initRunawayButtons(anime) {
  const buttons = document.querySelectorAll('.runaway-btn');
  if (!buttons.length) return;

  requestAnimationFrame(() => {
    buttons.forEach((btn) => {
      const { x, y } = safePos();
      btn.style.left    = `${x}px`;
      btn.style.top     = `${y}px`;
      btn.style.opacity = '1';

      // Move ONLY on hover — no spontaneous wandering
      btn.addEventListener('mouseover',   (e) => { e.preventDefault(); flee(btn, anime); });
      btn.addEventListener('touchstart',  (e) => { e.preventDefault(); flee(btn, anime); }, { passive: false });
      btn.addEventListener('click',       (e) => { e.preventDefault(); flee(btn, anime); });
    });
  });

  window.addEventListener('resize', () => {
    buttons.forEach((btn) => {
      const { x, y } = safePos();
      btn.style.left = `${x}px`;
      btn.style.top  = `${y}px`;
    });
  });
}
