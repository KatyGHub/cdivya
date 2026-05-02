import { fetchGalleryImages, isConfigured } from './supabase-images.js';
import { initGallery }                       from './gallery-three.js';
import { initRunawayButtons }                from './runaway.js';
import { initCursor }                        from './cursor.js';

function showError(msg) {
  const el = document.getElementById('empty');
  if (!el) return;
  el.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <div class="empty-title">Couldn't load photos</div>
    <p class="empty-sub" style="color:rgba(255,100,100,.7);font-size:.82rem;max-width:480px;">${msg}</p>
    <p class="empty-sub" style="margin-top:.5rem;">Check browser console (F12) for details.</p>
  `;
  el.classList.add('show');
  document.getElementById('loading')?.classList.add('hidden');
}

async function bootstrap() {
  initCursor();

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

  if (!isConfigured) {
    showError('Supabase env vars are not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel → Environment Variables, then redeploy.');
    return;
  }

  let imageUrls = [];
  try {
    imageUrls = await fetchGalleryImages();
  } catch (err) {
    showError(`Supabase error: ${err.message}`);
    return;
  }

  if (!imageUrls.length) {
    showError('Images were found but URLs could not be generated. If your bucket is PRIVATE, go to Supabase → Storage → Policies and add a policy allowing SELECT on your bucket for the anon role.');
    return;
  }

  initGallery({ imageUrls });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
