/**
 * gallery-main.js
 * Fetches images from Supabase (signed URLs) then hands them to the Three.js gallery.
 * If Supabase isn't configured yet, shows the empty/coming-soon state.
 */

import { fetchGalleryImages, isConfigured } from './supabase-images.js';
import { initGallery }                       from './gallery-three.js';
import { initRunawayButtons }                from './runaway.js';
import { initCursor }                        from './cursor.js';

async function bootstrap() {
  initCursor();

  // ── Runaway buttons ───────────────────────────
  try {
    const { default: anime } = await import('animejs');
    initRunawayButtons(anime);
  } catch {
    document.querySelectorAll('.runaway-btn').forEach(btn => {
      const mv = () => {
        btn.style.transition = 'left .5s cubic-bezier(.34,1.56,.64,1),top .5s cubic-bezier(.34,1.56,.64,1)';
        btn.style.left = `${Math.random()*(window.innerWidth-150)+40}px`;
        btn.style.top  = `${Math.random()*(window.innerHeight-60)+40}px`;
      };
      btn.style.left = `${Math.random()*(window.innerWidth-150)+40}px`;
      btn.style.top  = `${Math.random()*(window.innerHeight-60)+40}px`;
      btn.style.opacity = '1';
      ['mouseover','touchstart','click'].forEach(ev => btn.addEventListener(ev, mv));
    });
  }

  // ── Fetch images ───────────────────────────────
  let imageUrls = [];

  if (isConfigured) {
    try {
      imageUrls = await fetchGalleryImages();
    } catch (err) {
      console.warn('[gallery] Could not load images:', err);
    }
  }

  // ── Launch Three.js gallery ────────────────────
  initGallery({
    imageUrls,
    onProgress: (pct) => {
      // loadingBar is updated inside gallery-three.js directly
    },
    onReady: () => {
      console.log('[gallery] Ready');
    },
    onEmpty: () => {
      // Empty state shown by gallery-three.js
    },
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
