import './style.css';
import { initCursor }    from './cursor.js';
import { initNav }       from './nav.js';
import { initPuzzle }    from './puzzle-v2.js';
import { initCrossword } from './crossword.js';
import { initJigsawModal } from './jigsaw-modal.js';
import { initWordle }    from './wordle.js';
import { initMathGame }  from './mathgame.js';

async function bootstrap() {
  initCursor();
  initNav();
  initPuzzle();
  initCrossword();
  initJigsawModal();
  initWordle();
  initMathGame();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
