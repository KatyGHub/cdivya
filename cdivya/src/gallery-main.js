import { fetchGalleryImages, isConfigured } from './supabase-images.js';
import { initGallery }                       from './gallery-three.js';
import { initCursor }                        from './cursor.js';

// ── Fallback images — used when Supabase returns nothing or errors ───────────
// These are a set of beautiful abstract gradient data-URIs generated at runtime.
function makeFallbackUrls(count = 25) {
  const pals = [
    ['#0e0030','#BF5FFF'],['#001a22','#00FFBD'],['#200010','#FF2D55'],
    ['#0d0d00','#FFB800'],['#001428','#4466FF'],['#0a000a','#BF5FFF'],
    ['#001410','#00FFBD'],['#1a0008','#FF2D55'],['#080814','#4466FF'],
    ['#1a0800','#FF8C42'],['#000a14','#00FFBD'],['#0a0020','#BF5FFF'],
    ['#100010','#FF2D55'],['#001010','#00FFBD'],['#1a1000','#FFB800'],
  ];
  return Array.from({ length: count }, (_, i) => {
    const [bg, ac] = pals[i % pals.length];
    const cv = document.createElement('canvas');
    cv.width = 300; cv.height = 400;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 300, 400);
    g.addColorStop(0, bg); g.addColorStop(1, '#030305');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 300, 400);
    const rg = ctx.createRadialGradient(150, 150, 0, 150, 150, 200);
    rg.addColorStop(0, ac + '28'); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, 300, 400);
    // Add a subtle grid pattern for texture
    ctx.strokeStyle = ac + '08'; ctx.lineWidth = 1;
    for (let x = 0; x < 300; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 400); ctx.stroke(); }
    for (let y = 0; y < 400; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(300, y); ctx.stroke(); }
    return cv.toDataURL();
  });
}

// ── Three.js needs CORS headers for public URLs — add cache-busting param
// if the bucket doesn't have CORS configured on Supabase, Three.js won't
// be able to load the images. In that case we fall back gracefully.

async function bootstrap() {
  initCursor();

  const loadingEl = document.getElementById('loading');
  const emptyEl   = document.getElementById('empty');

  // If not configured at all, show helpful error and stop
  if (!isConfigured) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (emptyEl) {
      emptyEl.innerHTML = `
        <div class="empty-icon">📷</div>
        <div class="empty-title">Gallery not configured</div>
        <p class="empty-sub">Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel settings.</p>
      `;
      emptyEl.classList.add('show');
    }
    return;
  }

  // Fetch images — supabase-images.js has its own 6s timeout built in
  let imageUrls = [];
  try {
    imageUrls = await fetchGalleryImages();
  } catch (err) {
    console.warn('[gallery] fetchGalleryImages threw:', err.message);
  }

  // If Supabase returned nothing, use generated fallback art so the
  // gallery ALWAYS starts — never stays stuck on loading screen
  if (!imageUrls.length) {
    console.warn('[gallery] No images from Supabase — using generated fallbacks.');
    imageUrls = makeFallbackUrls(25);
  }

  // gallery-three.js uses THREE.TextureLoader with crossOrigin = 'anonymous'
  // For public Supabase buckets this works automatically.
  // If CORS blocks it, Three.js falls back to a solid colour tile per image.
  await initGallery({ imageUrls });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();
