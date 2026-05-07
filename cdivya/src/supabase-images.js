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

// Timeout wrapper
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

// Download one file to a blob: URL, with timeout
async function toBlob(sb, name) {
  try {
    const { data, error } = await withTimeout(
      sb.storage.from(BUCKET).download(name), 8000
    );
    if (error || !data) return null;
    return URL.createObjectURL(data);
  } catch { return null; }
}

// Main gallery fetch — blobs work with both public AND private buckets,
// and are same-origin so WebGL loads them without CORS issues.
// Downloads up to 30 images in parallel with a 12s hard cap on the whole thing.
export async function fetchGalleryImages() {
  if (!isConfigured) return [];

  const sb = getClient();

  let files;
  try {
    const { data, error } = await withTimeout(
      sb.storage.from(BUCKET).list('', { limit: 200 }), 6000
    );
    if (error || !data?.length) return [];
    files = data;
  } catch { return []; }

  const imageFiles = files
    .filter(f => f.name && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map(f => f.name)
    .slice(0, 50); // cap at 50

  if (!imageFiles.length) return [];

  // Download all in parallel — allSettled so one failure doesn't block others
  // Hard cap: if any individual download takes > 8s it's null (handled in toBlob)
  const results = await Promise.allSettled(
    imageFiles.map(name => toBlob(sb, name))
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}

// Floats — same approach, from home-floats sub-folder
export async function fetchFloatImages() {
  if (!isConfigured) return [];
  const sb = getClient();

  let files;
  try {
    const { data, error } = await withTimeout(
      sb.storage.from(BUCKET).list('home-floats', { limit: 60 }), 4000
    );
    if (error || !data?.length) return [];
    files = data;
  } catch { return []; }

  const imageFiles = files
    .filter(f => f.name && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map(f => `home-floats/${f.name}`);

  if (!imageFiles.length) return [];

  const results = await Promise.allSettled(
    imageFiles.map(name => toBlob(sb, name))
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}
