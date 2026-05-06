/**
 * puzzle-v2.js — Immersive image-tile sliding puzzle
 * Tiles show slices of generated artwork · shake on bad move · audio · drama on win
 */

const SIZE  = 4;
const TOTAL = SIZE * SIZE;

// ── Artwork generator ─────────────────────────────────────────────────────────
// ── Seeded RNG ────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── 10 Color Palettes: [bg1, bg2, accent1, accent2, accent3, accent4] ─────────
const PALETTES = [
  ['#120012','#080808','#FF2D55','#BF5FFF','#00FFBD','#FF8C42'],  // 0 Brand
  ['#001020','#040810','#00E5FF','#0099FF','#00FFBD','#4466FF'],  // 1 Ocean
  ['#1a0800','#0a0300','#FF8C00','#FF4500','#FFD700','#FF2200'],  // 2 Solar
  ['#021008','#010805','#00FF88','#44FF22','#00FFBD','#88FF00'],  // 3 Forest
  ['#060010','#020008','#7700FF','#AA00FF','#FF00CC','#5500AA'],  // 4 Cosmic
  ['#180008','#0d0004','#FF69B4','#FF1493','#FFB6C1','#FF4488'],  // 5 Sakura
  ['#100a00','#080600','#FFD700','#FFA500','#FFEC00','#FF8800'],  // 6 Gold
  ['#001018','#00080f','#00E5FF','#88FFFF','#00BFFF','#AAEEFF'],  // 7 Arctic
  ['#180000','#0d0000','#FF0000','#FF4500','#FF2200','#CC0000'],  // 8 Volcanic
  ['#080808','#030303','#CCCCCC','#EEEEEE','#AAAAAA','#FFFFFF'],  // 9 Silver
];

// ── 10 Rendering Styles ────────────────────────────────────────────────────────
function drawGradientMesh(ctx,w,h,pal,rng){
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1]);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let i=0;i<16;i++){
    const cx=rng()*w,cy=rng()*h,r=50+rng()*200,col=pal[2+Math.floor(rng()*4)];
    const alpha=Math.floor((0.3+rng()*0.45)*255).toString(16).padStart(2,'0');
    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,col+alpha);cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<6;i++){
    const cx=rng()*w,cy=rng()*h,r=20+rng()*70;
    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,`rgba(255,255,255,${0.06+rng()*0.12})`);cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  }
}

function drawNeonOrbs(ctx,w,h,pal,rng){
  ctx.fillStyle=pal[0];ctx.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){
    const cx=rng()*w,cy=rng()*h,r=40+rng()*170,col=pal[2+Math.floor(rng()*4)];
    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,col+'dd');cg.addColorStop(0.35,col+'55');cg.addColorStop(0.7,col+'18');cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<6;i++){
    const cx=rng()*w,cy=rng()*h,r=5+rng()*22,col=pal[2+Math.floor(rng()*4)];
    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,'rgba(255,255,255,.9)');cg.addColorStop(0.4,col+'bb');cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  }
}

