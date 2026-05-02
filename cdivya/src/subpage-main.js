import './style.css';
import { initCursor }       from './cursor.js';
import { initNav }          from './nav.js';
import { initScrollReveal } from './scroll-reveal.js';

function bootstrap() {
  initCursor();
  initNav();
  initScrollReveal();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
