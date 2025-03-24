/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

class App {
  #onMessage;
  #handleTrade;
  #updatePortfolioDisplay;
  #updateTradeHistory;

  constructor() {
    this.#updatePortfolioDisplay = this._updatePortfolioDisplay.bind(this);
    this.#updateTradeHistory = this._updateTradeHistory.bind(this);
    this.#handleTrade = this._handleTrade.bind(this);
    this.#onMessage = this._onMessage.bind(this);

    this.portfolio = {};
    this.tradeHistory = [];
    this.lastPrice = 0;
    this.updateInterval = null;
    this.currentStockData = null;
    this.currentPrice = 0;

    const isMarketPage = window.location.pathname.includes('market.html');
    const isTradingPage = window.location.pathname.includes('trading.html');
    const isPortfolioPage = window.location.pathname.includes('portfolio.html');

    if (isMarketPage) {
      this.initializeMarketView();
    } else if (isTradingPage) {
      this.initializeTradingComponents();
    } else if (isPortfolioPage) {
      this.initializePortfolioView();
    }

    window.addEventListener('message', this.#onMessage);
    window.addEventListener('load', () => {
      postWebViewMessage({ type: 'webViewReady' });
    });

    setInterval(() => {
      postWebViewMessage({
        type: 'requestPortfolioUpdate',
        data: {}
      });
    }, 5000);
  }

  _onMessage(ev) {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;
    console.log('Received message:', message.type, message.data);

    switch (message.type) {
      case 'initialData': {
        this.displayMessage('Connected to Karma Street');
        this.portfolio = message.data.portfolio || {};
        this.tradeHistory = message.data.tradeHistory || [];
        this.#updatePortfolioDisplay();
        this.#updateTradeHistory();
        break;
      }
      case 'priceUpdate': {
        if (message.data.stockData) {
          this.updateStockDisplay(message.data.stockData);
        }
        break;
      }
      case 'updatePortfolio': {
        this.portfolio = message.data.portfolio;
        this.#updatePortfolioDisplay();
        if (message.data.trade) {
          this.tradeHistory.push(message.data.trade);
          this.#updateTradeHistory();
        }
        this.displayMessage('Trade completed successfully');
        break;
      }
      case 'tradeError': {
        this.displayMessage(`Error: ${message.data.message}`);
        break;
      }
    }
  }

  _handleTrade(action) {
    const subreddit = this.subredditInput.value.trim();
    const amount = parseInt(this.amountInput.value);
    const tradePrice = this.currentPrice;

    if (!subreddit || isNaN(amount) || amount <= 0) {
      this.displayMessage('Please enter valid subreddit and amount');
      return;
    }

    if (!tradePrice) {
      this.displayMessage('Please wait for price data to load');
      return;
    }

    this.displayMessage(`Processing ${action} order at $${tradePrice.toFixed(2)}...`);
    postWebViewMessage({
      type: action === 'buy' ? 'buyStock' : 'sellStock',
      data: {
        subreddit,
        amount,
        price: tradePrice,
        stockData: this.currentStockData
      }
    });
  }
  _updatePortfolioDisplay() {
    if (!this.portfolioData) return;
    console.log('Updating portfolio display:', this.portfolio);
    
    if (Object.keys(this.portfolio).length === 0) {
      this.portfolioData.innerHTML = '<tr><td colspan="5">No stocks in portfolio</td></tr>';
      return;
    }

    const portfolioHtml = Object.entries(this.portfolio)
      .map(([subreddit, quantity]) => {
        // Since the portfolio data seems to be just quantities, let's handle it differently
        return `
          <tr>
            <td>r/${subreddit}</td>
            <td>${quantity}</td>
            <td>$0.00</td>
            <td>$0.00</td>
            <td class="neutral">$0.00</td>
          </tr>
        `;
      })
      .join('');

    this.portfolioData.innerHTML = portfolioHtml;

    // Update total portfolio value and change (simplified for now)
    const portfolioValue = document.querySelector('#portfolio-value');
    const portfolioChange = document.querySelector('#portfolio-change');
    
    if (portfolioValue) {
      portfolioValue.textContent = '$0.00';
    }
    if (portfolioChange) {
      portfolioChange.textContent = '$0.00 (0%)';
      portfolioChange.className = 'value-change neutral';
    }
  }
  _updateTradeHistory() {
    if (!this.tradeHistory || !this.tradeHistoryData) return;

    console.log('Updating trade history:', this.tradeHistory);

    if (this.tradeHistory.length === 0) {
      this.tradeHistoryData.innerHTML = '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #6c757d;">No trades yet</td></tr>';
      return;
    }

    const tradesHtml = this.tradeHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(trade => `
        <tr>
          <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; color: ${trade.type.toLowerCase() === 'buy' ? '#28a745' : '#dc3545'}; font-weight: 500;">${trade.type.toUpperCase()}</td>
          <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef;">r/${trade.subreddit}</td>
          <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef;">${trade.amount}</td>
          <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; font-family: monospace;">$${Number(trade.price).toFixed(2)}</td>
          <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; font-family: monospace;">$${Number(trade.total).toFixed(2)}</td>
          <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 0.9em;">${new Date(trade.timestamp).toLocaleString()}</td>
        </tr>
      `)
      .join('');

    this.tradeHistoryData.innerHTML = tradesHtml;
  }

  displayMessage(text) {
    if (this.messageElement) {
      this.messageElement.textContent = text;
    }
    console.log('Message:', text);
  }

  initializeTradingComponents() {
    this.messageElement = document.querySelector('#message');
    this.subredditInput = document.querySelector('#subreddit');
    this.amountInput = document.querySelector('#amount');
    this.buyButton = document.querySelector('#buyStock');
    this.sellButton = document.querySelector('#sellStock');
    this.subredditList = document.querySelector('#subreddit-list');
    this.tradeHistoryData = document.querySelector('#trade-history-data');
    this.portfolioData = document.querySelector('#portfolio-data');

    if (this.portfolioData) {
      this.#updatePortfolioDisplay();
    }

    const chartContainer = document.getElementById('chart-container');
    if (chartContainer && window.PriceChart) {
      this.chart = new PriceChart(chartContainer);
    }

    this.setupEventListeners();
    this.initializeSubredditList();
    this.initializeTradingView();
  }

  setupEventListeners() {
    this.buyButton.addEventListener('click', () => this.#handleTrade('buy'));
    this.sellButton.addEventListener('click', () => this.#handleTrade('sell'));

    this.amountInput.addEventListener('input', () => {
      const amount = Number(this.amountInput.value);
      this.buyButton.disabled = !amount || amount <= 0;
      this.sellButton.disabled = !amount || amount <= 0;
    });

    this.subredditInput.addEventListener('input', () => this.validateSubreddit());
    this.subredditInput.addEventListener('change', () => {
      this.startPriceUpdates();
      this.requestPriceUpdate();
    });
  }

  initializeMarketView() {
    const trendingGrid = document.querySelector('#trending-grid');
    const techGrid = document.querySelector('#tech-grid');

    const subreddits = {
      trending: ['bitcoin', 'cryptocurrency', 'ethereum'],
      tech: ['technology', 'programming', 'artificialintelligence']
    };

    if (trendingGrid) {
      this.renderSubredditCards(trendingGrid, subreddits.trending.map(name => ({ name, price: 0, change: 0 })));
    }
    if (techGrid) {
      this.renderSubredditCards(techGrid, subreddits.tech.map(name => ({ name, price: 0, change: 0 })));
    }

    [...subreddits.trending, ...subreddits.tech].forEach(subreddit => {
      this.requestPriceUpdate(subreddit);
    });

    setInterval(() => {
      [...subreddits.trending, ...subreddits.tech].forEach(subreddit => {
        this.requestPriceUpdate(subreddit);
      });
    }, 5000);
  }

  initializePortfolioView() {
    this.messageElement = document.querySelector('#message');
    this.portfolioData = document.querySelector('#portfolio-data');
    this.tradeHistoryData = document.querySelector('#trade-history-data');
  }

  updateMarketPrice(stockData) {
    const price = Number(stockData.price) || Number((stockData.karma / 100) * (1 + stockData.engagement));
    const card = document.querySelector(`[data-subreddit="${stockData.subreddit}"]`);

    if (card && !isNaN(price)) {
      const priceElement = card.querySelector('.price');
      const changeElement = card.querySelector('.change');
      const oldPrice = Number(priceElement.textContent.replace('$', ''));

      const change = oldPrice ? ((price - oldPrice) / oldPrice) * 100 : 0;

      priceElement.textContent = `$${price.toFixed(2)}`;
      changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      changeElement.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
    }
  }

  renderSubredditCards(container, subreddits) {
    if (!container) return;

    container.innerHTML = subreddits.map(sub => `
      <div class="subreddit-card" data-subreddit="${sub.name}">
        <div class="card-content">
          <div class="subreddit-header">
            <div class="subreddit-icon">
              ${sub.name[0].toUpperCase()}
            </div>
            <div class="subreddit-title">
              <h3>r/${sub.name}</h3>
            </div>
          </div>
          
          <div class="price-container">
            <div class="main-price">
              <span class="price">$${sub.price.toFixed(2)}</span>
            </div>
            <div class="price-change">
              <span class="change ${sub.change >= 0 ? 'positive' : 'negative'}">
                ${sub.change >= 0 ? '↑' : '↓'} ${Math.abs(sub.change).toFixed(1)}%
              </span>
            </div>
          </div>

          <div class="metrics-container">
            <div class="metric">
              <span class="metric-label">24h Vol</span>
              <span class="metric-value">$${(sub.price * 1000).toFixed(2)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Karma</span>
              <span class="metric-value">${sub.karma || '0'}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Keep the click handler functionality
    const oldListener = container._clickListener;
    if (oldListener) {
      container.removeEventListener('click', oldListener);
    }

    const newListener = (e) => {
      const card = e.target.closest('.subreddit-card');
      if (card) {
        const subreddit = card.dataset.subreddit;
        window.location.href = `trading.html?subreddit=${subreddit}`;
      }
    };
    container.addEventListener('click', newListener);
    container._clickListener = newListener;
  }

  requestPriceUpdate(subreddit = null) {
    const targetSubreddit = subreddit || this.subredditInput?.value.trim();
    if (!targetSubreddit) return;

    postWebViewMessage({
      type: 'requestPriceUpdate',
      data: { subreddit: targetSubreddit }
    });
  }

  startPriceUpdates() {
    if (this.updateInterval) clearInterval(this.updateInterval);

    const subreddit = this.subredditInput.value.trim();
    if (!subreddit) return;

    this.requestPriceUpdate();

    this.updateInterval = setInterval(() => {
      this.requestPriceUpdate();
    }, 5000);
  }

  initializeTradingView() {
    const params = new URLSearchParams(window.location.search);
    const subreddit = params.get('subreddit');

    if (subreddit && this.subredditInput) {
      this.subredditInput.value = subreddit;
      this.startPriceUpdates();
      this.requestPriceUpdate();
    }
  }

  initializeSubredditList() {
    const subreddits = [
      'penkemongo',
      'wallstreetbets',
      'cryptocurrency',
      'technology',
      'programming',
      'bitcoin',
      'ethereum',
      'investing',
      'personalfinance',
      'memes',
      'dankmemes'
    ];

    subreddits.forEach(subreddit => {
      const option = document.createElement('option');
      option.value = subreddit;
      this.subredditList.appendChild(option);
    });
  }

  updateStockDisplay(stockData) {
      if (!stockData) return;
  
      try {
        this.currentStockData = stockData;
        this.currentPrice = Number(stockData.price) || Number((stockData.karma / 100) * (1 + stockData.engagement));
  
        if (isNaN(this.currentPrice)) {
          this.displayMessage('Error: Invalid price data received');
          return;
        }
  
        const priceChange = this.currentPrice - (this.lastPrice || this.currentPrice);
        this.lastPrice = this.currentPrice;
  
        // Update subreddit icon
        const subredditIcon = document.getElementById('subreddit-icon');
        if (subredditIcon) {
          subredditIcon.textContent = stockData.subreddit ? stockData.subreddit[0].toUpperCase() : 'R';
        }
  
        // Update price display
        const currentPrice = document.getElementById('current-price');
        const priceChangeElement = document.getElementById('price-change');
        
        if (currentPrice) {
          currentPrice.textContent = `$${this.currentPrice.toFixed(2)}`;
        }
        
        if (priceChangeElement) {
          const changePercent = this.lastPrice ? ((priceChange / this.lastPrice) * 100) : 0;
          priceChangeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
          priceChangeElement.style.backgroundColor = changePercent >= 0 ? '#e6f4ea' : '#fde7e9';
          priceChangeElement.style.color = changePercent >= 0 ? '#00c853' : '#ff3d00';
        }
  
        // Continue with chart updates
        if (this.chart) {
          this.chart.addPrice(this.currentPrice, Date.now());
        }

      const stockInfo = document.querySelector('#stock-info');
      if (stockInfo) {
        stockInfo.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; grid-column: span 3; text-align: center;">
              <div style="font-size: 32px; font-weight: 600; color: ${priceChange >= 0 ? '#00c853' : '#ff3d00'};">
                $${this.currentPrice.toFixed(2)}
                <span style="font-size: 18px; margin-left: 8px; font-weight: 500;">
                  ${priceChange >= 0 ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(2)}
                </span>
              </div>
            </div>

            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: #666; font-size: 14px; margin-bottom: 8px;">Karma</div>
              <div style="font-size: 24px; font-weight: 600; color: #1a1a1b;">${stockData.karma || 0}</div>
            </div>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: #666; font-size: 14px; margin-bottom: 8px;">Posts</div>
              <div style="font-size: 24px; font-weight: 600; color: #1a1a1b;">${stockData.posts || 0}</div>
            </div>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: #666; font-size: 14px; margin-bottom: 8px;">Comments</div>
              <div style="font-size: 24px; font-weight: 600; color: #1a1a1b;">${stockData.comments || 0}</div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error updating stock display:', error);
      this.displayMessage('Error updating stock display');
    }
  }

  validateSubreddit() {
    const value = this.subredditInput.value.trim().toLowerCase();
    const isValid = this.subredditList.querySelector(`option[value="${value}"]`);

    if (!isValid && value) {
      this.messageElement.textContent = 'Please select a valid subreddit';
    } else {
      this.messageElement.textContent = '';
    }
  }
}

function postWebViewMessage(msg) {
  console.log('Posting message to Devvit:', msg);
  parent.postMessage(msg, '*');
}

new App();