function drawAuroraWaves(ctx,w,h,pal,rng){
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1]);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const bands=[
    {col:pal[2],y:h*0.35,amp:85,fr:0.006+rng()*0.004},
    {col:pal[3],y:h*0.50,amp:105,fr:0.005+rng()*0.004},
    {col:pal[4],y:h*0.65,amp:65,fr:0.007+rng()*0.003},
    {col:pal[5],y:h*0.75,amp:50,fr:0.009+rng()*0.003},
  ];
  for(const {col,y,amp,fr} of bands){
    ctx.globalAlpha=0.55+rng()*0.22;
    const ph=rng()*Math.PI*2;
    for(let x=0;x<=w;x++){
      const wy=y+Math.sin(x*fr+ph)*amp,bw=55+rng()*55;
      const cg=ctx.createLinearGradient(x,wy-bw,x,wy+bw);
      cg.addColorStop(0,'rgba(0,0,0,0)');cg.addColorStop(0.4,col+'88');cg.addColorStop(0.5,col+'cc');cg.addColorStop(0.6,col+'88');cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cg;ctx.fillRect(x,0,1,h);
    }
    ctx.globalAlpha=1;
  }
  ctx.globalAlpha=0.7;
  for(let i=0;i<100;i++){
    const sx=rng()*w,sy=rng()*h*0.45,sr=0.4+rng()*2;
    ctx.fillStyle=`rgba(255,255,255,${0.3+rng()*0.7})`;
    ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawGeometricGrid(ctx,w,h,pal,rng){
  ctx.fillStyle=pal[0];ctx.fillRect(0,0,w,h);
  const N=8,cw=w/N,ch=h/N;
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const x=c*cw,y=r*ch,col=pal[2+Math.floor(rng()*4)];
    ctx.globalAlpha=0.15+rng()*0.65;ctx.fillStyle=col;
    if(rng()<0.55){ctx.fillRect(x,y,cw,ch);}
    else{
      ctx.beginPath();
      if(rng()<0.5){ctx.moveTo(x,y);ctx.lineTo(x+cw,y);ctx.lineTo(x,y+ch);}
      else{ctx.moveTo(x+cw,y);ctx.lineTo(x+cw,y+ch);ctx.lineTo(x,y+ch);}
      ctx.closePath();ctx.fill();
    }
  }
  ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=0.5;
  for(let c=0;c<=N;c++){ctx.beginPath();ctx.moveTo(c*cw,0);ctx.lineTo(c*cw,h);ctx.stroke();}
  for(let r=0;r<=N;r++){ctx.beginPath();ctx.moveTo(0,r*ch);ctx.lineTo(w,r*ch);ctx.stroke();}
}

function drawRadialBurst(ctx,w,h,pal,rng){
  const cx=w/2,cy=h/2,len=Math.max(w,h)*0.8;
  const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,len);
  cg.addColorStop(0,pal[1]);cg.addColorStop(1,pal[0]);
  ctx.fillStyle=cg;ctx.fillRect(0,0,w,h);
  const rays=20+Math.floor(rng()*24);
  for(let i=0;i<rays;i++){
    const a1=(i/rays)*Math.PI*2,a2=((i+0.5)/rays)*Math.PI*2;
    const col=pal[2+Math.floor(rng()*4)];
    ctx.globalAlpha=0.08+rng()*0.38;ctx.fillStyle=col;
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(a1)*len,cy+Math.sin(a1)*len);
    ctx.lineTo(cx+Math.cos(a2)*len,cy+Math.sin(a2)*len);
    ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=1;
  const gc=ctx.createRadialGradient(cx,cy,0,cx,cy,100);
  gc.addColorStop(0,'rgba(255,255,255,.22)');gc.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gc;ctx.beginPath();ctx.arc(cx,cy,100,0,Math.PI*2);ctx.fill();
}

function drawWaveFlow(ctx,w,h,pal,rng){
  ctx.fillStyle=pal[0];ctx.fillRect(0,0,w,h);
  const numW=7+Math.floor(rng()*5);
  for(let i=0;i<numW;i++){
    const col=pal[2+Math.floor(rng()*4)];
    const amp=25+rng()*90,fr=0.004+rng()*0.012,ph=rng()*Math.PI*2;
    const yBase=(i/(numW-1))*h,thick=5+rng()*22;
    ctx.strokeStyle=col;ctx.lineWidth=thick;
    ctx.globalAlpha=0.3+rng()*0.5;
    ctx.shadowBlur=thick;ctx.shadowColor=col;
    ctx.beginPath();
    for(let x=0;x<=w;x+=2){const y=yBase+Math.sin(x*fr+ph)*amp;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}

function drawBokehField(ctx,w,h,pal,rng){
  const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*0.8);
  g.addColorStop(0,pal[1]);g.addColorStop(1,pal[0]);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let i=0;i<35;i++){
    const cx=rng()*w,cy=rng()*h,r=15+rng()*130,col=pal[2+Math.floor(rng()*4)];
    const alpha=Math.floor(0.45*255).toString(16);
    const cg=ctx.createRadialGradient(cx,cy,r*0.35,cx,cy,r);
    cg.addColorStop(0,'rgba(0,0,0,0)');cg.addColorStop(0.75,'rgba(0,0,0,0)');
    cg.addColorStop(0.88,col+alpha);cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<18;i++){
    const cx=rng()*w,cy=rng()*h,r=3+rng()*16,col=pal[2+Math.floor(rng()*4)];
    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,'rgba(255,255,255,.85)');cg.addColorStop(0.3,col+'cc');cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  }
}

