/**
 * breeze.js - Floating leaves and cooling airflow breeze canvas animation
 * Accurately matches the green atmospheric floating leaves and air currents
 */

export class BreezeEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.leaves = [];
    this.animationId = null;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate wind streaks
    for (let i = 0; i < 22; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: 60 + Math.random() * 120,
        speed: 1.5 + Math.random() * 3.5,
        opacity: 0.15 + Math.random() * 0.35,
        curve: (Math.random() - 0.5) * 40
      });
    }

    // Generate floating green leaves
    for (let i = 0; i < 9; i++) {
      this.leaves.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 14 + Math.random() * 16,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        speedX: -1.2 - Math.random() * 1.5,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: 0.4 + Math.random() * 0.5
      });
    }

    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : window.innerWidth;
    this.height = this.canvas.height = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : window.innerHeight;
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw cooling wind airflows
    this.ctx.lineWidth = 1.5;
    for (const p of this.particles) {
      this.ctx.strokeStyle = `rgba(0, 229, 190, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.quadraticCurveTo(p.x - p.length / 2, p.y + p.curve, p.x - p.length, p.y);
      this.ctx.stroke();

      p.x -= p.speed;
      if (p.x + p.length < 0) {
        p.x = this.width + p.length;
        p.y = Math.random() * this.height;
      }
    }

    // Draw floating leaves
    for (const l of this.leaves) {
      this.ctx.save();
      this.ctx.translate(l.x, l.y);
      this.ctx.rotate(l.rotation);
      this.ctx.fillStyle = `rgba(16, 185, 129, ${l.opacity})`;

      // Draw leaf shape
      this.ctx.beginPath();
      this.ctx.moveTo(0, -l.size / 2);
      this.ctx.bezierCurveTo(l.size / 2, -l.size / 4, l.size / 2, l.size / 4, 0, l.size / 2);
      this.ctx.bezierCurveTo(-l.size / 2, l.size / 4, -l.size / 2, -l.size / 4, 0, -l.size / 2);
      this.ctx.fill();

      // Leaf vein
      this.ctx.strokeStyle = `rgba(5, 150, 105, ${l.opacity * 0.8})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -l.size / 2 + 2);
      this.ctx.lineTo(0, l.size / 2 - 2);
      this.ctx.stroke();

      this.ctx.restore();

      l.x += l.speedX;
      l.y += l.speedY;
      l.rotation += l.rotSpeed;

      if (l.x + l.size < 0) {
        l.x = this.width + 40;
        l.y = Math.random() * this.height;
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
