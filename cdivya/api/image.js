/**
 * /api/image.js
 * Vercel serverless function — proxies images from Supabase Storage.
 * The browser requests /api/image?url=... from the same domain,
 * so WebGL never sees a cross-origin image. No CORS taint. No grey boxes.
 */

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: 'Missing url param' });
    return;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    res.status(400).json({ error: 'Invalid url param' });
    return;
  }

  // Only allow Supabase Storage URLs — basic SSRF guard
  const allowed = process.env.VITE_SUPABASE_URL;
  if (allowed && !decoded.startsWith(allowed)) {
    res.status(403).json({ error: 'URL not allowed' });
    return;
  }

  try {
    const upstream = await fetch(decoded);

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer      = await upstream.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=7200, s-maxage=7200');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.status(200).end(Buffer.from(buffer));
  } catch (err) {
    console.error('[proxy] Error:', err.message);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
