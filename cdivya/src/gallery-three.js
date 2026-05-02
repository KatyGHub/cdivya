/**
 * gallery-three.js
 * Three.js parallax depth gallery.
 * Adapted from the original CodePen by ol-ivier — restructured as an ES module.
 * Receives image URLs from Supabase (or fallbacks) rather than hardcoded paths.
 */

import * as THREE from 'three';

const DEPTH_LAYERS    = 5;
const IMAGES_PER_LAYER = 8;
const MAX_W = 200;
const MAX_H = 200;

const LAYER_CONFIG = [
  { scale: 1.55, speed: 85,  opacity: 1.00 },  // front — biggest, fastest, sharpest
  { scale: 1.10, speed: 45,  opacity: 0.88 },
  { scale: 0.82, speed: 32,  opacity: 0.72 },
  { scale: 0.62, speed: 22,  opacity: 0.56 },
  { scale: 0.48, speed: 14,  opacity: 0.38 },  // back — smallest, slowest, most transparent
];

function rand(min, max) { return Math.random() * (max - min) + min; }

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fallbackTexture(layerIndex) {
  const c = document.createElement('canvas');
  c.width = MAX_W; c.height = MAX_H;
  const ctx = c.getContext('2d');
  const colors = ['#1a0a10','#120a18','#0a1218','#080f14','#060a0c'];
  ctx.fillStyle = colors[layerIndex] || '#111';
  ctx.fillRect(0, 0, c.width, c.height);
  return new THREE.CanvasTexture(c);
}

