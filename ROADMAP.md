# Karma Street — Product Roadmap

**Buy the Hype. Sell the Cringe. Trade Subreddits Like Stocks.**

---

## Current State Assessment (v0.1)

### What's Working
- Core trading engine with buy/sell functionality
- Price calculation based on Reddit activity metrics
- Portfolio management with P&L tracking
- WebView UI with Home, Market, Trading, Portfolio, Settings pages
- Basic Chart.js integration
- Devvit Redis storage for user data
- Reddit API integration for fetching subreddit data

### Critical Issues to Address
- Stock prices reset when app is closed (no background price updates)
- CSS file has massive duplication (3000+ lines with repeated styles)
- No shared global market state (each user sees independently calculated prices)
- No competitive or social features
- Limited to only 11 hardcoded subreddits

---

## Vision: What Makes Karma Street Successful?

### Core Value Propositions
1. Social Competition — Rankings, leaderboards, bragging rights
2. Prediction Game — Reward users who correctly predict subreddit trends
3. Reddit Native — Lives where the action is, feels like part of Reddit
4. Zero Real Risk — Fun gambling dopamine without financial consequences

### Success Metrics
- Daily Active Users
- Trades per Day
- Average Session Length
- Return Rate (users coming back)
- Social Sharing

---

## Phase 1: Foundation & Polish (2-3 weeks)

**Theme: Make it beautiful and stable**

### UI/UX Revamp
- Replace vanilla CSS with Tailwind CSS
- Create a distinctive design system (dark trading terminal aesthetic)
- Choose unique typography (IBM Plex Mono or JetBrains Mono)
- Implement glassmorphism cards for stock tiles
- Add animated number transitions for price changes
- Create micro-interactions on buy/sell buttons
- Add toast notifications for trade confirmations
- Implement loading skeletons while fetching prices

### Fix State Persistence
- Implement Devvit Scheduled Jobs to run every 5 minutes
- Calculate and store prices in Redis continuously
- Create a market snapshot that all users read from
- Separate price calculation from user sessions

### Price History Storage
- Store OHLC (Open, High, Low, Close) candle data
- Keep last 24 hours at 5-minute intervals
- Track trading volume per period
- Enable proper historical charting

---

## Phase 2: Advanced Charts & Trading Interface (2-3 weeks)

**Theme: Look like a real trading platform**

### TradingView Integration
- Implement TradingView Lightweight Charts library
- Add candlestick chart support
- Add line charts with area fills
- Enable multiple timeframes (1H, 4H, 1D, 1W)
- Display volume bars below price chart
- Show moving averages (7-day, 30-day)

### Trading Interface Redesign
- Large, clear price display with change percentage
- Full-width chart as the centerpiece
- Metrics grid showing Karma, Posts, Comments, Momentum
- Clean trade input with amount and total cost preview
- Prominent Buy and Sell buttons
- Watchlist functionality

---

## Phase 3: Social & Competitive Features (3-4 weeks)

**Theme: Make it a game people talk about**

### Global Leaderboard
- Top Portfolios — Richest players by portfolio value
- Best Week — Highest percentage gains this week
- Best Trades — Single most profitable trades
- Most Active — Most trades this week
- Diamond Hands — Longest held positions

### Achievements System
- Baby Steps — Complete your first trade
- Five Figures — Reach $10,000 portfolio value
- Double or Nothing — 2x your initial capital
- Meme Lord — Hold 5 meme subreddit stocks
- Index Fund — Hold 10+ different stocks
- Diamond Hands — Hold a stock for 30 days
- Day Trader — Make 50 trades in one day
- Whale Alert — Single trade worth $50,000+

### Social Features
- Share Trade Card — Generate shareable images of trades
- Weekly Digest — Summary of best/worst performers
- Price Alerts — Notifications when stocks hit certain prices
- Market Events — Automated posts when stocks spike or crash

---

## Phase 4: Advanced Market Mechanics (4-6 weeks)

**Theme: Depth like a real market**

