// ─────────────────────────────────────────────────────────────────────────────
// jigsaw-engine.js  —  canvas jigsaw puzzle engine
// Classic bezier tabs · bevel rendering · drag groups · chain-snap
// ─────────────────────────────────────────────────────────────────────────────

const TAB  = 0.28;   // tab height as fraction of edge length
const NECK = 0.13;   // neck half-width fraction
const SNAP = 22;     // snap trigger distance (px)
const BEVEL_W = 7;   // bevel stroke width (inner half shows after clip)
const SHADOW_NORM = { blur: 10, ox: 4, oy: 4, col: 'rgba(0,0,0,0.55)' };
const SHADOW_HELD = { blur: 28, ox: 0, oy: 0, col: 'rgba(0,255,189,0.35)' };

// ── Geometry helpers ──────────────────────────────────────────────────────────

/** Add a jigsaw edge to an existing Path2D.
 *  Travels from (x1,y1) to (x2,y2).
 *  dir = +1  → tab protrudes LEFT of travel direction  (= outward from piece)
 *  dir = -1  → tab protrudes RIGHT                     (= inward / concave)
 *  dir =  0  → flat border edge
 */
function addEdge(path, x1, y1, x2, y2, dir) {
  if (dir === 0) { path.lineTo(x2, y2); return; }

  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;       // unit along edge
  // Unit perpendicular, scaled by dir so +1 = outward
  const lx = -uy * dir, ly = ux * dir;

  // Helper: point at (t * len) along edge, (n * len) perpendicular
  const P = (t, n) => [x1 + ux * len * t + lx * len * n,
                        y1 + uy * len * t + ly * len * n];

  // Classic jigsaw shape:
  //   ─────╮    ╭─────
  //        │    │
  //        ╰────╯
  // Neck starts at 0.37, knob peak at 0.5 height TAB, knob top rounded at TAB*1.38
  path.lineTo(...P(0.37, 0));
  path.bezierCurveTo(...P(0.37, TAB * 0.5),  ...P(0.5 - NECK, TAB * 0.88), ...P(0.5 - NECK, TAB));
  path.bezierCurveTo(...P(0.5 - NECK, TAB * 1.38), ...P(0.5 + NECK, TAB * 1.38), ...P(0.5 + NECK, TAB));
  path.bezierCurveTo(...P(0.5 + NECK, TAB * 0.88), ...P(0.63, TAB * 0.5),  ...P(0.63, 0));
  path.lineTo(x2, y2);
}

/** Build the Path2D for piece at (col, row) in local coords 0→pw, 0→ph */
function buildPath(col, row, pw, ph, cols, rows, hEdge, vEdge) {
  // Edge direction convention (dir for addEdge):
  //   hEdge[r][c] = +1 → tab protrudes DOWN  (row r → row r+1)
  //   vEdge[r][c] = +1 → tab protrudes RIGHT (col c → col c+1)

  const topDir = row === 0          ? 0 : -hEdge[row - 1][col];   // into piece = concave = -
  const botDir = row === rows - 1   ? 0 :  hEdge[row][col];       // out of piece = +
  const rgtDir = col === cols - 1   ? 0 :  vEdge[row][col];
  const lftDir = col === 0          ? 0 : -vEdge[row][col - 1];

  const p = new Path2D();
  p.moveTo(0, 0);
  addEdge(p, 0,  0,  pw, 0,  topDir);  // top:    L→R, outward = UP
  addEdge(p, pw, 0,  pw, ph, rgtDir);  // right:  T→B, outward = RIGHT
  addEdge(p, pw, ph, 0,  ph, botDir);  // bottom: R→L, outward = DOWN
  addEdge(p, 0,  ph, 0,  0,  lftDir); // left:   B→T, outward = LEFT
  p.closePath();
  return p;
}

// ─────────────────────────────────────────────────────────────────────────────
// JigsawPuzzle class
// ─────────────────────────────────────────────────────────────────────────────

export class JigsawPuzzle {
  constructor(container) {
    this.container = container;
    this.canvas    = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
    this.ctx       = this.canvas.getContext('2d');
    container.appendChild(this.canvas);

    this.image  = null;
    this.pieces = [];
    this.groups = [];
    this.drag   = null;
    this._zTop  = 0;
    this.dpr    = window.devicePixelRatio || 1;

    // callbacks set by caller
    this.onProgress = null;   // (groupsLeft, totalPieces)
    this.onSolved   = null;

    this._bindEvents();
    this._resize();
    this._loop();
  }

  // ── public API ─────────────────────────────────────────────────────────────

  setImage(img) { this.image = img; }

