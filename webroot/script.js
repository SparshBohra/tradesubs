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
    this.currentPrices = {}; // Add this to track prices per subreddit
    this.capital = null;  // Initialize as null instead of 5000
    this.lastPrice = 0;
    this.updateInterval = null;
    this.currentStockData = null;
    this.currentPrice = 0;
    this.initialPrices = {};

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
      postWebViewMessage({ 
        type: 'webViewReady',
        data: { loadCapital: true }  // Add flag to request capital
      });
    });
  }

  _onMessage(ev) {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;
    
    switch (message.type) {
      case 'initialData': {
        this.displayMessage('Connected to Karma Street');
        this.portfolio = message.data.portfolio || {};
        this.tradeHistory = message.data.tradeHistory || [];
        // Ensure capital is loaded from saved data
        if (message.data.capital !== undefined) {
          this.capital = message.data.capital;
        } else if (this.capital === null) {
          this.capital = 10000;  // Only set default if no saved capital
        }
        // Request prices for all portfolio items
        Object.keys(this.portfolio).forEach(subreddit => {
          this.requestPriceUpdate(subreddit);
        });
        this.#updatePortfolioDisplay();
        this.#updateTradeHistory();
        break;
      }
      case 'priceUpdate': {
        if (message.data.stockData) {
          const { subreddit, price } = message.data.stockData;
          this.currentPrices[subreddit] = price;
          this.updateStockDisplay(message.data.stockData);
          this.#updatePortfolioDisplay();
        }
        break;
      }
      case 'updatePortfolio': {
        this.portfolio = message.data.portfolio || {};
        if (message.data.trade) {
          // Update capital from server
          if (message.data.capital !== undefined) {
            this.capital = message.data.capital;
          }
          this.tradeHistory.push(message.data.trade);
          this.#updateTradeHistory();
        }
        this.#updatePortfolioDisplay();
        this.displayMessage('Trade completed successfully');
        
        // Request fresh price updates after trade
        Object.keys(this.portfolio).forEach(subreddit => {
          this.requestPriceUpdate(subreddit);
        });
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

    const totalCost = amount * tradePrice;
    const newCapital = action === 'buy' ? 
      this.capital - totalCost : 
      this.capital + totalCost;

    // First send the trade request
    postWebViewMessage({
      type: action === 'buy' ? 'buyStock' : 'sellStock',
      data: {
        subreddit,
        amount,
        price: tradePrice,
        stockData: this.currentStockData,
        newCapital: newCapital
      }
    });

    // Then explicitly save the capital update
    postWebViewMessage({
      type: 'saveCapital',
      data: {
        capital: newCapital
      }
    });
  }

  _onMessage(ev) {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;
    
    switch (message.type) {
      case 'initialData': {
        this.displayMessage('Connected to Karma Street');
        this.portfolio = message.data.portfolio || {};
        this.tradeHistory = message.data.tradeHistory || [];
        // Ensure capital is loaded from saved data
        if (message.data.capital !== undefined) {
          this.capital = Number(message.data.capital);
          // Immediately save the initial capital
          postWebViewMessage({
            type: 'saveCapital',
            data: { capital: this.capital }
          });
        } else {
          this.capital = 10000;
        }
        // Request prices for all portfolio items
        Object.keys(this.portfolio).forEach(subreddit => {
          this.requestPriceUpdate(subreddit);
        });
        this.#updatePortfolioDisplay();
        this.#updateTradeHistory();
        break;
      }
      case 'priceUpdate': {
        if (message.data.stockData) {
          const { subreddit, price } = message.data.stockData;
          console.log('UI received priceUpdate for:', subreddit, 'with price:', price);
          this.currentPrices[subreddit] = price;
      
          // 👇 Only call this in Trading Page
          if (window.location.pathname.includes('trading.html')) {
            this.updateStockDisplay(message.data.stockData);
          }
      
          this.updateMarketPrice(message.data.stockData);
          this.#updatePortfolioDisplay();
        }
        break;
      }         
      case 'updatePortfolio': {
        this.portfolio = message.data.portfolio || {};
        if (message.data.trade) {
          const tradeCost = message.data.trade.price * message.data.trade.amount;
          // Update capital based on trade type
          if (message.data.trade.type === 'buy') {
            this.capital = Number(this.capital) - Number(tradeCost);
          } else {
            this.capital = Number(this.capital) + Number(tradeCost);
          }
          
          // Save the updated capital
          postWebViewMessage({
            type: 'saveCapital',
            data: { capital: this.capital }
          });
          
          this.tradeHistory.push(message.data.trade);
          this.#updateTradeHistory();
        }
        this.#updatePortfolioDisplay();
        this.displayMessage('Trade completed successfully');
        
        // Request fresh price updates after trade
        Object.keys(this.portfolio).forEach(subreddit => {
          this.requestPriceUpdate(subreddit);
        });
        break;
      }
      case 'tradeError': {
        this.displayMessage(`Error: ${message.data.message}`);
        break;
      }
    }
  }

  _updatePortfolioDisplay() {
    if (!this.portfolioData) return;
    
    console.log('Portfolio update with prices:', {
      portfolio: this.portfolio,
      currentPrices: this.currentPrices,
      tradeHistory: this.tradeHistory
    });
    
    if (Object.keys(this.portfolio).length === 0) {
      this.portfolioData.innerHTML = '<tr><td colspan="5">No stocks in portfolio</td></tr>';
      return;
    }

    let totalPortfolioValue = 0;
    let totalInvestment = 0;

    const portfolioHtml = Object.entries(this.portfolio)
      .map(([subreddit, quantity]) => {
        const trades = this.tradeHistory.filter(
          trade => trade.subreddit === subreddit && trade.type === 'buy'
        );
        
        const totalSpent = trades.reduce((sum, trade) => sum + (trade.price * trade.amount), 0);
        const totalBought = trades.reduce((sum, trade) => sum + trade.amount, 0);
        const avgPrice = totalSpent / totalBought || 0;
        
        const currentPrice = this.currentPrices[subreddit] || avgPrice || 0;
        const currentValue = currentPrice * quantity;
        
        totalPortfolioValue += currentValue;
        totalInvestment += avgPrice * quantity;

        const profitLoss = currentValue - (avgPrice * quantity);
        const profitLossPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice * 100) : 
                                 (currentPrice > 0 ? Infinity : 0);

        return `
          <tr>
            <td>r/${subreddit}</td>
            <td>${quantity}</td>
            <td>$${avgPrice.toFixed(2)}</td>
            <td>$${currentValue.toFixed(2)}</td>
            <td class="${profitLoss >= 0 ? 'positive' : 'negative'}">
              ${profitLoss >= 0 ? '+' : ''}$${Math.abs(profitLoss).toFixed(2)} (${
                isFinite(profitLossPercent) ? profitLossPercent.toFixed(2) + '%' : 'Infinity%'
              })
            </td>
          </tr>
        `;
      })
      .join('');

    this.portfolioData.innerHTML = portfolioHtml;

    // Update totals
    const portfolioValue = document.querySelector('#portfolio-value');
    const portfolioChange = document.querySelector('#portfolio-change');
    
    if (portfolioValue) {
      portfolioValue.textContent = `$${totalPortfolioValue.toFixed(2)}`;
    }
    if (portfolioChange) {
      const totalPL = totalPortfolioValue - totalInvestment;
      const totalPLPercent = totalInvestment > 0 ? ((totalPL / totalInvestment) * 100) : 0;
      portfolioChange.textContent = `${totalPL >= 0 ? '+' : ''}$${totalPL.toFixed(2)} (${totalPLPercent.toFixed(2)}%)`;
      portfolioChange.className = `value-change ${totalPL >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Add available capital display
    const capitalDisplay = document.querySelector('#available-capital');
    if (capitalDisplay) {
      capitalDisplay.textContent = `Available Cash: $${this.capital.toFixed(2)}`;
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
      const rawValue = this.subredditInput.value.trim();
      const cleanSub = rawValue.replace(/^r\//i, '');
      console.log('Sanitized subreddit:', cleanSub);
      this.startPriceUpdates();
      this.requestPriceUpdate(cleanSub);
    });
    
  }

  initializeMarketView() {
    const trendingGrid = document.querySelector('#trending-grid');
    const techGrid = document.querySelector('#tech-grid');
  
    // Subreddits for UI display only
    const subreddits = {
      trending: ['penkemongo', 'wallstreetbets', 'cryptocurrency', 'bitcoin', 'ethereum'],
      tech: ['technology', 'programming', 'investing', 'personalfinance', 'memes', 'dankmemes']
    };
  
    if (trendingGrid) {
      this.renderSubredditCards(trendingGrid, subreddits.trending.map(name => ({ name, price: 0, change: 0 })));
    }
    if (techGrid) {
      this.renderSubredditCards(techGrid, subreddits.tech.map(name => ({ name, price: 0, change: 0 })));
    }
  
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

  async updateMarketPrice(stockData) {
    const price = Number(stockData.price) || 0;
    const card = document.querySelector(`[data-subreddit="${stockData.subreddit.toLowerCase()}"]`);
    if (!card) return;
    
    const priceElement = card.querySelector('.price');
    const changeElement = card.querySelector('.change');
    
    // Instead of comparing to the previous update, compare to the stored initial price.
    if (!(stockData.subreddit in this.initialPrices)) {
      this.initialPrices[stockData.subreddit] = stockData.price;
    }
    const initialPrice = this.initialPrices[stockData.subreddit];
    
    const dailyChangePct = ((price - initialPrice) / initialPrice) * 100;
    
    // Update DOM
    priceElement.textContent = `$${price.toFixed(2)}`;
    changeElement.textContent = `${dailyChangePct >= 0 ? '+' : ''}${dailyChangePct.toFixed(1)}% (daily)`;
    changeElement.className = `change ${dailyChangePct >= 0 ? 'positive' : 'negative'}`;
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
    const targetSubreddit = subreddit || this.selectedSubreddit || this.subredditInput.value.trim().replace(/^r\//i, '');
    console.log('Requesting price update for:', targetSubreddit);
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
      
      // 💥 Save the selected subreddit as this.selectedSubreddit
      this.selectedSubreddit = subreddit;
  
      // 💥 Make sure all updates stay scoped to selectedSubreddit
      this.requestPriceUpdate(this.selectedSubreddit);
      this.updateInterval = setInterval(() => {
        this.requestPriceUpdate(this.selectedSubreddit);
      }, 5000);
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
    if (!stockData || stockData.subreddit !== this.selectedSubreddit) return;  
  
      try {
        if (!this.stockDataMap) this.stockDataMap = {};
        this.stockDataMap[stockData.subreddit] = stockData;
        this.currentPrice = Number(stockData.price) || Number((stockData.karma / 100) * (1 + stockData.engagement));
  
        if (isNaN(this.currentPrice)) {
          this.displayMessage('Error: Invalid price data received');
          return;
        }
  
        if (!this.lastPrices) this.lastPrices = {};
        const previousPrice = this.lastPrices[stockData.subreddit] || this.currentPrice;
        const priceChange = this.currentPrice - previousPrice;
        this.lastPrices[stockData.subreddit] = this.currentPrice;

  
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
        const previousPrice = this.lastPrices[stockData.subreddit] || this.currentPrice;
        const changePercent = (previousPrice > 0)
          ? ((this.currentPrice - previousPrice) / previousPrice) * 100
          : 0;

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
              <div style="font-size: 16px; color: #666; margin-top: 8px;">
                Available Capital: $${this.capital.toFixed(2)}
              </div>
            </div>

            <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; text-align: center;">
              <div style="color: #666; font-size: 14px; margin-bottom: 8px;">Karma</div>
              <div style="font-size: 20px; font-weight: 600; color: #1a1a1b;">${stockData.karma || 0}</div>
            </div>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; text-align: center;">
              <div style="color: #666; font-size: 14px; margin-bottom: 8px;">New Posts</div>
              <div style="font-size: 20px; font-weight: 600; color: #1a1a1b;">${stockData.posts || 0}</div>
            </div>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; text-align: center;">
              <div style="color: #666; font-size: 14px; margin-bottom: 8px;">New Comments</div>
              <div style="font-size: 20px; font-weight: 600; color: #1a1a1b;">${stockData.comments || 0}</div>
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
