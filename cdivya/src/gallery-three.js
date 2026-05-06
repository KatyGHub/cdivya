/**
 * gallery-three.js — Three.js parallax depth gallery
 * Uses HTMLImageElement loading instead of TextureLoader to bypass CORS issues.
 */

import * as THREE from 'three';

const DEPTH_LAYERS     = 5;
const IMAGES_PER_LAYER = 8;
const MAX_W = 220;
const MAX_H = 220;

const LAYER_CONFIG = [
  { scale: 1.55, speed: 85,  opacity: 1.00 },
  { scale: 1.10, speed: 45,  opacity: 0.88 },
  { scale: 0.82, speed: 32,  opacity: 0.72 },
  { scale: 0.62, speed: 22,  opacity: 0.56 },
  { scale: 0.48, speed: 14,  opacity: 0.38 },
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

function placeholderTexture() {
  const c = document.createElement('canvas');
  c.width = MAX_W; c.height = MAX_H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, c.width, c.height);
  return new THREE.CanvasTexture(c);
}

// Load via HTMLImageElement — avoids Three.js CORS header quirks
function loadTexture(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => {
      console.warn('[gallery] Failed to load:', url);
      resolve(placeholderTexture());
    };
    img.src = url;
  });
}

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

  // ── Scene ───────────────────────────────────────
  const scene    = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  let camera;
  let layers   = Array.from({ length: DEPTH_LAYERS }, () => []);
  let lastTime = 0;

  // ── Resize ──────────────────────────────────────
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    if (!camera) {
      camera = new THREE.OrthographicCamera(0, w, h, 0, -1000, 1000);
      camera.position.z = 10;
    } else {
      camera.right = w; camera.top = h; camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Load all textures upfront ───────────────────
  const TOTAL = DEPTH_LAYERS * IMAGES_PER_LAYER;
  const shuffled = shuffleArray(imageUrls);

  // Pick URLs for textures — cycle through if fewer images than slots
  const urlsToLoad = Array.from({ length: TOTAL }, (_, i) => shuffled[i % shuffled.length]);

  console.log(`[gallery] Loading ${TOTAL} textures from ${imageUrls.length} images…`);

  let loadedCount = 0;
  const textures = await Promise.all(
    urlsToLoad.map(url =>
      loadTexture(url).then(tex => {
        loadedCount++;
        const pct = Math.round((loadedCount / TOTAL) * 100);
        if (loadingBar) loadingBar.style.width = `${pct}%`;
        if (loadingTxt) loadingTxt.textContent = `Loading… ${pct}%`;
        return tex;
      })
    )
  );

  const validTextures = textures.filter(Boolean);
  console.log(`[gallery] ${validTextures.length}/${TOTAL} textures loaded.`);

  if (!validTextures.length) {
    loadingEl?.classList.add('hidden');
    emptyEl?.classList.add('show');
    return;
  }

  // ── Sprite factory ──────────────────────────────
  function addSprite(layerIdx, startX) {
    const cfg     = LAYER_CONFIG[layerIdx];
    const texture = validTextures[Math.floor(Math.random() * validTextures.length)];
    const mat     = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: cfg.opacity });
    const sprite  = new THREE.Sprite(mat);

    const img = texture.image;
    let tw = MAX_W, th = MAX_H;
    if (img?.naturalWidth && img?.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      tw = ratio > 1 ? MAX_W : MAX_H * ratio;
      th = ratio > 1 ? MAX_W / ratio : MAX_H;
    }

    const sv  = rand(0.85, 1.15);
    const w   = tw * cfg.scale * sv;
    const h   = th * cfg.scale * sv;
    const gap = w * rand(0.4, 0.85);

    sprite.scale.set(w, h, 1);
    sprite.position.set(
      startX + w / 2 + gap,
      rand(h / 2, container.clientHeight - h / 2),
      -layerIdx * 50
    );
    sprite.userData = {
      speed: cfg.speed * rand(0.45, 1.15),
      width: w, height: h,
      seed: rand(0, 1000),
      baseY: sprite.position.y,
      opacity: cfg.opacity,
    };
    layers[layerIdx].push(sprite);
    scene.add(sprite);
    return sprite;
  }

  function fillViewport() {
    const w = container.clientWidth;
    for (let l = 0; l < DEPTH_LAYERS; l++) {
      let right = layers[l].length
        ? Math.max(...layers[l].map(s => s.position.x + s.userData.width / 2))
        : -w;
      while (right < w * 1.3) {
        addSprite(l, right);
        right = Math.max(...layers[l].map(s => s.position.x + s.userData.width / 2));
      }
    }
  }

  function cleanup() {
    const w = container.clientWidth, buf = w * 0.5;
    for (let l = 0; l < DEPTH_LAYERS; l++) {
      const sprites = layers[l];
      if (sprites.length <= IMAGES_PER_LAYER + 4) continue;
      for (let i = sprites.length - 1; i >= 0 && sprites.length > IMAGES_PER_LAYER + 4; i--) {
        const s = sprites[i], ud = s.userData;
        const gone = speedFactor > 0
          ? s.position.x - ud.width / 2 > w + buf
          : s.position.x + ud.width / 2 < -buf;
        if (gone) { scene.remove(s); s.material.dispose(); sprites.splice(i, 1); }
      }
    }
  }

  // ── Clean single-variable interaction model ─────
  // One truth: `velocity` (world-units/sec, positive = rightward flow).
  // Drag and wheel both write to it. Animate decays it. No cross-fighting.
  let velocity  = 1.0;   // auto-scroll baseline
  let isDragging = false;
  let dragLastX  = 0;
  let dragLastT  = 0;
  let dragVel    = 0;    // measured during drag for momentum

  // ── Animate ──────────────────────────────────────
  function animate() {
    const now = performance.now();
    const dt  = Math.min(32, now - lastTime) / 1000;
    lastTime  = now;
    const w   = container.clientWidth;

    // Decay toward baseline auto-scroll (1.0) when not interacting
    if (!isDragging) {
      velocity *= 0.94;
      if (Math.abs(velocity) < 0.05) velocity = 0.05; // never fully stop
    }

    if (Math.random() < 0.008) cleanup();

    for (const sprites of layers) {
      if (!sprites?.length) continue;
      for (const s of sprites) {
        const ud = s.userData;
        s.position.x += ud.speed * velocity * dt;

        // Wrap around in whichever direction we're moving
        if (velocity >= 0 && s.position.x - ud.width / 2 > w + 20)
          s.position.x = -ud.width / 2 - rand(5, ud.width * 0.6);
        else if (velocity < 0 && s.position.x + ud.width / 2 < -20)
          s.position.x = w + ud.width / 2 + rand(5, ud.width * 0.6);

        // Gentle bob
        s.position.y = ud.baseY + Math.sin(now * 0.0008 + ud.seed) * 4;
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  fillViewport();
  loadingEl?.classList.add('hidden');
  if (uiEl) uiEl.classList.add('show');
  lastTime = performance.now();
  animate();
  onReady?.();

  // ── Drag / touch ──────────────────────────────────
  function onDragStart(clientX) {
    isDragging = true;
    dragLastX  = clientX;
    dragLastT  = performance.now();
    dragVel    = 0;
    container.style.cursor = 'grabbing';
  }

  function onDragMove(clientX) {
    if (!isDragging) return;
    const now = performance.now();
    const dx  = clientX - dragLastX;
    const dt2 = Math.max(1, now - dragLastT);
    // velocity in "units" that match the speed field (pixels * speed factor)
    dragVel   = (dx / dt2) * 18;          // tuned multiplier
    velocity  = dragVel;
    dragLastX = clientX;
    dragLastT = now;
  }

  function onDragEnd() {
    isDragging = false;
    // Hand off momentum: velocity already set from last move
    container.style.cursor = 'grab';
  }

  container.addEventListener('mousedown',  e => onDragStart(e.clientX));
  window  .addEventListener('mousemove',   e => onDragMove(e.clientX));
  window  .addEventListener('mouseup',       onDragEnd);
  container.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX), { passive: true });
  window  .addEventListener('touchmove',   e => { if (isDragging) onDragMove(e.touches[0].clientX); }, { passive: true });
  window  .addEventListener('touchend',      onDragEnd);

  // ── Wheel / trackpad ──────────────────────────────
  // deltaX = trackpad horizontal swipe (already in px)
  // deltaY = mouse wheel / trackpad vertical (map to horizontal)
  container.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : -e.deltaY;
    // Scale to roughly the same feel as drag
    velocity += (delta / 10);
    velocity  = Math.max(-6, Math.min(6, velocity));
    cleanup();
  }, { passive: false });

  document.addEventListener('wheel',       e => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dragstart',   e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());

  container.style.cursor = 'grab';
}
