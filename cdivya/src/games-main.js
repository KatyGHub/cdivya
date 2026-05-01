import './style.css';
import { initCursor }        from './cursor.js';
import { initNav }           from './nav.js';
import { initRunawayButtons } from './runaway.js';
import { initPuzzle }        from './puzzle-v2.js';
import { initCrossword }     from './crossword.js';
import { initCipher }        from './cipher.js';

async function bootstrap() {
  initCursor();
  initNav();
  initPuzzle();
  initCrossword();
  initCipher();

  try {
    const { default: anime } = await import('animejs');
    initRunawayButtons(anime);
  } catch {
    document.querySelectorAll('.runaway-btn').forEach((btn) => {
      const mv = () => {
        btn.style.transition = 'left .5s cubic-bezier(.34,1.56,.64,1),top .5s cubic-bezier(.34,1.56,.64,1)';
        btn.style.left = `${Math.random()*(window.innerWidth-150)+40}px`;
        btn.style.top  = `${Math.random()*(window.innerHeight-60)+40}px`;
      };
      btn.style.left = `${Math.random()*(window.innerWidth-150)+40}px`;
      btn.style.top  = `${Math.random()*(window.innerHeight-60)+40}px`;
      btn.style.opacity='1';
      ['mouseover','touchstart','click'].forEach(ev=>btn.addEventListener(ev,mv));
    });
  }
}

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
