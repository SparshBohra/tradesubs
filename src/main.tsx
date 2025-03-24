import "./createPost.js";

import { Devvit, useState, useWebView } from "@devvit/public-api";

import type { DevvitMessage, WebViewMessage } from "./message.js";
import { buyStock, sellStock } from "./api/trading.js";
import { getUserPortfolio } from "./api/portfolio.js";
import { calculateStockPrice } from "./api/calculateStock.js";
import { getTradeHistory } from "./api/trading.js";
import { getHistoricalPrices } from "./api/priceHistory.js";

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: "Karma Street Trading",
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
      // In your WebView onMessage handler:
      async onMessage(message, webView) {
        try {
          switch (message.type) {
            case "webViewReady": {
              const username = await context.reddit.getCurrentUsername();
              const portfolio = await getUserPortfolio(context, username);
              const tradeHistory = await getTradeHistory(context, username);

              webView.postMessage({
                type: "initialData",
                data: {
                  username,
                  portfolio,
                  tradeHistory,
                },
              });
              break;
            }
            case "buyStock": {
              const stockData = await calculateStockPrice(
                context,
                message.data.subreddit
              );
              // Use the price from the trade request instead of calculating new one
              const tradePrice = message.data.price;

              const result = await buyStock(
                context,
                username,
                message.data.subreddit ?? "",
                message.data.amount,
                tradePrice // Pass the trade price to buyStock
              );

              const updatedPortfolio = await getUserPortfolio(
                context,
                username
              );
              const updatedHistory = await getTradeHistory(context, username);
              setPortfolio(updatedPortfolio);
              webView.postMessage({
                type: "updatePortfolio",
                data: {
                  portfolio: updatedPortfolio,
                  trade: {
                    ...result.trade,
                    price: tradePrice, // Ensure we use the same price
                  },
                  tradeHistory: updatedHistory,
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
                tradePrice // Pass the trade price
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
              const price = await calculateStockPrice(
                context,
                message.data.subreddit
              );
              webView.postMessage({
                type: "stockPrice",
                data: { stockData: price },
              });
              break;
            // Add import at the top

            // In the requestPriceUpdate case
            case "requestPriceUpdate": {
              const subreddit = message.data.subreddit;
              console.log("Requesting price update for:", subreddit);

              try {
                const [price, historicalData] = await Promise.all([
                  calculateStockPrice(context, subreddit),
                  getHistoricalPrices(context, subreddit),
                ]);

                const messageData = {
                  type: "priceUpdate",
                  data: {
                    stockData: {
                      subreddit: subreddit,
                      price: price,
                      timestamp: Date.now(),
                      historicalData: historicalData,
                    },
                  },
                };
                console.log("Sending to WebView:", messageData.data);
                webView.postMessage(messageData as DevvitMessage);
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
      onUnmount() {
        context.ui.showToast("Web view closed!");
      },
    });

    // Render the custom post
    return (
      <vstack grow padding="small">
        <vstack grow alignment="middle center">
          <text size="xlarge" weight="bold">
            Karma Street Trading
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

          {/* Test Controls */}
          <spacer size="medium" />
          <hstack gap="medium">
            <button
              onPress={async () => {
                try {
                  await buyStock(context, username, "testsubreddit", 100);
                  const updated = await getUserPortfolio(context, username);
                  setPortfolio(updated);
                  context.ui.showToast({ text: "Test buy successful!" });
                } catch (error) {
                  context.ui.showToast({
                    text: error instanceof Error ? error.message : "Buy failed",
                    type: "error",
                  });
                }
              }}
            >
              Test Buy
            </button>
            <button
              onPress={async () => {
                try {
                  await sellStock(context, username, "testsubreddit", 50);
                  const updated = await getUserPortfolio(context, username);
                  setPortfolio(updated);
                  context.ui.showToast({ text: "Test sell successful!" });
                } catch (error) {
                  context.ui.showToast({
                    text:
                      error instanceof Error ? error.message : "Sell failed",
                    type: "error",
                  });
                }
              }}
            >
              Test Sell
            </button>
          </hstack>
        </vstack>
      </vstack>
    );
  },
});

export default Devvit;
