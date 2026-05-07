/**
 * floats.js — ambient floating image layer for the home page
 * Fetches images from Supabase bucket folder "home-floats"
 * Images drift slowly, never interfere with content, live behind everything
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FLOAT_FOLDER = 'home-floats'; // sub-folder inside your gallery bucket
const FLOAT_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'gallery';
const isConfigured = !!(SUPABASE_URL && SUPABASE_KEY);

// How many images to float simultaneously
const MAX_FLOATS   = 14;
const MIN_FLOATS   = 6;

// ── Fetch images from the home-floats sub-folder ───────────────────────────
async function fetchFloatImages() {
  if (!isConfigured) return [];
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: files, error } = await sb.storage
      .from(FLOAT_BUCKET)
      .list(FLOAT_FOLDER, { limit: 60 });
    if (error || !files?.length) return [];
    const imageFiles = files
      .filter(f => f.name && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
      .map(f => `${FLOAT_FOLDER}/${f.name}`);
    if (!imageFiles.length) return [];
    const results = await Promise.all(
      imageFiles.map(async (path) => {
        try {
          const { data, error: dlErr } = await sb.storage.from(FLOAT_BUCKET).download(path);
          if (dlErr || !data) return null;
          return URL.createObjectURL(data);
        } catch { return null; }
      })
    );
    return results.filter(Boolean);
  } catch { return []; }
}

// ── Seeded random (so positions look intentional) ──────────────────────────
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Build a float element ──────────────────────────────────────────────────
function makeFloat(src, index, total) {
  const r    = rng(index * 7919 + 3571);
  const el   = document.createElement('div');
  el.className = 'hf-float';
  el.dataset.idx = index;

  // Position: spread across the page, avoiding dead center cluster
  const zones = [
    // [left%, top%, width%] — spread across viewport, avoiding hero text center
    [1,  6,  9],  [82, 4,  8],  [5,  50, 8],  [84, 48, 9],
    [0,  78, 10], [78, 78, 9],  [52, 3,  7],  [18, 88, 9],
    [62, 85, 8],  [36, 5,  7],  [90, 28, 8],  [2,  30, 9],
    [70, 18, 7],  [25, 72, 8],  [45, 90, 8],  [88, 62, 7],
  ];
  const zone  = zones[index % zones.length];
  const left  = zone[0] + r() * 3 - 1.5;
  const top   = zone[1] + r() * 4 - 2;
  const size  = zone[2] + r() * 3;

  // Gentle randomized drift path (CSS custom props)
  const dx1 = (r() - 0.5) * 40;
  const dy1 = (r() - 0.5) * 50;
  const dx2 = (r() - 0.5) * 35;
  const dy2 = (r() - 0.5) * 45;
  const rot1 = (r() - 0.5) * 6;
  const rot2 = (r() - 0.5) * 6;
  const dur  = 18 + r() * 22; // 18-40s per cycle
  const delay = r() * -20;    // start mid-cycle (negative delay)

  el.style.cssText = `
    left: ${left}vw;
    top: ${top}vh;
    width: ${size}vw;
    --dx1: ${dx1}px; --dy1: ${dy1}px;
    --dx2: ${dx2}px; --dy2: ${dy2}px;
    --rot1: ${rot1}deg; --rot2: ${rot2}deg;
    --dur: ${dur}s;
    --delay: ${delay}s;
    animation-delay: ${delay}s;
  `;

  const img  = document.createElement('img');
  img.src    = src;
  img.alt    = '';
  img.draggable = false;
  img.loading = 'lazy';
  el.appendChild(img);

  // Fade in once loaded
  img.addEventListener('load', () => {
    el.classList.add('hf-loaded');
  });

  return el;
}

// ── Main export ────────────────────────────────────────────────────────────
export async function initFloats() {
  // Create container — sits behind hero bg, above body bg
  const container = document.createElement('div');
  container.id    = 'homeFloats';
  container.className = 'hf-container';
  document.body.prepend(container);

  let imgs = await fetchFloatImages();

  // If no Supabase images, generate abstract gradient shapes as fallback
  if (!imgs.length) {
    const pals = [
      ['#160030','#BF5FFF'],['#001a22','#00FFBD'],['#200010','#FF2D55'],
      ['#101000','#FFB800'],['#001428','#00FFBD'],['#0a000a','#BF5FFF'],
      ['#001010','#00FFBD'],['#1a0008','#FF2D55'],['#080814','#4466FF'],
      ['#1a0800','#FF8C42'],['#000a14','#00FFBD'],['#0a0020','#BF5FFF'],
    ];
    imgs = pals.map(([bg, ac]) => {
      const cv = document.createElement('canvas');
      cv.width = 240; cv.height = 320;
      const ctx = cv.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 240, 320);
      g.addColorStop(0, bg); g.addColorStop(1, '#040404');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 240, 320);
      const rg = ctx.createRadialGradient(120, 120, 0, 120, 120, 160);
      rg.addColorStop(0, ac + '30'); rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, 240, 320);
      return cv.toDataURL();
    });
  }

  // Shuffle
  const shuffled = [...imgs].sort(() => Math.random() - 0.5);
  const count    = Math.min(Math.max(shuffled.length, MIN_FLOATS), MAX_FLOATS);

  for (let i = 0; i < count; i++) {
    const float = makeFloat(shuffled[i % shuffled.length], i, count);
    container.appendChild(float);
  }
}
