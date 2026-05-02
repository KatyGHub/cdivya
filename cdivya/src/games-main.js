import './style.css';
import { initCursor }    from './cursor.js';
import { initNav }       from './nav.js';
import { initPuzzle }    from './puzzle-v2.js';
import { initCrossword } from './crossword.js';
import { initCipher }    from './cipher.js';

async function bootstrap() {
  initCursor();
  initNav();
  initPuzzle();
  initCrossword();
  initCipher();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
