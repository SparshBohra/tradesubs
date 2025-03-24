/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

class App {
  #onMessage;
  #handleTrade;
  #updatePortfolioDisplay;
  #updateTradeHistory;

  constructor() {
    // Initialize private methods first
    this.#updatePortfolioDisplay = () => {
      if (!this.portfolioData) return;
      console.log('Updating portfolio display:', this.portfolio);
      
      if (Object.keys(this.portfolio).length === 0) {
        this.portfolioData.innerHTML = '<p>No stocks in portfolio</p>';
        return;
      }

      const portfolioHtml = Object.entries(this.portfolio)
        .map(([subreddit, amount]) => `
          <div class="portfolio-item">
            <span class="subreddit">r/${subreddit}</span>
            <span class="amount">${amount} shares</span>
          </div>
        `)
        .join('');

      this.portfolioData.innerHTML = portfolioHtml;
    };

    this.#updateTradeHistory = () => {
      if (!this.tradeHistory || !this.tradeHistoryData) return;
      
      if (this.tradeHistory.length === 0) {
        this.tradeHistoryData.innerHTML = '<p>No trades yet</p>';
        return;
      }

      const tradesHtml = this.tradeHistory
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(trade => `
          <div class="trade-item">
            <span class="trade-type ${trade.type}">${trade.type.toUpperCase()}</span>
            <span class="trade-subreddit">r/${trade.subreddit}</span>
            <span class="trade-amount">${trade.amount} shares</span>
            <span class="trade-price">$${trade.price}</span>
            <span class="trade-total">$${trade.total}</span>
            <span class="trade-time">${new Date(trade.timestamp).toLocaleString()}</span>
          </div>
        `)
        .join('');

