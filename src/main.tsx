import "./createPost.js";

import { Devvit, useState, useWebView } from "@devvit/public-api";

import type { DevvitMessage, WebViewMessage } from "./message.js";
import { buyStock, sellStock } from "./api/trading.js";
import { getUserPortfolio } from "./api/portfolio.js";
import { calculateStockPrice, getBasePrice } from "./api/calculateStock.js";
import { getTradeHistory } from "./api/trading.js";
import { getHistoricalPrices } from "./api/priceHistory.js";
import { saveUserCapital, getUserCapital } from "./api/capital.js";

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// List of all tradeable subreddits
const SUBREDDITS = [
  'wallstreetbets', 'cryptocurrency', 'bitcoin', 'ethereum', 
  'technology', 'programming', 'investing', 'personalfinance', 
  'memes', 'dankmemes'
];

// Get cached prices or base prices for immediate display
async function getCachedPrices(context: any): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  for (const sub of SUBREDDITS) {
    try {
      // Try to get cached price from Redis
      const cached = await context.redis.get(`price_${sub}`);
      if (cached) {
        prices[sub] = parseFloat(cached);
      } else {
        // Use base price if no cache
        prices[sub] = getBasePrice(sub);
      }
    } catch (e) {
      prices[sub] = getBasePrice(sub);
    }
  }
  
  return prices;
}

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: "r/KarmaStreetTrading",
  height: "tall",
  render: (context) => {
    // Load username with useState hook
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? "anon";
    });

    // Load user's portfolio from redis
    const [portfolio, setPortfolio] = useState(async () => {
      return await getUserPortfolio(context, username);
    });

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      url: "page.html",
      async onMessage(message, webView) {
        try {
          switch (message.type) {
            case "webViewReady": {
              const username = await context.reddit.getCurrentUsername();
              const portfolio = await getUserPortfolio(context, username);
              const tradeHistory = await getTradeHistory(context, username);
              const capital = await getUserCapital(context, username);
              
              // Get cached prices for immediate display
              const cachedPrices = await getCachedPrices(context);

              webView.postMessage({
                type: "initialData",
                data: {
                  username,
                  portfolio,
                  tradeHistory,
                  capital: capital ?? 50000,
                  cachedPrices, // Send cached prices immediately
                },
              });
              break;
            }

            case "saveCapital": {
              const username = await context.reddit.getCurrentUsername();
              await saveUserCapital(context, username, message.data.capital);
              break;
            }

            case "buyStock": {
              const stockData = await calculateStockPrice(
                context,
                message.data.subreddit
              );
              const tradePrice = message.data.price;

              const result = await buyStock(
                context,
                username,
                message.data.subreddit ?? "",
                message.data.amount,
                tradePrice
              );

              if (message.data.newCapital) {
                await saveUserCapital(
                  context,
                  username,
                  message.data.newCapital
                );
              }

              const updatedPortfolio = await getUserPortfolio(context, username);
              const updatedHistory = await getTradeHistory(context, username);
              const currentCapital = await getUserCapital(context, username);

              setPortfolio(updatedPortfolio);
              webView.postMessage({
                type: "updatePortfolio",
                data: {
                  portfolio: updatedPortfolio,
                  trade: result.trade,
                  tradeHistory: updatedHistory,
                  capital: currentCapital,
                },
              });
              break;
            }

            case "sellStock": {
              const tradePrice = message.data.price;

              const result = await sellStock(
                context,
                username,
                message.data.subreddit,
                message.data.amount,
                tradePrice
              );
              const latestPortfolio = await getUserPortfolio(context, username);
              const updatedHistory = await getTradeHistory(context, username);
              setPortfolio(latestPortfolio);
              webView.postMessage({
                type: "updatePortfolio",
                data: {
                  portfolio: latestPortfolio,
                  trade: result.trade,
                  tradeHistory: updatedHistory,
                },
              });
              break;
            }

            case "getStockPrice":
              const calculate = await calculateStockPrice(
                context,
                message.data.subreddit
              );
              const price = calculate.price;
              webView.postMessage({
                type: "stockPrice",
                data: { stockData: price },
              });
              break;

            case "requestPriceUpdate": {
              const subreddit = message.data.subreddit;
              
              try {
                // Get previous price from Redis for continuity
                const prevPriceStr = await context.redis.get(`price_${subreddit}`);
                const prevPrice = prevPriceStr ? parseFloat(prevPriceStr) : 0;
                
                // Calculate new price
                const cal = await calculateStockPrice(context, subreddit, prevPrice);
                
                // Save new price to Redis
                await context.redis.set(`price_${subreddit}`, cal.price.toString());
                
                const historicalData = await getHistoricalPrices(context, subreddit);

                webView.postMessage({
                  type: "priceUpdate",
                  data: {
                    stockData: {
                      subreddit: subreddit,
                      price: cal.price,
                      posts: cal.posts,
                      comments: cal.comments,
                      karma: cal.karma,
                      engagement: cal.engagement,
                      volatility: cal.volatility,
                      timestamp: Date.now(),
                      historicalData: historicalData,
                    },
                  },
                } as DevvitMessage);
              } catch (error) {
                console.error("Error updating price:", error);
                webView.postMessage({
                  type: "tradeError",
                  data: { message: "Failed to update price" },
                } as DevvitMessage);
              }
              break;
            }
          }
        } catch (error) {
          console.error(error);
        }
      },
    });

    // Render the custom post
    return (
      <vstack grow padding="small">
        <vstack grow alignment="middle center">
          <text size="xlarge" weight="bold">
            r/KarmaStreet
          </text>
          <spacer />
          <vstack alignment="start middle">
            <hstack>
              <text size="medium">Username:</text>
              <text size="medium" weight="bold">
                {" "}
                {username ?? ""}
              </text>
            </hstack>
          </vstack>
          <spacer />
          <button onPress={() => webView.mount()}>Launch Trading App</button>
          <spacer size="medium" />
        </vstack>
      </vstack>
    );
  },
});

export default Devvit;