export function initGallery({ imageUrls, onProgress, onReady, onEmpty }) {
  const container  = document.getElementById('container');
  const loadingBar = document.getElementById('loadingBar');
  const loadingTxt = document.getElementById('loadingText');
  const uiEl       = document.getElementById('ui');
  const emptyEl    = document.getElementById('empty');
  const loadingEl  = document.getElementById('loading');
  if (!container) return;

  // ── Empty state ──────────────────────────────────
  if (!imageUrls?.length) {
    loadingEl?.classList.add('hidden');
    emptyEl?.classList.add('show');
    onEmpty?.();
    return;
  }

  // ── Scene setup ──────────────────────────────────
  const scene    = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  let camera;
  let layers       = Array.from({ length: DEPTH_LAYERS }, () => []);
  const textures   = [];
  let loaded       = 0;
  let dragActive   = false;
  let lastX        = 0;
  let dragVelocity = 0;
  let speedFactor  = 1;
  let lastTime     = 0;
  let shuffled     = shuffleArray(imageUrls);
  let imgIdx       = 0;

  function nextUrl() {
    if (imgIdx >= shuffled.length) { shuffled = shuffleArray(imageUrls); imgIdx = 0; }
    return shuffled[imgIdx++];
  }

  // ── Resize ───────────────────────────────────────
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    if (!camera) {
      camera = new THREE.OrthographicCamera(0, w, h, 0, -1000, 1000);
      camera.position.z = 10;
    } else {
      camera.right = w; camera.top = h; camera.updateProjectionMatrix();
    }
    layers.forEach(layer => {
      layer.forEach(s => {
        scene.remove(s);
        s.material.dispose(); s.geometry.dispose();
      });
    });
    layers = Array.from({ length: DEPTH_LAYERS }, () => []);
    if (textures.length === DEPTH_LAYERS * IMAGES_PER_LAYER) fillViewport();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Load textures ─────────────────────────────────
  const loader    = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  const TOTAL     = DEPTH_LAYERS * IMAGES_PER_LAYER;

  function onLoaded(tex) {
    textures.push(tex);
    loaded++;
    const pct = Math.round((loaded / TOTAL) * 100);
    if (loadingBar) loadingBar.style.width = `${pct}%`;
    if (loadingTxt) loadingTxt.textContent = pct < 100 ? `Loading… ${pct}%` : 'Almost there…';
    onProgress?.(pct);
    if (loaded === TOTAL) start();
  }

  for (let l = 0; l < DEPTH_LAYERS; l++) {
    for (let i = 0; i < IMAGES_PER_LAYER; i++) {
      const url = nextUrl();
      loader.load(url, onLoaded, undefined, () => onLoaded(fallbackTexture(l)));
    }
  }

  // ── Sprite factory ────────────────────────────────
  function addSprite(layerIdx, startX) {
    const cfg     = LAYER_CONFIG[layerIdx];
    const texture = textures[Math.floor(Math.random() * textures.length)] || fallbackTexture(layerIdx);
    const mat     = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: cfg.opacity });
    const sprite  = new THREE.Sprite(mat);

    const img = texture.image;
    let tw = MAX_W, th = MAX_H;
    if (img?.width && img?.height) {
      const ratio = img.width / img.height;
      if (ratio > 1) { tw = MAX_W; th = MAX_W / ratio; }
      else           { th = MAX_H; tw = MAX_H * ratio; }
    }
    const sv  = rand(0.85, 1.15);
    const w   = tw * cfg.scale * sv;
    const h   = th * cfg.scale * sv;
    const gap = w * rand(0.4, 0.85);

    sprite.scale.set(w, h, 1);
    sprite.position.set(startX + w / 2 + gap, rand(h / 2, container.clientHeight - h / 2), -layerIdx * 50);
    sprite.userData = { speed: cfg.speed * rand(0.45, 1.15), width: w, height: h, seed: rand(0, 1000), baseY: sprite.position.y, opacity: cfg.opacity };
    layers[layerIdx].push(sprite);
    scene.add(sprite);
    return sprite;
  }

  function fillViewport() {
    const w = container.clientWidth;
    for (let l = 0; l < DEPTH_LAYERS; l++) {
      let rightMost = layers[l].length ? Math.max(...layers[l].map(s => s.position.x + s.userData.width / 2)) : -w;
      while (rightMost < w * 1.2) {
        addSprite(l, rightMost);
        rightMost = Math.max(...layers[l].map(s => s.position.x + s.userData.width / 2));
      }
    }
  }

  function cleanup() {
    const w = container.clientWidth, buf = w * 0.5;
    for (let l = 0; l < DEPTH_LAYERS; l++) {
      const sprites = layers[l];
      const max = IMAGES_PER_LAYER + 4;
      if (sprites.length <= max) continue;
      for (let i = sprites.length - 1; i >= 0 && sprites.length > max; i--) {
        const s = sprites[i], ud = s.userData;
        const gone = speedFactor > 0 ? (s.position.x - ud.width / 2) > (w + buf)
                                     : (s.position.x + ud.width / 2) < -buf;
        if (gone) { scene.remove(s); s.material.dispose(); sprites.splice(i, 1); }
      }
    }
  }

  // ── Animation loop ────────────────────────────────
  function animate() {
    const now = performance.now();
    const dt  = Math.min(40, now - lastTime) / 1000;
    lastTime  = now;
    const w   = container.clientWidth;

    dragVelocity *= 0.92;
    if (dragVelocity !== 0) speedFactor = Math.sign(dragVelocity);
    if (Math.random() < 0.01) cleanup();

    for (const sprites of layers) {
      if (!sprites?.length) continue;
      for (const s of sprites) {
        const ud = s.userData;
        s.position.x += ud.speed * speedFactor * dt;

        // Wrap around
        if (speedFactor > 0 && s.position.x - ud.width / 2 > w) {
          s.position.x = -ud.width / 2 - rand(0, ud.width);
        } else if (speedFactor < 0 && s.position.x + ud.width / 2 < 0) {
          s.position.x = w + ud.width / 2 + rand(0, ud.width);
        }

        // Subtle float + pulse
        const pulse = 1 + Math.sin(now * 0.001 + ud.seed) * 0.015;
        s.scale.x = ud.width  * pulse;
        s.scale.y = ud.height * pulse;
        s.position.y = ud.baseY + Math.sin(now * 0.001 + ud.seed) * 5;
        s.material.opacity = ud.opacity;
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function start() {
    fillViewport();
    loadingEl?.classList.add('hidden');
    if (uiEl) { uiEl.classList.add('show'); }
    lastTime = performance.now();
    animate();
    onReady?.();
  }

  // ── Interaction ───────────────────────────────────
  const getX = e => e.touches ? e.touches[0].clientX : e.clientX;

  container.addEventListener('mousedown', e => { dragActive = true; lastX = getX(e); });
  container.addEventListener('mousemove', e => {
    if (!dragActive) return;
    const dx = getX(e) - lastX; lastX = getX(e); dragVelocity = dx * 0.022;
  });
  window.addEventListener('mouseup', () => { dragActive = false; });

  container.addEventListener('touchstart', e => { dragActive = true; lastX = getX(e); }, { passive: true });
  container.addEventListener('touchmove',  e => {
    if (!dragActive) return;
    const dx = getX(e) - lastX; lastX = getX(e); dragVelocity = dx * 0.022;
  }, { passive: true });
  window.addEventListener('touchend', () => { dragActive = false; });

  container.addEventListener('wheel', e => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    speedFactor = Math.sign(Math.sign(speedFactor) || dir) * Math.min(5, Math.abs(speedFactor) + 0.8) * dir;
    dragVelocity = 0;
    cleanup();
  }, { passive: false });

  // ── Right-click / drag protection ────────────────
  const shield = document.getElementById('shield');
  if (shield) {
    shield.addEventListener('contextmenu', e => e.preventDefault());
    shield.addEventListener('dragstart',   e => e.preventDefault());
  }
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dragstart',   e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());
}
