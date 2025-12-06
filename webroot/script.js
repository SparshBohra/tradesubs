/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

// Realistic base prices for immediate display before server responds
const BASE_PRICES = {
  'wallstreetbets': 185.00,
  'cryptocurrency': 142.50,
  'bitcoin': 210.00,
  'ethereum': 165.00,
  'technology': 95.00,
  'programming': 72.50,
  'investing': 88.00,
  'personalfinance': 65.00,
  'memes': 45.00,
  'dankmemes': 38.50,
};

const DEFAULT_PRICE = 50.00;

class App {
  constructor() {
    this.portfolio = {};
    this.tradeHistory = [];
    this.currentPrices = { ...BASE_PRICES }; // Start with base prices
    this.capital = 50000;
    this.lastPrice = 0;
    this.updateInterval = null;
    this.currentStockData = null;
    this.currentPrice = 0;
    this.initialPrices = {};
    this.selectedSubreddit = null;

    // Detect page type
    const path = window.location.pathname;
    this.isMarketPage = path.includes('market.html');
    this.isTradingPage = path.includes('trading.html');
    this.isPortfolioPage = path.includes('portfolio.html');
    this.isSettingsPage = path.includes('settings.html');

    // Initialize based on page
    if (this.isMarketPage) {
      this.initializeMarketView();
    } else if (this.isTradingPage) {
      this.initializeTradingComponents();
    } else if (this.isPortfolioPage) {
      this.initializePortfolioView();
    } else if (this.isSettingsPage) {
      this.initializeSettingsView();
    }

    // Listen for messages from Devvit
    window.addEventListener('message', this.onMessage.bind(this));
    
    // Signal ready
    window.addEventListener('load', () => {
      postWebViewMessage({ 
        type: 'webViewReady',
        data: { loadCapital: true }
      });
    });
  }

  onMessage(ev) {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;
    
    switch (message.type) {
      case 'initialData':
        this.handleInitialData(message.data);
        break;
      case 'priceUpdate':
        this.handlePriceUpdate(message.data);
        break;
      case 'updatePortfolio':
        this.handlePortfolioUpdate(message.data);
        break;
      case 'tradeError':
        this.displayMessage(`Error: ${message.data.message}`);
        break;
    }
  }

  handleInitialData(data) {
    this.displayMessage('Connected to Karma Street');
    this.portfolio = data.portfolio || {};
    this.tradeHistory = data.tradeHistory || [];
    
    if (data.capital !== undefined) {
      this.capital = Number(data.capital);
    }
    
    // Use cached prices from server if available
    if (data.cachedPrices) {
      this.currentPrices = { ...this.currentPrices, ...data.cachedPrices };
      this.initialPrices = { ...data.cachedPrices };
      
      // Update market display immediately with cached prices
      if (this.isMarketPage) {
        Object.entries(data.cachedPrices).forEach(([sub, price]) => {
          this.updateMarketPriceDisplay(sub, price);
        });
      }
    }
    
    this.updateCapitalDisplay();
    this.updatePortfolioDisplay();
    this.updateTradeHistory();
    this.updateStats();
    
    // Request live prices for portfolio items
    Object.keys(this.portfolio).forEach(sub => this.requestPriceUpdate(sub));
  }

  handlePriceUpdate(data) {
    if (!data.stockData) return;
    
    const { subreddit, price } = data.stockData;
    this.currentPrices[subreddit] = price;
    
    if (this.isTradingPage && subreddit === this.selectedSubreddit) {
      this.updateStockDisplay(data.stockData);
    }
    
    if (this.isMarketPage) {
      this.updateMarketPriceDisplay(subreddit, price);
    }
    
    this.updatePortfolioDisplay();
  }

  handlePortfolioUpdate(data) {
    this.portfolio = data.portfolio || {};
    
    if (data.trade) {
      const tradeCost = data.trade.price * data.trade.amount;
      if (data.trade.type === 'buy') {
        this.capital -= tradeCost;
      } else {
        this.capital += tradeCost;
      }
      
      postWebViewMessage({ type: 'saveCapital', data: { capital: this.capital } });
      this.tradeHistory.push(data.trade);
      this.updateTradeHistory();
    }
    
    this.updateCapitalDisplay();
    this.updatePortfolioDisplay();
    this.displayMessage('Trade completed!');
    this.updateStats();
  }

