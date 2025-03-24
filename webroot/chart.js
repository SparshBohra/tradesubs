class PriceChart {
  constructor(container) {
    this.container = container;
    this.data = [];
    this.lastPrice = null;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Set initial size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.priceRange = {
      min: 0,
      max: 0,
      target: { min: 0, max: 0 }
    };
    
    // Add animation frame handling
    this.animationFrame = null;
  }

  resizeCanvas() {
    const padding = 40; // Add padding for price labels
    this.canvas.width = this.container.clientWidth - padding;
    this.canvas.height = this.container.clientHeight - padding;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${padding}px`;
    this.canvas.style.top = '20px';
    this.draw();
  }

  updatePriceRange(prices) {
    const min = Math.min(...prices) * 0.99;
    const max = Math.max(...prices) * 1.01;
    
    // Set target values for smooth transition
    this.priceRange.target = { min, max };
    
    // Initialize price range if not set
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
      
      // Smoothly adjust price range
      this.priceRange.min += (this.priceRange.target.min - this.priceRange.min) * 0.1;
      this.priceRange.max += (this.priceRange.target.max - this.priceRange.max) * 0.1;
      
      // Check if we need to continue animation
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
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear and draw background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#131722';
    ctx.fillRect(0, 0, width, height);

    this.drawGrid(ctx, width, height);

    // Use animated price range for drawing
    const priceRange = this.priceRange.max - this.priceRange.min;

    // Draw line with animation
    ctx.beginPath();
    ctx.strokeStyle = '#2962FF';
    ctx.lineWidth = 2;

    this.data.forEach((point, i) => {
      const x = (i / (this.data.length - 1)) * width;
      const y = height - ((point.price - this.priceRange.min) / priceRange * height);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevPoint = this.data[i - 1];
        const prevX = ((i - 1) / (this.data.length - 1)) * width;
        const prevY = height - ((prevPoint.price - this.priceRange.min) / priceRange * height);
        const cp1x = prevX + (x - prevX) / 2;
        ctx.quadraticCurveTo(cp1x, prevY, x, y);
      }
    });
    
    ctx.stroke();

    // Draw price labels with animated values
    this.drawPriceLabels(ctx, height);
  }

  drawPriceLabels(ctx, height) {
    ctx.fillStyle = '#787b86';
    ctx.font = '12px Arial';
    
    for (let i = 0; i <= 5; i++) {
      const price = this.priceRange.max - (i / 5) * (this.priceRange.max - this.priceRange.min);
      const y = (height / 5) * i;
      ctx.fillText(`$${price.toFixed(2)}`, 5, y + 15);
    }
  }

  addPrice(price, timestamp) {
    if (!price) return;
    
    const newPoint = {
      time: Math.floor(timestamp / 1000),
      price: price
    };

    this.data.push(newPoint);
    if (this.data.length > 50) {
      this.data.shift();
    }

    const prices = this.data.map(d => d.price);
    this.updatePriceRange(prices);
  }

  drawGrid(ctx, width, height) {
    ctx.strokeStyle = '#242832';
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const timeIntervals = 10;
    for (let i = 0; i <= timeIntervals; i++) {
      const x = (width / timeIntervals) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
}

window.PriceChart = PriceChart;