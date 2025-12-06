class PriceChart {
  constructor(container) {
    this.container = container;
    this.data = [];
    this.lastPrice = null;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Set initial size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.priceRange = { min: 0, max: 0, target: { min: 0, max: 0 } };
    this.animationFrame = null;
    
    // Draw empty state
    this.drawEmptyState();
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    
    if (this.data.length > 0) {
      this.draw();
    } else {
      this.drawEmptyState();
    }
  }

  drawEmptyState() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Background
    ctx.fillStyle = '#111114';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Grid
    this.drawGrid();
    
    // Empty message
    ctx.fillStyle = '#71717a';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Waiting for price data...', this.width / 2, this.height / 2);
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = '#1f1f23';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = (this.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= 6; i++) {
      const x = (this.width / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
  }

  updatePriceRange(prices) {
    const padding = 0.02;
    const min = Math.min(...prices) * (1 - padding);
    const max = Math.max(...prices) * (1 + padding);
    
    this.priceRange.target = { min, max };
    
    if (this.priceRange.min === 0 && this.priceRange.max === 0) {
      this.priceRange.min = min;
      this.priceRange.max = max;
    }
    
    this.animateChart();
  }

  animateChart() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const animate = () => {
      let needsAnimation = false;
      
      this.priceRange.min += (this.priceRange.target.min - this.priceRange.min) * 0.15;
      this.priceRange.max += (this.priceRange.target.max - this.priceRange.max) * 0.15;
      
      if (Math.abs(this.priceRange.target.min - this.priceRange.min) > 0.01 ||
          Math.abs(this.priceRange.target.max - this.priceRange.max) > 0.01) {
        needsAnimation = true;
      }

      this.draw();

      if (needsAnimation) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  draw() {
    if (!this.data.length) return;

    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    const padding = { left: 50, right: 10, top: 10, bottom: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear and background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111114';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    this.drawGrid();

    const priceRange = this.priceRange.max - this.priceRange.min;
    if (priceRange <= 0) return;

    // Draw area fill
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(255, 69, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
    
    this.data.forEach((point, i) => {
      const x = padding.left + (i / (this.data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.price - this.priceRange.min) / priceRange * chartHeight);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Complete the area
    ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    this.data.forEach((point, i) => {
      const x = padding.left + (i / (this.data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.price - this.priceRange.min) / priceRange * chartHeight);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw current price dot
    if (this.data.length > 0) {
      const lastPoint = this.data[this.data.length - 1];
      const x = padding.left + chartWidth;
      const y = padding.top + chartHeight - ((lastPoint.price - this.priceRange.min) / priceRange * chartHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4500';
      ctx.fill();
      
      // Glow effect
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
      ctx.fill();
    }

    // Draw price labels
    ctx.fillStyle = '#71717a';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
      const price = this.priceRange.max - (i / 4) * priceRange;
      const y = padding.top + (i / 4) * chartHeight;
      ctx.fillText(`$${price.toFixed(2)}`, padding.left - 6, y + 3);
    }
  }

  addPrice(price, timestamp) {
    if (!price || isNaN(price)) return;
    
    this.data.push({
      time: Math.floor(timestamp / 1000),
      price: price
    });

    // Keep last 50 points
    if (this.data.length > 50) {
      this.data.shift();
    }

    const prices = this.data.map(d => d.price);
    this.updatePriceRange(prices);
  }
}

window.PriceChart = PriceChart;
