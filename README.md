# 🚀 Karma Street

Karma Street is a **Reddit-integrated stock trading game** where users **buy, sell, and short subreddit stocks** based on activity and momentum. This Devvit-powered app calculates **stock prices for subreddits**, tracks user portfolios, and enables in-app trading—all within Reddit.

---

## 📌 **Project Status**
✅ **Backend Setup Done**
⏳ **WebView UI & Testing Left**

---

## 📂 **Project Structure**
```
karma-street/
├── devvit.config.ts   # Devvit app configuration
├── devvit.yaml        # Devvit deployment config
├── package.json       # Dependencies & scripts
├── src/
│   ├── api/           # Business logic & API calls
│   │   ├── calculateStock.ts  # Subreddit stock price logic
│   │   ├── fetchData.ts       # Reddit data fetching
│   │   ├── portfolio.ts       # Portfolio management
│   │   ├── scheduler.ts       # Background tasks
│   │   └── trading.ts         # Buy/Sell logic
│   ├── main.ts        # App entry point
│   ├── models/        # Data models
│   │   ├── stock.ts   # Stock schema
│   │   ├── trade.ts   # Trade schema
│   │   └── user.ts    # User schema
│   ├── services/      # Business logic services
│   │   ├── stockService.ts    # Stock operations
│   │   └── tradeService.ts    # Trade operations
│   ├── storage/       # Redis-based storage
│   │   ├── storePortfolio.ts  # Portfolio storage
│   │   ├── storePrices.ts     # Subreddit price storage
│   │   └── storeTrades.ts     # Trade history storage
│   ├── utils/         # Utility functions
│   │   ├── constants.ts       # App-wide constants
│   │   ├── helpers.ts         # Helper functions
│   │   └── logger.ts          # Logging utils
│   └── webroot/       # WebView UI (Upcoming)
│       ├── app.js     # WebView logic
│       ├── page.html  # WebView UI template
│       └── styles.css # WebView styles
└── tsconfig.json      # TypeScript config
```

---

## 🛠 **Setup Instructions**

### 🔹 **1️⃣ Install Dependencies**
```sh
npm install
```

### 🔹 **2️⃣ Devvit Setup**
Make sure you are logged into Devvit CLI:
```sh
devvit login
```
Verify that your Reddit account has **developer permissions** for the subreddit.

### 🔹 **3️⃣ Upload & Deploy App**
Upload the app to Reddit:
```sh
devvit upload
```

Then, install it on your test subreddit:
```sh
devvit playtest r/KarmaStreetTest
```

## 🚀 **Running the App**
Once installed, the app will initialize in your subreddit:
* ✅ Backend runs within Reddit's infrastructure
* ✅ **Stock prices are updated based on subreddit activity**
* ✅ **Trading logic is live**
* ❌ **WebView UI is still in progress**

### **📝 Debugging Logs**
To check real-time logs:
```sh
devvit logs r/KarmaStreetTest
```

## 👫 **Adding a Teammate**
1. **Grant them Devvit access:**
   * Have them install the Devvit CLI:
   ```sh
   npm install -g @devvit/cli
   ```
   * Log into Devvit:
   ```sh
   devvit login
   ```
   * Ensure their Reddit account has **developer permissions** in r/KarmaStreetTest.

2. **Clone the repository:**
   ```sh
   git clone https://github.com/YOUR_GITHUB_USERNAME/karma-street.git
   cd karma-street
   npm install
   ```

3. **Run in Playtest Mode:**
   ```sh
   devvit playtest r/KarmaStreetTest
   ```

## 📌 **Next Steps**

### 🔲 **Frontend (WebView)**
* **Create UI for stock trading**
* **Integrate with backend via Devvit's useWebView hook**
* **Add buy/sell buttons in WebView**

### 🔲 **Testing & Debugging**
* **Verify Redis-based trade history storage**
* **Ensure correct stock price calculations**
* **Check for race conditions in trading logic**