      this.tradeHistoryData.innerHTML = tradesHtml;
    };

    this.#handleTrade = (action) => {
      const subreddit = this.subredditInput.value.trim();
      const amount = parseInt(this.amountInput.value);
      const tradePrice = this.currentPrice; // Capture the current price at trade time

      if (!subreddit || isNaN(amount) || amount <= 0) {
        this.messageElement.textContent = 'Please enter valid subreddit and amount';
        return;
      }

      if (!tradePrice) {
        this.messageElement.textContent = 'Please wait for price data to load';
        return;
      }

      this.messageElement.textContent = `Processing ${action} order at $${tradePrice.toFixed(2)}...`;
      postWebViewMessage({
        type: action === 'buy' ? 'buyStock' : 'sellStock',
        data: { 
          subreddit, 
          amount,
          price: tradePrice, // Use the captured price
          stockData: this.currentStockData
        }
      });
    };

    // Get DOM references after method initialization
    this.usernameLabel = document.querySelector('#username');
    this.portfolioData = document.querySelector('#portfolio-data');
    this.messageElement = document.querySelector('#message');
    this.subredditInput = document.querySelector('#subreddit');
    this.amountInput = document.querySelector('#amount');
    this.buyButton = document.querySelector('#buyStock');
    this.sellButton = document.querySelector('#sellStock');
    this.subredditList = document.querySelector('#subreddit-list');
    this.tradeHistoryData = document.querySelector('#trade-history-data');

    // Initialize properties
    this.portfolio = {};
    this.tradeHistory = [];
    this.lastPrice = 0;
    this.updateInterval = null;
    this.currentStockData = null;
    this.currentPrice = 0;

    // Initialize message handler
    this.#onMessage = (ev) => {
      if (ev.data.type !== 'devvit-message') return;
      const { message } = ev.data.data;
      console.log('Received message:', message.type, message.data);
  
      switch (message.type) {
        case 'initialData': {
          this.messageElement.textContent = 'Connected to Karma Street';
          this.portfolio = message.data.portfolio || {};
          this.tradeHistory = message.data.tradeHistory || [];
          this.usernameLabel.textContent = message.data.username || 'Guest';
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
          if (message.data.trade) {
            this.tradeHistory.push(message.data.trade);
            this.#updateTradeHistory();
          }
          this.#updatePortfolioDisplay();
          this.messageElement.textContent = 'Trade completed successfully';
          break;
        }
        case 'tradeError': {
          this.messageElement.textContent = `Error: ${message.data.message}`;
          break;
        }
      }
    };

    // Set up event listeners
    window.addEventListener('message', this.#onMessage);
    window.addEventListener('load', () => {
      console.log('WebView loaded, sending ready message');
      this.messageElement.textContent = 'Connecting to Karma Street...';
      postWebViewMessage({ type: 'webViewReady' });
    });

    // Initialize components
    this.initializeSubredditList();
    this.setupEventListeners();
    
    // Initialize chart
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer && window.PriceChart) {
      this.chart = new PriceChart(chartContainer);
    }
  }

  setupEventListeners() {
    this.buyButton.addEventListener('click', () => this.#handleTrade('buy'));
    this.sellButton.addEventListener('click', () => this.#handleTrade('sell'));
    this.subredditInput.addEventListener('input', () => this.validateSubreddit());
    this.subredditInput.addEventListener('change', () => {
      this.startPriceUpdates();
      this.requestPriceUpdate();
    });
  }

  updateStockDisplay(stockData) {
    console.log('Updating stock display with:', stockData);
    if (!stockData) return;
    
    try {
      this.currentStockData = stockData;
      this.currentPrice = Number(stockData.price) || Number((stockData.karma / 100) * (1 + stockData.engagement));
      
      if (isNaN(this.currentPrice) || this.currentPrice <= 0) {
        console.error('Invalid price calculated:', this.currentPrice);
        return;
      }

      const priceChange = this.currentPrice - (this.lastPrice || this.currentPrice);
      this.lastPrice = this.currentPrice;

      // Update chart with new data
      if (this.chart) {
        this.chart.addPrice(this.currentPrice, Date.now());
      }

      const stockInfo = document.querySelector('#stock-info');
      if (!stockInfo) {
        console.error('Stock info element not found');
        return;
      }

      // Enable trading buttons when we have a valid price
      this.buyButton.disabled = false;
      this.sellButton.disabled = false;

      stockInfo.innerHTML = `
        <div class="stock-metrics">
          <div class="stock-price ${priceChange < 0 ? 'decrease' : ''}">
            $${this.currentPrice.toFixed(2)}
            ${priceChange !== 0 ? ` (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)})` : ''}
          </div>
          <div id="trade-price" class="trade-price">
            Trading Price: $${this.currentPrice.toFixed(2)}
          </div>
          <div class="stock-metrics-grid">
            <div class="metric-item">
              <div class="metric-label">New Posts</div>
              <div class="metric-value">${stockData.newPosts || 0}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Comments</div>
              <div class="metric-value">${stockData.comments || 0}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Engagement</div>
              <div class="metric-value">${((stockData.engagement || 0) * 100).toFixed(1)}%</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Volatility</div>
              <div class="metric-value">${(stockData.volatility || 0).toFixed(2)}</div>
            </div>
          </div>
          <div class="update-time">
            Last updated: ${new Date().toLocaleTimeString()}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error updating stock display:', error);
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

  validateSubreddit() {
    const value = this.subredditInput.value.trim().toLowerCase();
    const isValid = this.subredditList.querySelector(`option[value="${value}"]`);
    
    this.buyButton.disabled = !isValid;
    this.sellButton.disabled = !isValid;
    
    if (!isValid && value) {
      this.messageElement.textContent = 'Please select a valid subreddit';
    } else {
      this.messageElement.textContent = '';
    }
  }

  startPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    const subreddit = this.subredditInput.value.trim();
    if (!subreddit) return;

    // Initial update
    this.requestPriceUpdate();

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.requestPriceUpdate();
    },100); // Update every 5 seconds
  }

  requestPriceUpdate() {
    const subreddit = this.subredditInput.value.trim();
    postWebViewMessage({
      type: 'requestPriceUpdate',
      data: { subreddit }
    });
  }
}

function postWebViewMessage(msg) {
  console.log('Posting message to Devvit:', msg);
  parent.postMessage(msg, '*');
}

new App();
