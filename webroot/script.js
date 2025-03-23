/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

class App {
  constructor() {
    // Get references to the HTML elements
    this.usernameLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#username'));
    this.portfolioData = /** @type {HTMLDivElement} */ (document.querySelector('#portfolio-data'));
    this.messageElement = /** @type {HTMLParagraphElement} */ (document.querySelector('#message'));
    
    // Trading form elements
    this.subredditInput = /** @type {HTMLInputElement} */ (document.querySelector('#subreddit'));
    this.amountInput = /** @type {HTMLInputElement} */ (document.querySelector('#amount'));
    this.buyButton = /** @type {HTMLButtonElement} */ (document.querySelector('#buyStock'));
    this.sellButton = /** @type {HTMLButtonElement} */ (document.querySelector('#sellStock'));
    
    this.portfolio = {};

    // Event listeners setup
    addEventListener('message', this.#onMessage);
    addEventListener('load', () => {
      console.log('WebView loaded, sending ready message');
      postWebViewMessage({ type: 'webViewReady' });
    });

    this.buyButton.addEventListener('click', () => {
      console.log('Buy button clicked');
      this.#handleTrade('buy');
    });
    this.sellButton.addEventListener('click', () => {
      console.log('Sell button clicked');
      this.#handleTrade('sell');
    });
    
    // Add subreddit list handling
    this.subredditList = /** @type {HTMLDataListElement} */ (document.querySelector('#subreddit-list'));
    this.initializeSubredditList();
    
    // Add validation for subreddit input
    this.subredditInput.addEventListener('input', () => this.validateSubreddit());
    this.lastPrice = 0;
    this.updateInterval = null;
    
    // Add subreddit change handler
    this.subredditInput.addEventListener('change', () => {
      this.startPriceUpdates();
    });
    // Add trade history element reference
    this.tradeHistoryData = /** @type {HTMLDivElement} */ (document.querySelector('#trade-history-data'));
    this.tradeHistory = [];
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
    }, 5000); // Update every 5 seconds
  }

  requestPriceUpdate() {
    const subreddit = this.subredditInput.value.trim();
    postWebViewMessage({
      type: 'requestPriceUpdate',
      data: { subreddit }
    });
  }

  updateStockDisplay(stockData) {
    console.log('Received stock data in WebView:', stockData);
    if (!stockData) {
      console.error('No stock data received');
      return;
    }

    try {
      // Calculate price based on the metrics we have
      const price = (stockData.karma / 100) * (1 + stockData.engagement);
      const priceChange = price - (this.lastPrice || price);
      this.lastPrice = price;

      const stockInfo = document.querySelector('#stock-info');
      if (!stockInfo) {
        console.error('Stock info element not found');
        return;
      }

      stockInfo.innerHTML = `
        <div class="stock-metrics">
          <div class="stock-price ${priceChange < 0 ? 'decrease' : ''}">
            $${price.toFixed(2)}
            ${priceChange !== 0 ? ` (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)})` : ''}
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
      this.messageElement.textContent = 'Error updating stock display';
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

  #handleTrade(action) {
    const subreddit = this.subredditInput.value.trim();
    const amount = parseInt(this.amountInput.value);

    console.log(`Handling ${action} trade:`, { subreddit, amount });

    if (!subreddit || isNaN(amount) || amount <= 0) {
      this.messageElement.textContent = 'Please enter valid subreddit and amount';
      return;
    }

    this.messageElement.textContent = `Processing ${action} order...`;
    postWebViewMessage({
      type: action === 'buy' ? 'buyStock' : 'sellStock',
      data: { subreddit, amount }
    });
  }

  // Add trade history update method
  #updateTradeHistory() {
      console.log('Updating trade history:', this.tradeHistory);
      if (!this.tradeHistory || this.tradeHistory.length === 0) {
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
                  <span class="trade-price">$${trade.price.toFixed(2)}</span>
                  <span class="trade-total">$${trade.total.toFixed(2)}</span>
                  <span class="trade-time">${new Date(trade.timestamp).toLocaleString()}</span>
              </div>
          `)
          .join('');
  
      this.tradeHistoryData.innerHTML = tradesHtml;
  }

  // Update the onMessage handler
  #onMessage = (ev) => {
      if (ev.data.type !== 'devvit-message') return;
      const { message } = ev.data.data;
  
      switch (message.type) {
          case 'initialData': {
              console.log('Received initial data:', message.data);
              this.portfolio = message.data.portfolio || {};
              this.tradeHistory = message.data.tradeHistory || [];
              this.usernameLabel.textContent = message.data.username || 'Guest';
              this.#updatePortfolioDisplay();
              this.#updateTradeHistory();
              break;
          }
          case 'updatePortfolio': {
              console.log('Portfolio updated:', message.data);
              this.portfolio = message.data.portfolio;
              if (message.data.trade) {
                  this.tradeHistory.push(message.data.trade);
                  this.#updateTradeHistory();
              }
              this.#updatePortfolioDisplay();
              this.messageElement.textContent = 'Trade completed successfully';
              break;
          }
          case 'priceUpdate': {
              const stockData = message.data.stockData;
              console.log('Stock Metrics:', {
                  price: stockData?.price,
                  newPosts: stockData?.newPosts,
                  comments: stockData?.comments,
                  karma: stockData?.karma,
                  engagement: stockData?.engagement,
                  volatility: stockData?.volatility
              });
              
              if (stockData) {
                  this.updateStockDisplay(stockData);
              }
              break;
          }
          case 'priceUpdate': {
              console.log('Price update received:', message.data);
              console.log('Stock data details:', message.data.stockData);
              console.log('Price value:', message.data.stockData?.price);
              if (message.data.stockData) {
                  this.updateStockDisplay(message.data.stockData);
              } else {
                  console.error('Missing stock data in price update');
              }
              break;
          }
          case 'updatePortfolio': {
              console.log('Portfolio updated:', message.data.portfolio);
              this.portfolio = message.data.portfolio;
              this.#updatePortfolioDisplay();
              this.messageElement.textContent = 'Trade completed successfully';
              break;
          }
          case 'tradeError': {
              console.error('Trade error:', message.data.message);
              this.messageElement.textContent = `Error: ${message.data.message}`;
              break;
          }
          default: {
              console.warn('Unknown message type:', message.type);
              break;
          }
      }
  }
  updateStockDisplay(stockData) {
    console.log('Updating stock display with:', stockData);
    if (!stockData) {
        console.error('No stock data received');
        return;
    }

    const stockInfo = document.querySelector('#stock-info');
    if (!stockInfo) {
        console.error('Stock info element not found');
        return;
    }

    try {
      // Use the price directly from backend
      const price = stockData.price;
      const priceChange = price - (this.lastPrice || price);
      this.lastPrice = price;

      stockInfo.innerHTML = `
        <div class="stock-metrics">
          <div class="stock-price ${priceChange < 0 ? 'decrease' : ''}">
            $${price.toFixed(2)}
            ${priceChange !== 0 ? ` (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)})` : ''}
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
      this.messageElement.textContent = 'Error updating stock display';
    }
  }

  #updatePortfolioDisplay() {
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
  }
}

function postWebViewMessage(msg) {
  console.log('Posting message to Devvit:', msg);
  parent.postMessage(msg, '*');
}

new App();
