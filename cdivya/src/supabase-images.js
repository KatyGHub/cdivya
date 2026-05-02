/**
 * supabase-images.js
 * Works with both PUBLIC and PRIVATE Supabase Storage buckets.
 * Auto-detects which mode to use.
 *
 * Env vars needed in Vercel:
 *   VITE_SUPABASE_URL              = https://xxxx.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY  = sb_publishable_...
 *   VITE_SUPABASE_BUCKET           = gallery  (optional, defaults to "gallery")
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BUCKET       = import.meta.env.VITE_SUPABASE_BUCKET || 'gallery';
const SIGNED_TTL   = 7200; // 2 hours

export const isConfigured = !!(SUPABASE_URL && SUPABASE_KEY);

let _client = null;
function getClient() {
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return _client;
}

export async function fetchGalleryImages() {
  if (!isConfigured) {
    console.warn('[gallery] Supabase env vars not set.');
    return [];
  }

  const sb = getClient();

  // Step 1: List files
  console.log(`[gallery] Listing bucket "${BUCKET}"…`);
  const { data: files, error: listErr } = await sb.storage
    .from(BUCKET)
    .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (listErr) {
    console.error('[gallery] List error:', listErr.message, listErr);
    return [];
  }

  if (!files?.length) {
    console.warn('[gallery] Bucket is empty or returned no files.');
    return [];
  }

  console.log(`[gallery] Found ${files.length} files.`);

  // Step 2: Filter to image files only
  const imageFiles = files
    .filter(f => f.name && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map(f => f.name);

  if (!imageFiles.length) {
    console.warn('[gallery] No image files found (check file extensions).');
    return [];
  }

  console.log(`[gallery] ${imageFiles.length} image files found. Generating URLs…`);

  // Step 3: Try public URLs first (works if bucket is public)
  const testPublicUrl = sb.storage.from(BUCKET).getPublicUrl(imageFiles[0]);
  if (testPublicUrl?.data?.publicUrl && !testPublicUrl.data.publicUrl.includes('undefined')) {
    // Bucket is public — use direct public URLs (much faster, no expiry)
    console.log('[gallery] Bucket is PUBLIC — using direct URLs.');
    return imageFiles.map(name => sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl);
  }

  // Step 4: Bucket is private — generate signed URLs in batches
  console.log('[gallery] Bucket is PRIVATE — generating signed URLs…');
  const allUrls = [];

  for (let i = 0; i < imageFiles.length; i += 500) {
    const batch = imageFiles.slice(i, i + 500);
    const { data: signed, error: signErr } = await sb.storage
      .from(BUCKET)
      .createSignedUrls(batch, SIGNED_TTL);

    if (signErr) {
      console.error('[gallery] Signed URL error:', signErr.message);
      // If signing fails, it's likely an RLS policy issue — see README
      continue;
    }

    signed?.forEach(({ signedUrl }) => { if (signedUrl) allUrls.push(signedUrl); });
  }

  if (!allUrls.length) {
    console.error('[gallery] Could not generate any URLs. Check Supabase Storage RLS policies.');
  }

  console.log(`[gallery] ${allUrls.length} URLs ready.`);
  return allUrls;
}
