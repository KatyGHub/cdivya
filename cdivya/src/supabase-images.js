/**
 * supabase-images.js
 * Fetches signed URLs from a private Supabase Storage bucket.
 * Images are never publicly accessible — each URL expires after 2 hours.
 *
 * Setup:
 *  1. Create a bucket called "gallery" in Supabase Storage
 *  2. Set it to PRIVATE
 *  3. Upload images (jpg/png/webp)
 *  4. Add to Vercel environment variables:
 *       VITE_SUPABASE_URL      = https://xxxx.supabase.co
 *       VITE_SUPABASE_PUBLISHABLE_KEY = eyJ...
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON    = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BUCKET           = 'gallery';
const SIGNED_URL_TTL   = 7200; // seconds — 2 hours

export const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON);

let _client = null;

function getClient() {
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON);
  return _client;
}

/**
 * Returns an array of signed image URLs from the Supabase gallery bucket.
 * Returns [] if Supabase is not configured yet.
 */
export async function fetchGalleryImages() {
  if (!isConfigured) return [];

  const sb = getClient();

  // 1. List all files in the bucket (handles up to 1000 — extend with offset for more)
  const { data: files, error: listErr } = await sb.storage
    .from(BUCKET)
    .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (listErr || !files?.length) {
    console.warn('[gallery] Supabase list error or empty bucket:', listErr?.message);
    return [];
  }

  // 2. Filter image files only
  const imageFiles = files
    .filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map(f => f.name);

  if (!imageFiles.length) return [];

  // 3. Batch-generate signed URLs (Supabase allows up to 500 at once)
  const BATCH = 500;
  const allUrls = [];

  for (let i = 0; i < imageFiles.length; i += BATCH) {
    const batch = imageFiles.slice(i, i + BATCH);
    const { data: signed, error: signErr } = await sb.storage
      .from(BUCKET)
      .createSignedUrls(batch, SIGNED_URL_TTL);

    if (signErr) {
      console.warn('[gallery] Signed URL error:', signErr.message);
      continue;
    }

    signed?.forEach(({ signedUrl }) => { if (signedUrl) allUrls.push(signedUrl); });
  }

  return allUrls;
}