  start(nPieces) {
    if (!this.image) return;
    this._buildGrid(nPieces);
    this._generateEdges();
    this._buildPieces();
    this._scatter();
    this.onProgress?.(this.groups.length, this.pieces.length);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize',    this._onResize);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup',   this._onUp);
    window.removeEventListener('touchmove', this._onTMove);
    window.removeEventListener('touchend',  this._onUp);
    this.canvas.remove();
  }

  // ── grid / edge generation ─────────────────────────────────────────────────

  _buildGrid(n) {
    const ratio = this.image.naturalWidth / this.image.naturalHeight;
    this.rows = Math.max(2, Math.round(Math.sqrt(n / ratio)));
    this.cols = Math.max(2, Math.round(n / this.rows));
    // Nominal piece size fills ~60% of viewport, preserving image aspect
    const maxW = this.W * 0.62, maxH = this.H * 0.74;
    const scaleByW = maxW / this.cols;
    const scaleByH = maxH / this.rows;
    const scale    = Math.min(scaleByW, scaleByH);
    this.pw = scale;
    this.ph = scale / ratio * (this.image.naturalWidth / this.image.naturalHeight
                                / (this.image.naturalWidth / this.image.naturalHeight));
    // Simpler: piece aspect = image aspect
    this.pw = scale;
    this.ph = this.image.naturalHeight / this.image.naturalWidth * scale
              * (this.cols / this.rows) * (this.rows / this.cols);
    // Even simpler — just square-ish pieces, image sliced uniformly
    const imgRatio = this.image.naturalWidth / this.image.naturalHeight;
    this.ph = this.pw / imgRatio * (this.image.naturalHeight * this.cols)
                                 / (this.image.naturalWidth  * this.rows);
    // Just do it directly:
    this.pw = Math.min(maxW / this.cols, maxH / this.rows * imgRatio);
    this.ph = this.pw / imgRatio;

    this.originX = (this.W - this.pw * this.cols) / 2;
    this.originY = (this.H - this.ph * this.rows) / 2;
  }

  _generateEdges() {
    const rand = () => Math.random() < 0.5 ? 1 : -1;
    this.hEdge = Array.from({ length: this.rows - 1 },
      () => Array.from({ length: this.cols }, rand));
    this.vEdge = Array.from({ length: this.rows },
      () => Array.from({ length: this.cols - 1 }, rand));
  }

  _buildPieces() {
    this.pieces = [];
    this.groups = [];
    this._zTop  = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const piece = {
          col: c, row: r,
          x: 0, y: 0,
          path: buildPath(c, r, this.pw, this.ph,
                          this.cols, this.rows, this.hEdge, this.vEdge),
          group: null,
        };
        const g = { pieces: [piece], z: ++this._zTop };
        piece.group = g;
        this.pieces.push(piece);
        this.groups.push(g);
      }
    }
  }

  _scatter() {
    const pad = Math.max(this.pw, this.ph) * (0.5 + TAB);
    const areaW = this.W - pad * 2 - this.pw;
    const areaH = this.H - pad * 2 - this.ph;

    for (const p of this.pieces) {
      p.x = pad + Math.random() * Math.max(0, areaW);
      p.y = pad + Math.random() * Math.max(0, areaH);
    }
  }

  // ── rendering ──────────────────────────────────────────────────────────────

  _loop() {
    this._render();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);

    if (!this.pieces.length) return;

    // Stable sort by group z (low = back)
    const sorted = [...this.pieces].sort((a, b) => a.group.z - b.group.z);
    for (const p of sorted) this._drawPiece(p);
  }

  _drawPiece(piece) {
    if (!this.image) return;
    const ctx = this.ctx;
    const held = this.drag?.group === piece.group;

    // ── Image ────────────────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(piece.x, piece.y);

    // Shadow (drop shadow — applied before clip)
    const sh = held ? SHADOW_HELD : SHADOW_NORM;
    ctx.shadowBlur     = sh.blur;
    ctx.shadowOffsetX  = sh.ox;
    ctx.shadowOffsetY  = sh.oy;
    ctx.shadowColor    = sh.col;

    // Clip to piece shape, draw image
    ctx.save();
    ctx.clip(piece.path);
    ctx.shadowColor = 'transparent';

    const sw = this.image.naturalWidth  / this.cols;
    const sh2= this.image.naturalHeight / this.rows;
    ctx.drawImage(this.image,
      piece.col * sw, piece.row * sh2, sw, sh2,
      0, 0, this.pw, this.ph
    );

    ctx.restore(); // end clip

    // Outer edge — only when held (mint glow), invisible otherwise
    ctx.shadowColor = 'transparent';
    if (held) {
      ctx.strokeStyle = 'rgba(0,255,189,0.6)';
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      ctx.stroke(piece.path);
    }

    ctx.restore();
  }

  // ── Hit-test ───────────────────────────────────────────────────────────────

  _hit(x, y) {
    // Top-z first
    const sorted = [...this.pieces].sort((a, b) => b.group.z - a.group.z);
    for (const p of sorted) {
      if (this.ctx.isPointInPath(p.path, x - p.x, y - p.y)) return p;
    }
    return null;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    this._onResize = () => this._resize();
    this._onDown   = e => this._down(e.clientX, e.clientY);
    this._onMove   = e => this._move(e.clientX, e.clientY);
    this._onUp     = ()  => this._up();
    this._onTDown  = e => { e.preventDefault(); this._down(e.touches[0].clientX, e.touches[0].clientY); };
    this._onTMove  = e => { e.preventDefault(); this._move(e.touches[0].clientX, e.touches[0].clientY); };

    window.addEventListener('resize',    this._onResize);
    this.canvas.addEventListener('mousedown',  this._onDown);
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup',   this._onUp);
    this.canvas.addEventListener('touchstart', this._onTDown, { passive: false });
    window.addEventListener('touchmove', this._onTMove, { passive: false });
    window.addEventListener('touchend',  this._onUp);
  }

  _resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.W   = this.container.clientWidth  || window.innerWidth;
    this.H   = this.container.clientHeight || window.innerHeight;
    this.canvas.width  = this.W * this.dpr;
    this.canvas.height = this.H * this.dpr;
    this.canvas.style.width  = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
  }

  _down(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    const x = cx - rect.left, y = cy - rect.top;
    const piece = this._hit(x, y);
    if (!piece) return;

    const group = piece.group;
    group.z = ++this._zTop;

    this.drag = {
      group,
      offsets: group.pieces.map(p => ({ dx: x - p.x, dy: y - p.y })),
    };
    this.canvas.style.cursor = 'grabbing';
  }

  _move(cx, cy) {
    if (!this.drag) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = cx - rect.left, y = cy - rect.top;
    const { group, offsets } = this.drag;
    group.pieces.forEach((p, i) => {
      p.x = x - offsets[i].dx;
      p.y = y - offsets[i].dy;
    });
  }

  _up() {
    if (!this.drag) return;
    const group = this.drag.group;
    this.drag = null;
    this.canvas.style.cursor = 'grab';
    this._doSnap(group);
  }

  // ── Snap logic ─────────────────────────────────────────────────────────────

  _doSnap(group) {
    // BFS through the group's pieces, snapping to neighbors
    // Loop until no more snaps fire (chain reaction)
    let changed = true;
    while (changed) {
      changed = false;
      for (const piece of [...group.pieces]) {
        if (this._trySnap(piece)) { changed = true; break; }
      }
    }
  }

  _trySnap(piece) {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = piece.row + dr, nc = piece.col + dc;
      if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;

      const neighbor = this.pieces[nr * this.cols + nc];
      if (neighbor.group === piece.group) continue;

      const expDx = dc * this.pw;
      const expDy = dr * this.ph;
      const actDx = neighbor.x - piece.x;
      const actDy = neighbor.y - piece.y;

      if (Math.abs(actDx - expDx) < SNAP && Math.abs(actDy - expDy) < SNAP) {
        this._merge(piece, neighbor);
        this._snap();
        return true;
      }
    }
    return false;
  }

  _merge(anchor, neighbor) {
    const dr = neighbor.row - anchor.row;
    const dc = neighbor.col - anchor.col;
    const ox = (anchor.x + dc * this.pw) - neighbor.x;
    const oy = (anchor.y + dr * this.ph) - neighbor.y;

    const gBase  = anchor.group;
    const gMerge = neighbor.group;

    for (const p of gMerge.pieces) {
      p.x += ox;
      p.y += oy;
      p.group = gBase;
    }
    gBase.pieces.push(...gMerge.pieces);
    gBase.z = ++this._zTop;
    this.groups = this.groups.filter(g => g !== gMerge);

    this.onProgress?.(this.groups.length, this.pieces.length);

    if (this.groups.length === 1) {
      this._centerSolvedPuzzle(gBase);
      this.onSolved?.();
    }
  }

  _centerSolvedPuzzle(group) {
    const origin = group.pieces.find(p => p.col === 0 && p.row === 0);
    if (!origin) return;
    const dx = this.originX - origin.x;
    const dy = this.originY - origin.y;
    for (const p of group.pieces) { p.x += dx; p.y += dy; }
  }

  // ── Audio feedback ─────────────────────────────────────────────────────────

  _snap() {
    try {
      const ac  = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.connect(g); g.connect(ac.destination);
      osc.frequency.setValueAtTime(1100, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.07);
      g.gain.setValueAtTime(0.12, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
      osc.start(); osc.stop(ac.currentTime + 0.1);
    } catch (_) {}
  }
}
