/**
 * particles.js
 * Subtle constellation of drifting dots connected by faint lines.
 * Performance-aware: reduces particle count on mobile.
 */

export function initParticles() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  function resize() {
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }

  window.addEventListener('resize', () => { resize(); buildParticles(); });
  resize();

  const isMobile = () => window.innerWidth < 768;

  class Particle {
    constructor() { this.reset(true); }

    reset(randomY = false) {
      this.x  = Math.random() * canvas.width;
      this.y  = randomY ? Math.random() * canvas.height : canvas.height + 10;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = -(Math.random() * 0.25 + 0.1);
      this.r  = Math.random() * 1.5 + 0.4;
      this.hue = Math.random() > 0.5 ? 345 : 270; // rose or lilac
      this.alpha = Math.random() * 0.55 + 0.1;
      this.life  = 0;
      this.maxLife = 300 + Math.random() * 400;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;

      // Gentle x drift
      this.vx += (Math.random() - 0.5) * 0.008;
      this.vx = Math.max(-0.5, Math.min(0.5, this.vx));

      // Fade in/out
      const progress = this.life / this.maxLife;
      const fade = progress < 0.1 ? progress * 10 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
      this.currentAlpha = this.alpha * fade;

      if (this.life >= this.maxLife || this.y < -10) this.reset(false);
      if (this.x < -10 || this.x > canvas.width + 10) {
        this.x = Math.random() * canvas.width;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 72%, ${this.currentAlpha})`;
      ctx.fill();
    }
  }

  function buildParticles() {
    const area = canvas.width * canvas.height;
    const count = Math.min(isMobile() ? 30 : 70, Math.floor(area / 14000));
    particles = Array.from({ length: count }, () => new Particle());
  }

  buildParticles();

  const MAX_DIST = 120;

  function drawLinks() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const a = (1 - d / MAX_DIST) * 0.1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255, 45, 85, ${a})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLinks();
    raf = requestAnimationFrame(animate);
  }

  animate();

  // Pause when tab is hidden (performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else animate();
  });
}
