# 🏛️ Karma Street

**Buy the Hype. Sell the Cringe. Trade Subreddits Like Stocks.**

A Reddit trading simulation game built with Devvit where subreddits function as stocks. Prices move based on real Reddit activity — karma, posts, comments, and engagement.

![Karma Street](https://img.shields.io/badge/Platform-Reddit-FF4500?style=flat-square&logo=reddit)
![Devvit](https://img.shields.io/badge/Built%20with-Devvit-000000?style=flat-square)

## 🎮 How It Works

1. **Browse** — Explore subreddits on the market
2. **Analyze** — Check karma, posts, and price trends
3. **Trade** — Buy low, sell high with karma dollars
4. **Profit** — Track your gains in your portfolio

Start with **$50,000** in virtual karma dollars and see if you can beat the market!

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommended: Node 20 LTS)
- A Reddit account
- A subreddit you moderate (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/karma-street.git
cd karma-street

# Remove any existing devvit installation (if needed)
npm uninstall -g devvit

# Install dependencies
npm install

# Login to Reddit (opens browser)
npx @devvit/cli@latest login

# Run the app locally
npx @devvit/cli@latest playtest KarmaStreetTest
```

Replace `KarmaStreetTest` with your test subreddit name.

### Creating a Trading Post

1. Go to your test subreddit
2. Click **Create Post**
3. Select **r/KarmaStreetTrading** from post types
4. Click **Launch Trading App**

## 📊 Features

- **Real-Time Prices** — Prices update every 5 seconds based on Reddit activity
- **10+ Tradeable Subreddits** — Including r/wallstreetbets, r/bitcoin, r/technology
- **Portfolio Tracking** — Monitor holdings, P&L, and trade history
- **Realistic Price Movement** — ±1-2% changes per update, no wild swings
- **Dark Trading Terminal UI** — Professional, mobile-friendly interface

## 💰 Subreddit Stock Prices

| Subreddit | Base Price | Category |
|-----------|-----------|----------|
| r/bitcoin | $210 | Crypto |
| r/wallstreetbets | $185 | Finance |
| r/ethereum | $165 | Crypto |
| r/cryptocurrency | $142 | Crypto |
| r/technology | $95 | Tech |
| r/investing | $88 | Finance |
| r/programming | $72 | Tech |
| r/personalfinance | $65 | Finance |
| r/memes | $45 | Meme |
| r/dankmemes | $38 | Meme |

## 🛠️ Tech Stack

- **Framework:** Reddit Devvit (TypeScript)
- **Frontend:** Vanilla HTML/CSS/JS (WebView)
- **Storage:** Devvit Redis
- **API:** Reddit API for subreddit data

## 📁 Project Structure

```
karma-street/
├── src/
│   ├── main.tsx           # Entry point & WebView handler
│   ├── createPost.tsx     # Post type & scheduler
│   ├── api/               # Backend logic
│   │   ├── calculateStock.ts
│   │   ├── trading.ts
│   │   └── ...
│   ├── storage/           # Redis operations
│   └── utils/             # Helpers
├── webroot/               # Frontend files
│   ├── page.html          # Home
│   ├── market.html        # Market view
│   ├── trading.html       # Trading interface
│   ├── portfolio.html     # Portfolio
│   ├── script.js          # Frontend logic
│   └── chart.js           # Price chart
├── devvit.yaml            # App config
└── package.json
```

## 🎯 Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full development plan.

**Phase 1** ✅ — UI/UX revamp, realistic prices, persistent state
**Phase 2** — TradingView charts, advanced trading
**Phase 3** — Leaderboards, achievements, social features
**Phase 4** — Order types, indexes, short selling

## 📝 Commands

```bash
# Login to Reddit
npx @devvit/cli@latest login

# Run locally with hot reload
npx @devvit/cli@latest playtest <subreddit>

# Upload to Reddit
npx @devvit/cli@latest upload

# View logs
npx @devvit/cli@latest logs <subreddit>
```

## ⚠️ Known Limitations

- Private/banned subreddits may cause price freezes
- Limited to curated list of ~10 subreddits
- Prices reset if Redis data is cleared

## 🤝 Contributing

Contributions welcome! Please read the roadmap first.

## 📄 License

BSD-3-Clause

---

**No real money. Just vibes and karma.** 🚀