  // ========== MARKET PAGE ==========
  initializeMarketView() {
    const trendingGrid = document.getElementById('trending-grid');
    const techGrid = document.getElementById('tech-grid');
    
    const subreddits = {
      trending: ['wallstreetbets', 'cryptocurrency', 'bitcoin', 'ethereum', 'memes'],
      tech: ['technology', 'programming', 'investing', 'personalfinance', 'dankmemes']
    };
    
    // Render with base prices immediately
    if (trendingGrid) this.renderStockCards(trendingGrid, subreddits.trending);
    if (techGrid) this.renderStockCards(techGrid, subreddits.tech);
    
    // Request live prices
    [...subreddits.trending, ...subreddits.tech].forEach(sub => this.requestPriceUpdate(sub));
    
    // Poll for updates every 5 seconds
    setInterval(() => {
      [...subreddits.trending, ...subreddits.tech].forEach(sub => this.requestPriceUpdate(sub));
    }, 5000);
  }

  renderStockCards(container, subreddits) {
    container.innerHTML = subreddits.map(name => {
      const price = this.currentPrices[name] || BASE_PRICES[name] || DEFAULT_PRICE;
      return `
      <a href="trading.html?subreddit=${name}" class="stock-card" data-subreddit="${name}" style="
        display: flex; align-items: center; gap: 12px;
        padding: 14px;
        background: #111114;
        border: 1px solid #27272a;
        border-radius: 12px;
        text-decoration: none; color: #fff;
        transition: all 0.2s;
      ">
        <div style="
          width: 42px; height: 42px;
          background: linear-gradient(135deg, #ff4500, #ff6b35);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 16px; color: white;
          flex-shrink: 0;
        ">${name[0].toUpperCase()}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px;">r/${name}</div>
          <div style="font-size: 11px; color: #71717a;">Subreddit Stock</div>
        </div>
        <div style="text-align: right;">
          <div class="stock-price" style="font-size: 16px; font-weight: 700; font-family: monospace; margin-bottom: 2px;">$${price.toFixed(2)}</div>
          <div class="stock-change" style="
            font-size: 12px; font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-block;
            background: rgba(16, 185, 129, 0.2); color: #10b981;
          ">+0.0%</div>
        </div>
      </a>
    `}).join('');
  }

  updateMarketPriceDisplay(subreddit, price) {
    const card = document.querySelector(`[data-subreddit="${subreddit}"]`);
    if (!card) return;
    
    const priceEl = card.querySelector('.stock-price');
    const changeEl = card.querySelector('.stock-change');
    
    // Track initial price for change calculation
    if (!this.initialPrices[subreddit]) {
      this.initialPrices[subreddit] = price;
    }
    
    const initial = this.initialPrices[subreddit];
    const changePct = initial > 0 ? ((price - initial) / initial) * 100 : 0;
    const isUp = changePct >= 0;
    
    if (priceEl) priceEl.textContent = `$${price.toFixed(2)}`;
    if (changeEl) {
      changeEl.textContent = `${isUp ? '+' : ''}${changePct.toFixed(1)}%`;
      changeEl.style.background = isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      changeEl.style.color = isUp ? '#10b981' : '#ef4444';
    }
  }

  // ========== TRADING PAGE ==========
  initializeTradingComponents() {
    this.messageElement = document.getElementById('message');
    this.subredditInput = document.getElementById('subreddit');
    this.amountInput = document.getElementById('amount');
    this.buyButton = document.getElementById('buyStock');
    this.sellButton = document.getElementById('sellStock');
    this.subredditList = document.getElementById('subreddit-list');
    this.tradeHistoryData = document.getElementById('trade-history-data');
    this.portfolioData = document.getElementById('portfolio-data');

    // Initialize chart
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer && window.PriceChart) {
      this.chart = new PriceChart(chartContainer);
    }

