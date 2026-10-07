/**
 * chart.js - Smooth Responsive Temperature Trend Chart
 * Matches the reference image: area gradient, gridlines, curve, and latest reading highlight pill.
 */

export class TempTrendChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.readings = [];
    this.hoverIndex = -1;

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('resize', () => this.render(this.readings));

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      this.handleHover(x);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = -1;
      this.render(this.readings);
    });
  }

  handleHover(mouseX) {
    if (!this.readings || this.readings.length === 0) return;
    const padding = { top: 40, right: 36, bottom: 40, left: 50 };
    const chartWidth = this.canvas.clientWidth - padding.left - padding.right;
    const stepX = chartWidth / (this.readings.length - 1 || 1);

    let closestIdx = Math.round((mouseX - padding.left) / stepX);
    if (closestIdx < 0) closestIdx = 0;
    if (closestIdx >= this.readings.length) closestIdx = this.readings.length - 1;

    if (this.hoverIndex !== closestIdx) {
      this.hoverIndex = closestIdx;
      this.render(this.readings);
    }
  }

  render(readings) {
    if (!this.canvas || !this.ctx) return;
    this.readings = readings || [];

    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 46, right: 40, bottom: 40, left: 54 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minY = 20;
    const maxY = 40;
    const yTicks = [20, 25, 30, 35, 40];

    // 1. Draw horizontal gridlines & Y labels
    ctx.font = '500 11px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#8ea39c';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    yTicks.forEach(tick => {
      const y = padding.top + chartH - ((tick - minY) / (maxY - minY)) * chartH;

      ctx.strokeStyle = '#edf2f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(`${tick}°C`, padding.left - 12, y);
    });

    if (this.readings.length < 2) return;

    // Calculate Coordinates
    const points = this.readings.map((r, i) => {
      const x = padding.left + (i / (this.readings.length - 1)) * chartW;
      const y = padding.top + chartH - ((Math.min(Math.max(r.temp, minY), maxY) - minY) / (maxY - minY)) * chartH;
      return { x, y, temp: r.temp, timeLabel: r.timeLabel, speed: r.speed };
    });

    // 2. Draw Area Gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(0, 210, 170, 0.22)');
    gradient.addColorStop(1, 'rgba(0, 210, 170, 0.00)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y);
    }

    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Draw Smooth Curve Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y);
    }
    ctx.strokeStyle = '#00d2aa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 4. Draw Point Circles & X Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Thin out X labels to what the chart width can hold, always keeping the latest reading
    const labelStep = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(chartW / 72))));

    points.forEach((p, i) => {
      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#00d2aa';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Show X axis labels (filter to prevent overlapping on small screens)
      if ((points.length - 1 - i) % labelStep === 0) {
        ctx.fillStyle = '#8ea39c';
        ctx.fillText(p.timeLabel, p.x, padding.top + chartH + 12);
      }
    });

    // 5. Draw Latest Reading Callout Badge (or Hovered Point)
    const activePoint = this.hoverIndex !== -1 ? points[this.hoverIndex] : points[points.length - 1];

    if (activePoint) {
      // Highlight dot
      ctx.beginPath();
      ctx.arc(activePoint.x, activePoint.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#00d2aa';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pill Callout Box
      const text = `${activePoint.temp.toFixed(1)}°C`;
      ctx.font = '700 12px Plus Jakarta Sans, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const pillW = textWidth + 18;
      const pillH = 26;
      const pillX = Math.min(Math.max(activePoint.x - pillW / 2, padding.left), width - padding.right - pillW);
      const pillY = activePoint.y - 36;

      // Draw Pill
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 13);
      ctx.fillStyle = '#00d2aa';
      ctx.shadowColor = 'rgba(0, 210, 170, 0.4)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pill Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, pillX + pillW / 2, pillY + pillH / 2);

      // Tooltip Fan speed subtext on hover
      if (this.hoverIndex !== -1) {
        ctx.font = '500 10px Plus Jakarta Sans, sans-serif';
        const sub = `Fan: ${activePoint.speed}%`;
        ctx.fillStyle = '#5e736c';
        ctx.fillText(sub, pillX + pillW / 2, pillY - 10);
      }
    }
  }
}