### Order Types
- Market Orders — Buy/sell at current price
- Limit Orders — Buy/sell when price reaches target
- Stop Loss — Automatically sell to prevent losses
- Take Profit — Automatically sell to lock in gains

### Index Funds
- TECH Index — technology, programming, webdev, coding, linux
- CRYPTO Index — bitcoin, ethereum, cryptocurrency, defi
- MEME Index — dankmemes, memes, funny, wholesomememes
- FINANCE Index — wallstreetbets, investing, stocks, personalfinance
- GAMING Index — gaming, pcgaming, ps5, nintendo, xbox
- KARMA 500 — Top 500 subreddits by activity

### Short Selling
- Allow betting against subreddits
- Require collateral (150% of position value)
- Implement liquidation mechanics
- Add margin call warnings

### Market Events System
- SURGE — Price up 50% in 1 hour triggers momentum boost
- CRASH — Price down 30% in 1 hour triggers selling pressure
- VIRAL — Post hits r/all, temporary price boost
- DRAMA — High comment volatility increases speculation
- BLACKOUT — Subreddit goes private, trading halted

---

## Phase 5: Expansion & Scale (Ongoing)

**Theme: Become the definitive Reddit market**

### Subreddit Expansion
- Allow users to nominate subreddits for listing
- Community voting system for new listings
- IPO events when new subreddits are added
- Target: 500+ tracked subreddits

### Leagues & Seasons
- Quarterly seasons with fresh starts
- League tiers: Bronze, Silver, Gold, Diamond, Master
- Season rewards and recognition
- End-of-season tournaments

### External Integration
- Public API for checking prices
- Webhook notifications for price movements
- Discord bot integration
- Browser extension for Reddit

---

## Design Direction

### Color Palette
- Background: Near black (#0D0D0F)
- Card surfaces: Dark gray (#1A1A1D)
- Accent: Reddit orange (#FF4500)
- Profit: Bright green (#00D26A)
- Loss: Bright red (#FF3B30)
- Muted text: Gray (#6B7280)
- Highlights: Gold (#FBBF24)

### Typography
- Headlines: Space Grotesk or similar display font
- Body text: Inter or system fonts
- Numbers and prices: JetBrains Mono or similar monospace

### Visual Style
- Dark mode by default (trading terminal aesthetic)
- Subtle gradients on cards
- Glow effects on important elements
- Smooth animations and transitions
- Loading skeletons for better perceived performance

---

## Suggested Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Weeks 1-3 | UI polish, persistent prices, clean architecture |
| Phase 2 | Weeks 4-6 | TradingView charts, new trading interface |
| Phase 3 | Weeks 7-10 | Leaderboards, achievements, social features |
| Phase 4 | Weeks 11-16 | Order types, indexes, short selling |
| Phase 5 | Ongoing | Scale to 500+ subs, seasons, external API |

---

## Quick Wins (Do First)

1. Clean up the CSS file — Remove all the duplicated styles
2. Add Devvit Scheduler — Fix the price reset problem
3. Redesign the Trading page — Modern, polished look
4. Add loading states — Skeleton screens make it feel faster
5. Animate price changes — Numbers should smoothly tick up/down

---

## Architecture Evolution

### Current Setup
- WebView (HTML/CSS/JS) communicates with Devvit backend
- Devvit stores data in Redis
- Prices calculated on-demand when users request them

### Recommended Setup
- Devvit Scheduler runs every 5 minutes to update all prices
- Prices stored in Redis as the source of truth
- WebView reads cached prices instead of calculating
- Historical price data stored for charting
- Consider external server for complex operations at scale

---

## Key Success Factors

1. Visual Polish — Must look premium, not like a hackathon project
2. Persistence — Market should feel alive even when you're away
3. Competition — Leaderboards and social proof drive retention
4. Depth — Advanced features reward engaged users
5. Reddit Native — Feels like it belongs on Reddit

---

## Notes

Start with Phase 1. Don't skip ahead to fancy features until the foundation is solid. A beautiful, stable app with basic features will outperform a buggy app with advanced features.

The core concept is strong. The v0.1 proves the mechanics work. Now it's about execution and polish.

---

*Last Updated: December 2024*

