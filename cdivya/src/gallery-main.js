import { fetchGalleryImages, isConfigured } from './supabase-images.js';
import { initGallery }                       from './gallery-three.js';
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

  if (!isConfigured) {
    showError('Supabase env vars not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel → Environment Variables, then redeploy.');
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
    showError('No images found. Check your bucket name and RLS policies in Supabase.');
    return;
  }

  await initGallery({ imageUrls });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
