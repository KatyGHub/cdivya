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
  `;
  el.classList.add('show');
  document.getElementById('loading')?.classList.add('hidden');
}

async function bootstrap() {
  initCursor();

  if (!isConfigured) {
    showError('Supabase env vars not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel.');
    return;
  }

  let imageUrls = [];
  try {
    imageUrls = await fetchGalleryImages();
  } catch (err) {
    showError(`Error: ${err.message}`);
    return;
  }

  if (!imageUrls.length) {
    showError('No images loaded. Check your Supabase bucket.');
    return;
  }

  await initGallery({ imageUrls });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
