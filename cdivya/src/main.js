import './style.css';
import { initCursor }       from './cursor.js';
import { initNav }          from './nav.js';
import { initParticles }    from './particles.js';
import { initScrollReveal } from './scroll-reveal.js';
import { initRunawayButtons } from './runaway.js';

// Letter easter egg messages
const LETTER_TOASTS = {
  D: "D for Designer. D for Divya. D for Dangerous talent 🎨",
  I: "I for Iconic. Also I for 'I fixed your brand guidelines' 🤫",
  V: "V for Visionary. And for Very, very annoying at spotting bad fonts 👁️",
  Y: "Y for... why is she so good at everything?? 🌈",
  A: "A for Artist. A for Ace. A for 'Already done, what's next?' ✨",
};

// Secret words typed on keyboard
const SECRET_WORDS = {
  NISHI:   "🚨 Attempting to call Nishi... connection refused. She's hiding.",
  JEFFREY: "📵 Jeffrey has been notified. He is also hiding.",
  DIVYA:   "🎂 You typed DIVYA! That's literally the whole point of this website.",
  DESIGN:  "🎨 Correct. Design is her superpower. Also her personality.",
  PHOTO:   "📸 She has 47,000 of them. All of them are perfect. Yes, all.",
};

function showToast(el, msg, duration = 2800) {
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._tid);
  el._tid = setTimeout(() => el.classList.remove('show'), duration);
}

function initLetterEasterEggs() {
  document.querySelectorAll('.dl').forEach((el) => {
    el.addEventListener('click', () => {
      const letter  = el.dataset.letter;
      const toast   = document.getElementById('letterToast');
      if (!toast || !LETTER_TOASTS[letter]) return;
      el.classList.remove('pop');
      void el.offsetWidth; // reflow
      el.classList.add('pop');
      showToast(toast, LETTER_TOASTS[letter]);
    });
  });
}

function initSecretWords() {
  const toast = document.getElementById('secretToast');
  if (!toast) return;

  let typed = '';
  const maxLen = Math.max(...Object.keys(SECRET_WORDS).map(k => k.length));

  document.addEventListener('keydown', (e) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
    typed = (typed + e.key.toUpperCase()).slice(-maxLen);
    const match = Object.keys(SECRET_WORDS).find(w => typed.endsWith(w));
    if (match) {
      showToast(toast, SECRET_WORDS[match], 3500);
      typed = '';
    }
  });
}

// Time-aware greeting
function updateGreeting() {
  const pill = document.getElementById('greetPill');
  if (!pill) return;
  const h = new Date().getHours();
  const greet = h < 12 ? '☀️ good morning, divya'
              : h < 17 ? '🌤️ good afternoon, divya'
              : h < 21 ? '🌅 good evening, divya'
              :           '🌙 still up, divya?';
  pill.textContent = greet;
}

async function bootstrap() {
  initCursor();
  initNav();
  initScrollReveal();
  updateGreeting();

  // Particles only on homepage
  if (document.getElementById('heroCanvas')) initParticles();

  // Chips float-in after title animations
  setTimeout(() => {
    document.querySelectorAll('.chip').forEach(c => c.classList.add('live'));
  }, 2200);

  // Easter eggs (homepage only)
  initLetterEasterEggs();
  initSecretWords();

  // Runaway buttons
  try {
    const { default: anime } = await import('animejs');
    initRunawayButtons(anime);
  } catch {
    // CSS-only fallback
    document.querySelectorAll('.runaway-btn').forEach((btn) => {
      const mv = () => {
        btn.style.transition = 'left .5s cubic-bezier(.34,1.56,.64,1),top .5s cubic-bezier(.34,1.56,.64,1)';
        btn.style.left = `${Math.random() * (window.innerWidth  - 150) + 40}px`;
        btn.style.top  = `${Math.random() * (window.innerHeight - 60)  + 40}px`;
      };
      btn.style.left = `${Math.random() * (window.innerWidth  - 150) + 40}px`;
      btn.style.top  = `${Math.random() * (window.innerHeight - 60)  + 40}px`;
      btn.style.opacity = '1';
      ['mouseover','touchstart','click'].forEach(ev => btn.addEventListener(ev, mv));
    });
  }
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