function drawInkBlot(ctx,w,h,pal,rng){
  ctx.fillStyle=pal[0];ctx.fillRect(0,0,w,h);
  for(let b=0;b<14;b++){
    const cx=rng()*w,cy=rng()*h,col=pal[2+Math.floor(rng()*4)];
    ctx.fillStyle=col;ctx.globalAlpha=0.25+rng()*0.55;
    const pts=6+Math.floor(rng()*8),br=35+rng()*130;
    ctx.beginPath();
    for(let i=0;i<=pts;i++){
      const a=(i/pts)*Math.PI*2,r=br*(0.55+rng()*0.9);
      i===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
    }
    ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=1;
  for(let i=0;i<70;i++){
    const sx=rng()*w,sy=rng()*h,sr=0.8+rng()*4;
    ctx.fillStyle=pal[2+Math.floor(rng()*4)];ctx.globalAlpha=0.2+rng()*0.65;
    ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawGridGlow(ctx,w,h,pal,rng){
  ctx.fillStyle=pal[0];ctx.fillRect(0,0,w,h);
  const GS=10,CW=w/GS,CH=h/GS;
  for(let r=0;r<GS;r++)for(let c=0;c<GS;c++){
    if(rng()<0.3)continue;
    const x=c*CW+CW*0.12,y=r*CH+CH*0.12,bw=CW*0.76,bh=CH*0.76;
    const col=pal[2+Math.floor(rng()*4)];
    ctx.globalAlpha=0.12+rng()*0.55;ctx.fillStyle=col;
    ctx.shadowBlur=14+rng()*22;ctx.shadowColor=col;
    ctx.fillRect(x,y,bw,bh);ctx.shadowBlur=0;
  }
  ctx.globalAlpha=1;
}

function drawCosmicDust(ctx,w,h,pal,rng){
  const g=ctx.createRadialGradient(w*0.4,h*0.4,0,w*0.5,h*0.5,Math.max(w,h));
  g.addColorStop(0,pal[1]);g.addColorStop(1,pal[0]);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let n=0;n<5;n++){
    const cx=rng()*w,cy=rng()*h,r=70+rng()*210,col=pal[2+Math.floor(rng()*4)];
    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,col+'55');cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<500;i++){
    const sx=rng()*w,sy=rng()*h,sz=rng()*rng()*3.5+0.3;
    const bright=rng(),col=bright>0.75?pal[2+Math.floor(rng()*4)]:'#ffffff';
    ctx.globalAlpha=0.15+bright*0.85;ctx.fillStyle=col;
    ctx.beginPath();ctx.arc(sx,sy,sz,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

const STYLE_RENDERERS=[drawGradientMesh,drawNeonOrbs,drawAuroraWaves,drawGeometricGrid,drawRadialBurst,drawWaveFlow,drawBokehField,drawInkBlot,drawGridGlow,drawCosmicDust];

// ── 100 Artwork Definitions [name, style(0-9), palette(0-9), seed] ─────────────
const ARTWORK_DEFS=[
  // GradientMesh
  {n:"Divya's Palette",s:0,p:0,r:42},{n:"Aqua Canvas",s:0,p:1,r:11},{n:"Solar Canvas",s:0,p:2,r:77},
  {n:"Forest Canvas",s:0,p:3,r:33},{n:"Deep Space Canvas",s:0,p:4,r:55},{n:"Sakura Canvas",s:0,p:5,r:88},
  {n:"Amber Canvas",s:0,p:6,r:19},{n:"Frost Canvas",s:0,p:7,r:64},{n:"Magma Canvas",s:0,p:8,r:27},{n:"Silver Canvas",s:0,p:9,r:91},
  // NeonOrbs
  {n:"Neon Bloom",s:1,p:0,r:99},{n:"Ocean Bloom",s:1,p:1,r:44},{n:"Fire Bloom",s:1,p:2,r:13},
  {n:"Verdant Bloom",s:1,p:3,r:66},{n:"Cosmic Bloom",s:1,p:4,r:37},{n:"Sakura Bloom",s:1,p:5,r:82},
  {n:"Gold Bloom",s:1,p:6,r:53},{n:"Arctic Bloom",s:1,p:7,r:28},{n:"Volcanic Bloom",s:1,p:8,r:75},{n:"Mono Bloom",s:1,p:9,r:16},
  // AuroraWaves
  {n:"Aurora Borealis",s:2,p:0,r:7},{n:"Aqua Aurora",s:2,p:1,r:50},{n:"Fire Curtain",s:2,p:2,r:89},
  {n:"Green Curtain",s:2,p:3,r:21},{n:"Cosmic Veil",s:2,p:4,r:63},{n:"Blush Veil",s:2,p:5,r:35},
  {n:"Golden Tide",s:2,p:6,r:94},{n:"Arctic Tide",s:2,p:7,r:48},{n:"Lava Veil",s:2,p:8,r:6},{n:"Ashen Tide",s:2,p:9,r:72},
  // GeometricGrid
  {n:"Fractured Studio",s:3,p:0,r:15},{n:"Sea Fragment",s:3,p:1,r:83},{n:"Solar Fragment",s:3,p:2,r:39},
  {n:"Grove Fragment",s:3,p:3,r:61},{n:"Nebula Fragment",s:3,p:4,r:24},{n:"Petal Fragment",s:3,p:5,r:57},
  {n:"Gilded Fragment",s:3,p:6,r:96},{n:"Ice Fragment",s:3,p:7,r:32},{n:"Ember Fragment",s:3,p:8,r:78},{n:"Stone Fragment",s:3,p:9,r:4},
  // RadialBurst
  {n:"Supernova",s:4,p:0,r:100},{n:"Aqua Burst",s:4,p:1,r:46},{n:"Solar Flare",s:4,p:2,r:8},
  {n:"Verdant Flare",s:4,p:3,r:71},{n:"Deep Pulse",s:4,p:4,r:29},{n:"Rose Flare",s:4,p:5,r:60},
  {n:"Amber Burst",s:4,p:6,r:17},{n:"Polar Burst",s:4,p:7,r:85},{n:"Magma Flare",s:4,p:8,r:41},{n:"Chrome Burst",s:4,p:9,r:3},
  // WaveFlow
  {n:"Frequency",s:5,p:0,r:56},{n:"Ocean Wave",s:5,p:1,r:92},{n:"Solar Wave",s:5,p:2,r:23},
  {n:"Forest Wave",s:5,p:3,r:67},{n:"Cosmic Wave",s:5,p:4,r:45},{n:"Petal Wave",s:5,p:5,r:10},
  {n:"Golden Wave",s:5,p:6,r:80},{n:"Arctic Wave",s:5,p:7,r:34},{n:"Inferno Wave",s:5,p:8,r:59},{n:"Silver Wave",s:5,p:9,r:2},
  // BokehField
  {n:"Bokeh Dreams",s:6,p:0,r:74},{n:"Deep Focus",s:6,p:1,r:18},{n:"Fire Focus",s:6,p:2,r:43},
  {n:"Nature Focus",s:6,p:3,r:86},{n:"Cosmic Focus",s:6,p:4,r:31},{n:"Romance Focus",s:6,p:5,r:97},
  {n:"Sunspot Focus",s:6,p:6,r:14},{n:"Frost Focus",s:6,p:7,r:69},{n:"Lava Focus",s:6,p:8,r:52},{n:"Noir Focus",s:6,p:9,r:38},
  // InkBlot
  {n:"Ink Spill",s:7,p:0,r:5},{n:"Seafoam Spill",s:7,p:1,r:93},{n:"Ember Spill",s:7,p:2,r:26},
  {n:"Moss Spill",s:7,p:3,r:70},{n:"Nebula Spill",s:7,p:4,r:49},{n:"Blossom Spill",s:7,p:5,r:12},
  {n:"Honey Spill",s:7,p:6,r:87},{n:"Crystal Spill",s:7,p:7,r:25},{n:"Volcanic Spill",s:7,p:8,r:62},{n:"Smoke Spill",s:7,p:9,r:98},
  // GridGlow
  {n:"Neon Grid",s:8,p:0,r:30},{n:"Ocean Grid",s:8,p:1,r:76},{n:"Solar Grid",s:8,p:2,r:20},
  {n:"Forest Grid",s:8,p:3,r:54},{n:"Cosmic Grid",s:8,p:4,r:9},{n:"Blush Grid",s:8,p:5,r:84},
  {n:"Gold Grid",s:8,p:6,r:47},{n:"Ice Grid",s:8,p:7,r:1},{n:"Lava Grid",s:8,p:8,r:36},{n:"Chrome Grid",s:8,p:9,r:90},
  // CosmicDust
  {n:"Cosmic Dust",s:9,p:0,r:22},{n:"Aqua Stardust",s:9,p:1,r:68},{n:"Fire Stardust",s:9,p:2,r:40},
  {n:"Forest Stardust",s:9,p:3,r:15},{n:"Deep Void",s:9,p:4,r:73},{n:"Blush Void",s:9,p:5,r:58},
  {n:"Amber Void",s:9,p:6,r:95},{n:"Arctic Void",s:9,p:7,r:42},{n:"Crimson Void",s:9,p:8,r:81},{n:"Silver Void",s:9,p:9,r:65},
];

const ARTWORKS=ARTWORK_DEFS.map(d=>({name:d.n,fn:(ctx,w,h)=>{const pal=PALETTES[d.p],rng=mulberry32(d.r);STYLE_RENDERERS[d.s](ctx,w,h,pal,rng);}}));
let artIndex = 0;

function generateArtwork(index) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 640;
  const ctx = cv.getContext('2d');
  ARTWORKS[index % ARTWORKS.length].fn(ctx, 640, 640);
  return cv;
}

function sliceTile(artCanvas, tileIndex) {
  const col = tileIndex % SIZE, row = Math.floor(tileIndex / SIZE);
  const sw = artCanvas.width / SIZE, sh = artCanvas.height / SIZE;
  const cv = document.createElement('canvas');
  cv.width = sw; cv.height = sh;
  cv.getContext('2d').drawImage(artCanvas, col*sw, row*sh, sw, sh, 0, 0, sw, sh);
  return cv.toDataURL();
}

// ── Audio ─────────────────────────────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTick() {
  try {
    const ac=getAudio(), o=ac.createOscillator(), g=ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type='sine';
    o.frequency.setValueAtTime(540, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(740, ac.currentTime+0.05);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.1);
    o.start(); o.stop(ac.currentTime+0.12);
  } catch(e){}
}
function playError() {
  try {
    const ac=getAudio(), o=ac.createOscillator(), g=ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type='sawtooth';
    o.frequency.setValueAtTime(200, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(100, ac.currentTime+0.14);
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.18);
    o.start(); o.stop(ac.currentTime+0.2);
  } catch(e){}
}
function playWin() {
  try {
    const ac=getAudio();
    [523,659,784,1046].forEach((f,i) => {
      const o=ac.createOscillator(), g=ac.createGain();
      o.connect(g); g.connect(ac.destination); o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.14, ac.currentTime+i*0.13);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+i*0.13+0.38);
      o.start(ac.currentTime+i*0.13); o.stop(ac.currentTime+i*0.13+0.45);
    });
  } catch(e){}
}

