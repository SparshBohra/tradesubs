# 🏛️ Karma Street

**Buy the Hype. Sell the Cringe. Trade Subreddits Like Stocks.**

---

## 🚀 Elevator Pitch

> "What if Reddit was a stock market? Welcome to the Reddit Stock Exchange—where subreddits rise and fall like meme stocks. Buy, sell, and short-trending communities based on real engagement. Bet big on r/wallstreetbets? Ride the hype of r/cryptocurrency? Or play it safe with r/technology? Track sector indexes, predict market moves, and see if you have what it takes to be the ultimate Reddit investor. No real money, just karma dollars and bragging rights. Let’s trade some subs!" 📈🔥

## 🧠 About

Karma Street simulates a real-time trading experience where subreddits function as assets in a virtual market. Using Reddit engagement metrics like posts, comments, karma, and volatility, each subreddit gets a live “stock price” that updates regularly.

The vision is a fun, fast, Robinhood-style platform for trading social attention — built entirely on Reddit communities using Devvit.

## 💡 Features

### 📈 Real-Time Reddit Stock Market
*   **Every Subreddit = Stock:** Trade communities like you trade companies.
*   **Activity-Driven Prices:** Prices dynamically update based on posts, comments, karma growth, engagement ratios, and volatility.
*   **Virtual Trading:** Use "Karma Dollars" (virtual currency) to buy and sell shares.
*   **Portfolio Tracking:** Monitor your holdings, average cost, P&L, and trade history.

### 🔍 Sectoral Indexes & Super Index
Spot trends across categories, not just individual stocks. We track:
*   **Tech Index:** e.g., `r/technology`, `r/programming`, `r/cybersecurity`
*   **Crypto Index:** e.g., `r/Bitcoin`, `r/cryptocurrency`, `r/Ethereum`
*   **Meme Index:** e.g., `r/dankmemes`, `r/memes`, `r/ComedyCemetery`
*   **Finance Index:** e.g., `r/wallstreetbets`, `r/investing`, `r/personalfinance`
*   **Super Index:** An overall market average of all tracked subreddit prices.

### 📊 How Subreddit Stock Prices Are Calculated
Each subreddit’s stock price isn’t random — it’s driven by actual Reddit activity using a weighted scoring formula. We combine multiple factors to produce a live value reflecting how “hot” or “cold” a subreddit is.

**Simplified Formula:**

S(t) =
(W₁ × Posts) +
(W₂ × Comments) +
(W₃ × Karma Growth) +
(W₄ × Engagement Ratio) +
(W₅ × Volatility) +
(β × Momentum) +
(γ × Speculation) -
(α × Decay)

**Breakdown:**

*   **Core Activity Metrics (Weighted: `W₁` to `W₅`)**:
    *   `Posts (Pₜ)`: More new posts = higher price.
    *   `Comments (Cₜ)`: High conversation volume = deeper engagement.
    *   `Karma Growth (Kₜ)`: Net upvotes reflect community value/interest.
    *   `Engagement Ratio (Eₜ)`: Upvotes / (Upvotes + Downvotes) indicates content quality.
    *   `Volatility (Vₜ)`: Captures dramatic swings (sudden spikes or drops).

*   **Momentum Boost (`β × (Aₜ - Aₜ₋₁)`):**
    *   Rewards communities with rapidly increasing activity (posts, comments, karma).
    *   *Example:* `r/Bitcoin` gets 10x more karma today → Price spikes short-term.

*   **Speculation Multiplier (`γ × |Sₜ₋₁ - Sₜ₋₂| + 1`):**
    *   Detects wild price swings and amplifies value during volatile periods, mimicking meme stock hype.
    *   *Example:* `r/WallStreetBets` price fluctuates 200% → Speculation adds fuel to the fire.

*   **Decay Factor (`-α × (1 - A_growth) × Sₜ₋₁`):**
    *   Slowly reduces the price of inactive subreddits over time, simulating fading trends.
    *   *Example:* `r/GameOfThrones` sees no new activity → Its price decays.

