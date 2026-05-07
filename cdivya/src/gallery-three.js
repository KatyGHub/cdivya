/**
 * gallery-three.js
 * Exact port of the working CodePen parallax gallery by @ol-ivier
 * Only difference: images come from Supabase (as blob: URLs) instead of Unsplash.
 * Blob URLs are same-origin so THREE.TextureLoader works with them directly.
 */

import * as THREE from 'three';

// ─── Config (unchanged from CodePen) ──────────────────────────────────────────
const DEPTH_LAYERS     = 5;
const IMAGES_PER_LAYER = 10;
const MAX_WIDTH        = 160;
const MAX_HEIGHT       = 160;

let dragActive   = false;
let lastX        = 0;
let dragVelocity = 0;
let speedFactor  = 1;

const LAYER_CONFIG = [
  { scale: 1.5,  speed: 80, opacity: 1.00 },
  { scale: 1.0,  speed: 40, opacity: 0.85 },
  { scale: 0.8,  speed: 30, opacity: 0.70 },
  { scale: 0.6,  speed: 20, opacity: 0.55 },
  { scale: 0.5,  speed: 15, opacity: 0.40 },
];

// ─── Exported entry point ──────────────────────────────────────────────────────
export async function initGallery({ imageUrls, onReady, onEmpty }) {
  const container  = document.getElementById('container');
  const loadingEl  = document.getElementById('loading');
  const loadingBar = document.getElementById('loadingBar');
  const loadingTxt = document.getElementById('loadingText');
  const uiEl       = document.getElementById('ui');
  const emptyEl    = document.getElementById('empty');
  if (!container) return;

  if (!imageUrls?.length) {
    loadingEl?.classList.add('hidden');
    emptyEl?.classList.add('show');
    onEmpty?.();
    return;
  }

  // ── Scene setup ─────────────────────────────────────────────────────────────
  const scene    = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  let camera;
  let layers  = Array.from({ length: DEPTH_LAYERS }, () => []);
  let lastTime = 0;

  // ── Helpers (identical to CodePen) ──────────────────────────────────────────
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fallbackTexture(layer) {
    const c = document.createElement('canvas');
    c.width = MAX_WIDTH; c.height = MAX_HEIGHT;
    const ctx = c.getContext('2d');
    ctx.fillStyle = ['#4a6572','#344955','#232f34','#1c2529','#0f1518'][layer];
    ctx.fillRect(0, 0, c.width, c.height);
    return new THREE.CanvasTexture(c);
  }

  // ── Textures array — must be declared before resize() references it ──────────
  const textures = [];
  let loadedCount = 0;

  // ── Resize (identical to CodePen) ───────────────────────────────────────────
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    if (!camera) {
      camera = new THREE.OrthographicCamera(0, w, h, 0, -1000, 1000);
      camera.position.z = 10;
    } else {
      camera.right = w; camera.top = h; camera.updateProjectionMatrix();
    }
    // Rebuild sprites on resize
    for (const layer of layers) {
      for (const s of layer) {
        scene.remove(s);
        if (s.material.map) s.material.map.dispose();
        s.material.dispose();
      }
    }
    layers = Array.from({ length: DEPTH_LAYERS }, () => []);
    if (textures.length === DEPTH_LAYERS * IMAGES_PER_LAYER) fillViewport();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Load textures via THREE.TextureLoader ────────────────────────────────────
  // Blob URLs are same-origin so TextureLoader works without CORS issues.
  const TOTAL = DEPTH_LAYERS * IMAGES_PER_LAYER;

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  // Shuffle and cycle through the provided blob URLs
  const shuffled = shuffleArray(imageUrls);
  let imgIdx = 0;
  function nextUrl() {
    const url = shuffled[imgIdx % shuffled.length];
    imgIdx++;
    return url;
  }

  function onLoaded(tex) {
    textures.push(tex);
    loadedCount++;
    const pct = Math.round((loadedCount / TOTAL) * 100);
    if (loadingBar) loadingBar.style.width = `${pct}%`;
    if (loadingTxt) loadingTxt.textContent = `Loading… ${pct}%`;
    if (loadedCount === TOTAL) initSprites();
  }

  for (let l = 0; l < DEPTH_LAYERS; l++) {
    for (let i = 0; i < IMAGES_PER_LAYER; i++) {
      const url = nextUrl();
      loader.load(url, tex => onLoaded(tex), undefined, () => onLoaded(fallbackTexture(l)));
    }
  }

  // ── Sprite factory (identical to CodePen) ────────────────────────────────────
  function addSprite(layerIndex, startX) {
    const cfg     = LAYER_CONFIG[layerIndex];
    const texture = textures[Math.floor(Math.random() * textures.length)] || fallbackTexture(layerIndex);
    const mat     = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: cfg.opacity });
    const sprite  = new THREE.Sprite(mat);

    const img = texture.image;
    let w = MAX_WIDTH, h = MAX_HEIGHT;
    if (img?.width && img?.height) {
      const ratio = img.width / img.height;
      if (ratio > 1) { w = MAX_WIDTH; h = MAX_WIDTH / ratio; }
      else           { h = MAX_HEIGHT; w = MAX_HEIGHT * ratio; }
    }

    const sv      = rand(0.85, 1.15);
    const sw      = w * cfg.scale * sv;
    const sh      = h * cfg.scale * sv;
    const spacing = sw * rand(0.5, 0.9);

    sprite.scale.set(sw, sh, 1);
    sprite.position.set(
      startX + sw / 2 + spacing,
      rand(sh / 2, container.clientHeight - sh / 2),
      -layerIndex * 50
    );
    sprite.userData = {
      speed: cfg.speed * rand(0.45, 1.15),
      width: sw, height: sh,
      seed: rand(0, 1000),
      baseY: sprite.position.y,
      opacity: cfg.opacity,
    };
    layers[layerIndex].push(sprite);
    scene.add(sprite);
    return sprite;
  }

  // ── cleanupSprites (identical to CodePen) ────────────────────────────────────
  function cleanupSprites() {
    const w = container.clientWidth, buf = w * 0.5;
    const maxSprites = IMAGES_PER_LAYER + 3;
    for (let l = 0; l < DEPTH_LAYERS; l++) {
      const sprites = layers[l];
      if (!sprites?.length || sprites.length <= maxSprites) continue;
      for (let i = sprites.length - 1; i >= 0 && sprites.length > maxSprites; i--) {
        const s = sprites[i], ud = s.userData;
        const gone = speedFactor > 0
          ? s.position.x - ud.width / 2 > w + buf
          : s.position.x + ud.width / 2 < -buf;
        if (gone) {
          scene.remove(s);
          if (s.material.map) s.material.map.dispose();
          s.material.dispose();
          sprites.splice(i, 1);
        }
      }
    }
  }

  // ── fillViewport (identical to CodePen) ──────────────────────────────────────
  function fillViewport() {
    const w = container.clientWidth;
    for (let l = 0; l < DEPTH_LAYERS; l++) {
      let sprites = layers[l];
      let rightMost = sprites.length
        ? Math.max(...sprites.map(s => s.position.x + s.userData.width / 2))
        : -w * 1.2;
      while (rightMost < w) {
        addSprite(l, rightMost);
        sprites  = layers[l];
        rightMost = Math.max(...sprites.map(s => s.position.x + s.userData.width / 2));
      }
    }
  }

  // ── animate (identical to CodePen) ───────────────────────────────────────────
  function animate() {
    const now = performance.now();
    const dt  = Math.min(40, now - lastTime) / 1000;
    lastTime  = now;
    const w   = container.clientWidth;

    dragVelocity *= 0.92;
    if (dragVelocity !== 0) {
      speedFactor = Math.sign(dragVelocity);
    }
    if (Math.random() < 0.01) cleanupSprites();

    for (const sprites of layers) {
      if (!sprites?.length) continue;
      for (const s of sprites) {
        const ud = s.userData;
        s.position.x += ud.speed * speedFactor * dt;

        if (speedFactor > 0 && s.position.x - ud.width / 2 > w)
          s.position.x = -ud.width / 2 - rand(0, ud.width);
        else if (speedFactor < 0 && s.position.x + ud.width / 2 < 0)
          s.position.x = w + ud.width / 2 + rand(0, ud.width);

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

  // ── initSprites ──────────────────────────────────────────────────────────────
  function initSprites() {
    fillViewport();
    loadingEl?.classList.add('hidden');
    if (uiEl) uiEl.classList.add('show');
    lastTime = performance.now();
    animate();
    onReady?.();
  }

  // ── Interaction (identical to CodePen) ───────────────────────────────────────
  function getX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }

  container.addEventListener('mousedown', e => {
    dragActive = true; lastX = getX(e);
  });
  container.addEventListener('mousemove', e => {
    if (!dragActive) return;
    const dx = getX(e) - lastX;
    lastX = getX(e);
    dragVelocity = dx * 0.02;
  });
  window.addEventListener('mouseup', () => { dragActive = false; });

  container.addEventListener('touchstart', e => {
    dragActive = true; lastX = getX(e);
  }, { passive: true });
  container.addEventListener('touchmove', e => {
    if (!dragActive) return;
    const dx = getX(e) - lastX;
    lastX = getX(e);
    dragVelocity = dx * 0.02;
  }, { passive: true });
  window.addEventListener('touchend', () => { dragActive = false; });

  container.addEventListener('wheel', e => {
    e.preventDefault();
    const direction  = Math.sign(e.deltaY) > 0 ? 1 : -1;
    speedFactor      = direction * (Math.abs(speedFactor) + 0.8);
    const sign       = Math.sign(speedFactor);
    speedFactor      = sign * Math.min(5, Math.abs(speedFactor));
    dragVelocity     = 0;
    cleanupSprites();
  }, { passive: false });

  // Catch any wheel events that bubble up to document
  document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dragstart',   e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());
}
