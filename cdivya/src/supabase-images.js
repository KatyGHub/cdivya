import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BUCKET       = import.meta.env.VITE_SUPABASE_BUCKET || 'gallery';

export const isConfigured = !!(SUPABASE_URL && SUPABASE_KEY);

let _client = null;
function getClient() {
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return _client;
}

// ── Hard timeout wrapper ────────────────────────────────────────────────────
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

// ── Main fetch — returns public URLs instantly, no blob downloads ───────────
export async function fetchGalleryImages() {
  if (!isConfigured) return [];

  const sb = getClient();

  // Step 1: list files — hard 6s timeout, return [] if Supabase is slow
  const listResult = await withTimeout(
    sb.storage.from(BUCKET).list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } }),
    6000,
    { data: null, error: { message: 'Timeout listing bucket' } }
  );

  const { data: files, error } = listResult;
  if (error) { console.warn('[gallery] List error:', error.message); return []; }
  if (!files?.length) { console.warn('[gallery] Bucket empty.'); return []; }

  const imageFiles = files
    .filter(f => f.name && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map(f => f.name);

  if (!imageFiles.length) return [];

  // Step 2: get public URLs — this is SYNCHRONOUS, zero network calls
  // Supabase constructs the URL client-side. No waiting, no downloads.
  const urls = imageFiles.map(name => {
    const { data } = sb.storage.from(BUCKET).getPublicUrl(name);
    return data?.publicUrl || null;
  }).filter(Boolean);

  console.log(`[gallery] ${urls.length} public URLs ready (instant).`);
  return urls;
}

// ── Floats fetch (home-floats sub-folder) — same instant approach ───────────
export async function fetchFloatImages() {
  if (!isConfigured) return [];
  const sb = getClient();

  const listResult = await withTimeout(
    sb.storage.from(BUCKET).list('home-floats', { limit: 60 }),
    4000,
    { data: null, error: { message: 'Timeout' } }
  );

  const { data: files, error } = listResult;
  if (error || !files?.length) return [];

  return files
    .filter(f => f.name && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map(f => {
      const { data } = sb.storage.from(BUCKET).getPublicUrl(`home-floats/${f.name}`);
      return data?.publicUrl || null;
    })
    .filter(Boolean);
}