**Why This Works:**
This approach ensures prices realistically:
*   📈 **Rise** when a subreddit is trending.
*   📉 **Fall** when it’s inactive or forgotten.
*   🎢 **Swing** during chaos, drama, or hype.
*   ⚖️ **Stabilize** when activity returns to normal.

## 🧰 Tech Stack (How It Was Built)

*   **Framework:** Reddit Devvit (TypeScript, React-like components)
*   **Frontend:** Vanilla HTML, CSS, JavaScript (within Devvit's WebView)
*   **Charting:** Chart.js for responsive and dynamic price charts.
*   **State Management:** Devvit's built-in Key-Value Store for persistence.
*   **Trading Logic:** Custom JavaScript engine for buy/sell operations, P&L tracking, and portfolio management within the WebView.

## 🎨 UI Highlights

*   Clean, modern trading interface inspired by platforms like Robinhood.
*   Smooth card transitions and intuitive navigation.
*   Live price charting with smooth updates.
*   Market page with horizontal scrolling categories (Trending, Tech, etc.).
*   Clear display of Karma, New Posts, and New Comments on the trading page.
*   Comprehensive Portfolio page with value summary, holdings table, and transaction history.
*   Settings page with a game reset option.
*   Consistent bottom navigation bar for easy movement between sections.
*   Designed to work fluidly within Reddit’s Devvit iframe constraints.

## ⚠️ Known Limitations

*   **Private/Banned Subreddits:** Data fetching fails if a subreddit becomes private or is banned, potentially freezing its price. Recent API changes or blackouts may also cause temporary inaccuracies.
*   **Limited Subreddit List:** Currently tracks a curated list of ~30-40 subreddits for performance and focus during the hackathon.
*   **Simplified Data:** Uses readily available post/comment counts and karma; doesn't yet incorporate deeper sentiment analysis or user activity patterns.
*   **Reset Persistence:** Game reset relies on clearing Devvit's storage; user needs to potentially reload the app for full effect.

## 🧗 Challenges & What We Overcame

*   Simulating a live market feel using Reddit's event-driven and API-based data.
*   Designing a price engine that balances multiple real-time metrics (activity, momentum, decay).
*   Optimizing WebView performance for chart rendering and state updates.
*   Working within the constraints and lifecycle of the Devvit platform.
*   Ensuring a smooth and intuitive UX for trading actions.

## 🚀 What’s Next (Roadmap)

*   **🧠 AI-Powered Market Engine:** Potential for a background agent (server/worker) to continuously compute prices for a wider range of subs.
*   **📈 Advanced Charts:** Integrate more TradingView-like features (candlesticks, zooming, indicators).
*   **🏆 Leaderboard / Leagues:** Introduce competitive elements based on portfolio value.
*   **🧾 Subreddit Insights:** Provide breakdowns explaining significant price movements.
*   **🔔 Live Alerts:** Notifications for price swings, volume spikes, or index movements.
*   **➕ Expand Subreddit List:** Allow users to request or vote on adding new subreddits.
*   **🌙 Dark Mode Toggle:** Implement the planned dark mode feature.
*   **📲 Standalone App Potential:** Explore possibilities beyond the Devvit platform.

## 🧪 Testing & Demo

You can test the Karma Street Devvit app here:

**[Link Needed]** `(Insert Devvit testing link here)`

**How to Use:**

1.  Navigate to the link above within Reddit (requires appropriate permissions/access).
2.  **Home:** Get an overview and navigate to Market or Portfolio.
3.  **Market:** Browse trending, tech, news, and other subreddit categories. Click a card to trade.
4.  **Trading:** View the live price chart and stats (Karma, New Posts/Comments). Enter an amount and click Buy or Sell.
5.  **Portfolio:** Check your current holdings, overall value, P&L, and transaction history.
6.  **Settings:** Reset your game data (capital, portfolio, history) if needed.

---

Happy Trading! 🚀