// ── Taunts ────────────────────────────────────────────────────────────────────
const TAUNTS = [
  "This is a completely legal number of moves. Probably.",
  "The puzzle is winning. And you know it.",
  "At this rate you'll finish designing an entire brand before you finish this.",
  "Have you tried looking at the preview? Just a thought.",
  "{n} moves. Bold strategy. Let's see if it pays off.",
  "The tiles would like to go home. Please.",
  "The ones already in place don't need moving. Radical concept.",
  "Fun fact: you solved this left-handed once. While eating.",
  "{n} moves in and we are... somewhere. Somewhere is a place.",
  "The empty tile is lonely. It waits. It judges.",
];
let tauntIndex = 0;
function getTaunt(moves) {
  const t = TAUNTS[tauntIndex % TAUNTS.length];
  tauntIndex++;
  return t.replace('{n}', moves);
}

// ── Solvability ───────────────────────────────────────────────────────────────
function isSolvable(tiles) {
  let inv = 0;
  const flat = tiles.filter(t=>t!==0);
  for (let i=0;i<flat.length;i++) for (let j=i+1;j<flat.length;j++) if(flat[i]>flat[j]) inv++;
  const emptyRow = SIZE - Math.floor(tiles.indexOf(0)/SIZE);
  return (inv+emptyRow)%2===1;
}
function shuffleTiles() {
  const a = Array.from({length:TOTAL},(_,i)=>i);
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  if (!isSolvable(a)) { const i1=a.indexOf(1),i2=a.indexOf(2); [a[i1],a[i2]]=[a[i2],a[i1]]; }
  return a;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
export function burst(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const COLS=['#FF2D55','#BF5FFF','#00FFBD','#FFB800','#fff','#FF8C42'];
  const pieces = Array.from({length:160},()=>({
    x:Math.random()*canvas.width, y:-20-Math.random()*canvas.height*.5,
    c:COLS[Math.floor(Math.random()*COLS.length)],
    vx:(Math.random()-.5)*5, vy:2+Math.random()*5,
    rot:Math.random()*360, drot:(Math.random()-.5)*7,
    w:5+Math.random()*8, h:9+Math.random()*12, dead:false,
  }));
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=0;
    pieces.forEach(p => {
      if(p.dead) return;
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.13; p.rot+=p.drot;
      if(p.y>canvas.height+20){p.dead=true;return;}
      alive++;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if(alive>0) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

// ── Main export ───────────────────────────────────────────────────────────────
export function initPuzzle() {
  const modal    = document.getElementById('puzzleModal');
  const overlay  = document.getElementById('puzzleOverlay');
  const closeBtn = document.getElementById('puzzleClose');
  const openCard = document.getElementById('openPuzzleCard');
  const shuffBtn = document.getElementById('shuffleBtn');
  const artBtn   = document.getElementById('artBtn');
  const board    = document.getElementById('puzzleBoard');
  const moveEl   = document.getElementById('moveCount');
  const timerEl  = document.getElementById('timerDisplay');
  const hintEl   = document.getElementById('puzzleHint');
  const tauntEl  = document.getElementById('puzzleTaunt');
  const confetti = document.getElementById('confettiCanvas');
  const previewEl= document.getElementById('puzzlePreview');
  const artNameEl= document.getElementById('artName');

  if (!modal||!board) return;

  let tiles=[], moves=0, secs=0, timerID=null, won=false, tauntTID=null;
  let artCanvas=null, slices=[];

  function buildSlices() {
    artCanvas = generateArtwork(artIndex);
    slices = Array.from({length:TOTAL},(_,i) => sliceTile(artCanvas, i));
    if (previewEl) previewEl.style.backgroundImage = `url(${artCanvas.toDataURL()})`;
    if (artNameEl) artNameEl.textContent = ARTWORKS[artIndex%ARTWORKS.length].name;
  }

  const startTimer = () => {
    stopTimer();
    timerID = setInterval(() => {
      secs++;
      if(timerEl) timerEl.textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    },1000);
  };
  const stopTimer = () => { clearInterval(timerID); timerID=null; };

  function scheduleTaunt() {
    clearTimeout(tauntTID);
    if(won) return;
    tauntTID = setTimeout(()=>{
      if(!won&&moves>0&&tauntEl) tauntEl.textContent=getTaunt(moves);
      scheduleTaunt();
    }, 9000+Math.random()*8000);
  }

  function render() {
    board.innerHTML='';
    tiles.forEach((val,idx)=>{
      const t=document.createElement('div');
      t.classList.add('p-tile');
      if(val===0) {
        t.classList.add('p-empty');
      } else {
        const isCorrect = idx===val-1;
        if(isCorrect) t.classList.add('p-correct');
        t.style.backgroundImage=`url(${slices[val-1]})`;
        t.style.backgroundSize='100% 100%';
        const num=document.createElement('span');
        num.classList.add('p-num');
        num.textContent=val;
        t.appendChild(num);
        t.setAttribute('aria-label',`tile ${val}`);
        t.addEventListener('click',()=>tryMove(idx));
      }
      board.appendChild(t);
    });
  }

  function tryMove(idx) {
    if(won) return;
    const ei=tiles.indexOf(0);
    const r=Math.floor(idx/SIZE),c=idx%SIZE,er=Math.floor(ei/SIZE),ec=ei%SIZE;
    const adj=(Math.abs(r-er)===1&&c===ec)||(r===er&&Math.abs(c-ec)===1);
    if(!adj){
      playError();
      board.classList.add('shake');
      setTimeout(()=>board.classList.remove('shake'),400);
      return;
    }
    [tiles[idx],tiles[ei]]=[tiles[ei],tiles[idx]];
    moves++; playTick();
    if(moveEl) moveEl.textContent=moves;
    if(!timerID) startTimer();
    render(); checkWin();
  }

  function checkWin() {
    if(!tiles.every((v,i)=>i===TOTAL-1?v===0:v===i+1)) return;
    won=true; stopTimer(); clearTimeout(tauntTID); playWin();
    board.style.backgroundImage=`url(${artCanvas.toDataURL()})`;
    board.classList.add('p-solved');
    if(tauntEl) tauntEl.textContent=`🎉 ${moves} moves. Clean. That's how it's done.`;
    if(hintEl)  hintEl.textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} total time. Not bad at all.`;
    if(confetti) burst(confetti);
  }

  function newGame() {
    stopTimer(); clearTimeout(tauntTID);
    moves=0; secs=0; won=false; tauntIndex=0;
    board.style.backgroundImage=''; board.classList.remove('p-solved');
    if(moveEl)  moveEl.textContent='0';
    if(timerEl) timerEl.textContent='0:00';
    if(hintEl)  hintEl.textContent='';
    if(tauntEl) tauntEl.textContent="Go. Arrow keys work too. You've got this.";
    buildSlices(); tiles=shuffleTiles(); render(); scheduleTaunt();
  }

  document.addEventListener('keydown',(e)=>{
    if(!modal.classList.contains('open')) return;
    const ei=tiles.indexOf(0),er=Math.floor(ei/SIZE),ec=ei%SIZE;
    let t=-1;
    if(e.key==='ArrowUp'   &&er<SIZE-1) t=ei+SIZE;
    if(e.key==='ArrowDown' &&er>0)      t=ei-SIZE;
    if(e.key==='ArrowLeft' &&ec<SIZE-1) t=ei+1;
    if(e.key==='ArrowRight'&&ec>0)      t=ei-1;
    if(t!==-1){e.preventDefault();tryMove(t);}
  });

  const openModal=()=>{newGame();modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';};
  const closeModal=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';stopTimer();clearTimeout(tauntTID);};

  openCard?.addEventListener('click',openModal);
  openCard?.querySelector('.gc-btn')?.addEventListener('click',(e)=>{e.stopPropagation();openModal();});
  closeBtn?.addEventListener('click',closeModal);
  overlay?.addEventListener('click',closeModal);
  shuffBtn?.addEventListener('click', newGame);

  const styleSelect = document.getElementById('styleSelect');
  styleSelect?.addEventListener('change', () => {
    const val = parseInt(styleSelect.value);
    if (val === -1) {
      // Random — pick randomly from all 100
      artIndex = Math.floor(Math.random() * ARTWORKS.length);
    } else {
      // Pick a random artwork that uses this style index (0-9)
      const matching = ARTWORK_DEFS
        .map((d, i) => ({ d, i }))
        .filter(({ d }) => d.s === val);
      if (matching.length) {
        const pick = matching[Math.floor(Math.random() * matching.length)];
        artIndex = pick.i;
      }
    }
    newGame();
  });
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeModal();});
}
