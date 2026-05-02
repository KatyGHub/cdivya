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

export async function fetchGalleryImages() {
  if (!isConfigured) return [];

  const sb = getClient();

  console.log(`[gallery] Listing bucket "${BUCKET}"…`);
  const { data: files, error } = await sb.storage
    .from(BUCKET)
    .list('', { limit: 1000 });

  if (error) { console.error('[gallery] List error:', error.message); return []; }
  if (!files?.length) { console.warn('[gallery] Bucket empty.'); return []; }

  const imageFiles = files
    .filter(f => f.name && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map(f => f.name);

  console.log(`[gallery] ${imageFiles.length} images. Downloading as blobs…`);

  // Download each file via the Supabase SDK (handles encoding internally)
  // Convert to blob: URLs — these are same-origin so WebGL never taints
  const results = await Promise.all(
    imageFiles.map(async (name) => {
      try {
        const { data, error: dlErr } = await sb.storage.from(BUCKET).download(name);
        if (dlErr || !data) {
          console.warn('[gallery] Download failed:', name, dlErr?.message);
          return null;
        }
        return URL.createObjectURL(data);
      } catch (e) {
        console.warn('[gallery] Blob error:', name, e.message);
        return null;
      }
    })
  );

  const urls = results.filter(Boolean);
  console.log(`[gallery] ${urls.length} blob URLs ready.`);
  return urls;
}