    this.setupTradingEventListeners();
    this.initializeSubredditList();
    this.initializeTradingView();
  }

  setupTradingEventListeners() {
    this.buyButton?.addEventListener('click', () => this.handleTrade('buy'));
    this.sellButton?.addEventListener('click', () => this.handleTrade('sell'));

    this.amountInput?.addEventListener('input', () => {
      this.updateOrderSummary();
    });

    this.subredditInput?.addEventListener('change', () => {
      const sub = this.subredditInput.value.trim().replace(/^r\//i, '');
      if (sub) {
        this.selectedSubreddit = sub;
        // Show base price immediately while loading
        this.currentPrice = this.currentPrices[sub] || BASE_PRICES[sub] || DEFAULT_PRICE;
        this.updateOrderSummary();
        this.startPriceUpdates();
      }
    });
  }

  initializeSubredditList() {
    const subs = Object.keys(BASE_PRICES);
    
    if (this.subredditList) {
      subs.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        this.subredditList.appendChild(option);
      });
    }
  }

  initializeTradingView() {
    const params = new URLSearchParams(window.location.search);
    const subreddit = params.get('subreddit');
    
    if (subreddit && this.subredditInput) {
      this.subredditInput.value = subreddit;
      this.selectedSubreddit = subreddit;
      
      const icon = document.getElementById('subreddit-icon');
      if (icon) icon.textContent = subreddit[0].toUpperCase();
      
      // Show base price immediately
      this.currentPrice = this.currentPrices[subreddit] || BASE_PRICES[subreddit] || DEFAULT_PRICE;
      const priceEl = document.getElementById('current-price');
      if (priceEl) priceEl.textContent = `$${this.currentPrice.toFixed(2)}`;
      
      this.updateOrderSummary();
      this.requestPriceUpdate(subreddit);
      this.updateInterval = setInterval(() => this.requestPriceUpdate(subreddit), 5000);
    }
  }

  handleTrade(action) {
    const subreddit = this.subredditInput?.value?.trim();
    const amount = parseInt(this.amountInput?.value);
    const price = this.currentPrice;

    if (!subreddit || isNaN(amount) || amount <= 0) {
      this.displayMessage('Enter valid subreddit and amount');
      return;
    }

    if (!price) {
      this.displayMessage('Waiting for price data...');
      return;
    }

    const totalCost = amount * price;

    if (action === 'buy' && totalCost > this.capital) {
      this.displayMessage('Insufficient funds');
      return;
    }

    if (action === 'sell') {
      const holding = this.portfolio[subreddit] || 0;
      if (amount > holding) {
        this.displayMessage(`You only own ${holding} shares`);
        return;
      }
    }

    const newCapital = action === 'buy' ? this.capital - totalCost : this.capital + totalCost;

    postWebViewMessage({
      type: action === 'buy' ? 'buyStock' : 'sellStock',
      data: { subreddit, amount, price, newCapital }
    });

    postWebViewMessage({ type: 'saveCapital', data: { capital: newCapital } });
  }

  updateStockDisplay(stockData) {
    if (!stockData) return;
    
    this.currentStockData = stockData;
    this.currentPrice = Number(stockData.price) || 0;

    // Update icon
    const icon = document.getElementById('subreddit-icon');
    if (icon) icon.textContent = stockData.subreddit[0].toUpperCase();

    // Update price
    const priceEl = document.getElementById('current-price');
    const changeEl = document.getElementById('price-change');
    
    if (priceEl) priceEl.textContent = `$${this.currentPrice.toFixed(2)}`;
    
    if (changeEl) {
      if (!this.lastPrices) this.lastPrices = {};
      const prev = this.lastPrices[stockData.subreddit] || this.currentPrice;
      const changePct = prev > 0 ? ((this.currentPrice - prev) / prev) * 100 : 0;
      this.lastPrices[stockData.subreddit] = this.currentPrice;
      
      const isUp = changePct >= 0;
      changeEl.textContent = `${isUp ? '+' : ''}${changePct.toFixed(2)}%`;
      changeEl.className = isUp ? 'price-up' : 'price-down';
      changeEl.style.background = isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      changeEl.style.color = isUp ? '#10b981' : '#ef4444';
    }

    // Update metrics
    const karma = document.getElementById('metric-karma');
    const posts = document.getElementById('metric-posts');
    const comments = document.getElementById('metric-comments');
    
    if (karma) karma.textContent = (stockData.karma || 0).toLocaleString();
    if (posts) posts.textContent = (stockData.posts || 0).toLocaleString();
    if (comments) comments.textContent = (stockData.comments || 0).toLocaleString();

    // Update order summary
    this.updateOrderSummary();

    // Update chart
    if (this.chart) {
      this.chart.addPrice(this.currentPrice, Date.now());
    }

    this.displayMessage(`Live: $${this.currentPrice.toFixed(2)}`);
  }

  updateOrderSummary() {
    const qty = parseInt(this.amountInput?.value) || 0;
    const price = this.currentPrice || 0;
    
    const orderPrice = document.getElementById('order-price');
    const orderQty = document.getElementById('order-qty');
    const orderTotal = document.getElementById('order-total');
    
    if (orderPrice) orderPrice.textContent = '$' + price.toFixed(2);
    if (orderQty) orderQty.textContent = qty;
    if (orderTotal) orderTotal.textContent = '$' + (qty * price).toFixed(2);
  }

  startPriceUpdates() {
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.requestPriceUpdate(this.selectedSubreddit);
    this.updateInterval = setInterval(() => this.requestPriceUpdate(this.selectedSubreddit), 5000);
  }

  // ========== PORTFOLIO PAGE ==========
  initializePortfolioView() {
    this.messageElement = document.getElementById('message');
    this.portfolioData = document.getElementById('portfolio-data');
    this.tradeHistoryData = document.getElementById('trade-history-data');
  }

  initializeSettingsView() {
    // Settings page initialization
  }

  // ========== SHARED FUNCTIONS ==========
  updateCapitalDisplay() {
    const formatCurrency = (val) => '$' + (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    ['capital-display', 'available-capital', 'settings-balance'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatCurrency(this.capital);
    });
  }

  updateStats() {
    const holdings = document.getElementById('stat-holdings');
    const trades = document.getElementById('stat-trades');
    const settingsTrades = document.getElementById('settings-trades');
    
    if (holdings) holdings.textContent = Object.keys(this.portfolio).length;
    if (trades) trades.textContent = this.tradeHistory.length;
    if (settingsTrades) settingsTrades.textContent = this.tradeHistory.length;
  }

  updatePortfolioDisplay() {
    if (!this.portfolioData) return;
    
    const entries = Object.entries(this.portfolio);
    if (entries.length === 0) {
      this.portfolioData.innerHTML = `
        <tr><td colspan="5">
          <div style="text-align: center; padding: 32px 16px; color: #71717a;">
            <p style="font-size: 13px; margin-bottom: 8px;">No holdings yet</p>
            <a href="market.html" style="color: #ff4500; text-decoration: none; font-size: 12px;">Browse the market →</a>
          </div>
        </td></tr>
      `;
      return;
    }

    let totalValue = 0;
    let totalInvestment = 0;

    const rows = entries.map(([sub, qty]) => {
      const buys = this.tradeHistory.filter(t => t.subreddit === sub && t.type === 'buy');
      const totalSpent = buys.reduce((s, t) => s + (t.price * t.amount), 0);
      const totalBought = buys.reduce((s, t) => s + t.amount, 0);
      const avgPrice = totalSpent / totalBought || 0;
      
      const currentPrice = this.currentPrices[sub] || BASE_PRICES[sub] || avgPrice;
      const value = currentPrice * qty;
      const pl = value - (avgPrice * qty);
      const plPct = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice * 100) : 0;
      const isProfit = pl >= 0;
      
      totalValue += value;
      totalInvestment += avgPrice * qty;

      return `
        <tr>
          <td style="padding: 12px; font-size: 12px; border-top: 1px solid #27272a;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #ff4500, #ff6b35); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">
                ${sub[0].toUpperCase()}
              </div>
              <span>r/${sub}</span>
            </div>
          </td>
          <td style="padding: 12px; font-size: 12px; border-top: 1px solid #27272a; font-family: monospace;">${qty}</td>
          <td style="padding: 12px; font-size: 12px; border-top: 1px solid #27272a; font-family: monospace;">$${avgPrice.toFixed(2)}</td>
          <td style="padding: 12px; font-size: 12px; border-top: 1px solid #27272a; font-family: monospace; font-weight: 600;">$${value.toFixed(2)}</td>
          <td style="padding: 12px; font-size: 12px; border-top: 1px solid #27272a; font-family: monospace; color: ${isProfit ? '#10b981' : '#ef4444'};">
            ${isProfit ? '+' : ''}$${pl.toFixed(2)} (${plPct.toFixed(1)}%)
          </td>
        </tr>
      `;
    }).join('');

    this.portfolioData.innerHTML = rows;

    // Update totals
    const portfolioValue = document.getElementById('portfolio-value');
    const portfolioChange = document.getElementById('portfolio-change');
    const settingsPortfolio = document.getElementById('settings-portfolio');
    const settingsPnl = document.getElementById('settings-pnl');
    
    if (portfolioValue) portfolioValue.textContent = `$${totalValue.toFixed(2)}`;
    
    if (portfolioChange) {
      const totalPL = totalValue - totalInvestment;
      const totalPLPct = totalInvestment > 0 ? ((totalPL / totalInvestment) * 100) : 0;
      const isProfit = totalPL >= 0;
      portfolioChange.innerHTML = `
        <span class="change-badge ${isProfit ? 'up' : 'down'}" style="padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background: ${isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${isProfit ? '#10b981' : '#ef4444'};">
          ${isProfit ? '+' : ''}$${Math.abs(totalPL).toFixed(2)}
        </span>
        <span class="change-pct" style="font-size: 12px; color: #71717a;">(${totalPLPct.toFixed(1)}%)</span>
      `;
    }
    
    if (settingsPortfolio) settingsPortfolio.textContent = '$' + totalValue.toFixed(2);
    if (settingsPnl) {
      const totalPL = totalValue - totalInvestment;
      settingsPnl.textContent = (totalPL >= 0 ? '+' : '') + '$' + totalPL.toFixed(2);
      settingsPnl.style.color = totalPL >= 0 ? '#10b981' : '#ef4444';
    }
  }

  updateTradeHistory() {
    if (!this.tradeHistoryData) return;

    if (this.tradeHistory.length === 0) {
      this.tradeHistoryData.innerHTML = `
        <tr><td colspan="6" style="text-align: center; padding: 24px; color: #71717a; font-size: 13px;">
          No trades yet
        </td></tr>
      `;
      return;
    }

    const rows = this.tradeHistory
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(trade => {
        const isBuy = trade.type.toLowerCase() === 'buy';
        return `
          <tr>
            <td style="padding: 8px 12px; font-size: 12px; border-top: 1px solid #27272a;">
              <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${isBuy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${isBuy ? '#10b981' : '#ef4444'};">
                ${trade.type.toUpperCase()}
              </span>
            </td>
            <td style="padding: 8px 12px; font-size: 12px; border-top: 1px solid #27272a;">r/${trade.subreddit}</td>
            <td style="padding: 8px 12px; font-size: 12px; border-top: 1px solid #27272a; font-family: monospace;">${trade.amount}</td>
            <td style="padding: 8px 12px; font-size: 12px; border-top: 1px solid #27272a; font-family: monospace;">$${Number(trade.price).toFixed(2)}</td>
            <td style="padding: 8px 12px; font-size: 12px; border-top: 1px solid #27272a; font-family: monospace; font-weight: 600;">$${Number(trade.total).toFixed(2)}</td>
          </tr>
        `;
      }).join('');

    this.tradeHistoryData.innerHTML = rows;
  }

  requestPriceUpdate(subreddit) {
    if (!subreddit) return;
    postWebViewMessage({
      type: 'requestPriceUpdate',
      data: { subreddit }
    });
  }

  displayMessage(text) {
    if (this.messageElement) {
      this.messageElement.textContent = text;
    }
    console.log('Message:', text);
  }
}

function postWebViewMessage(msg) {
  console.log('Posting to Devvit:', msg);
  parent.postMessage(msg, '*');
}

new App();
