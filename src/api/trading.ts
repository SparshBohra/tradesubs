import { Trade } from "../models/trade.js";
import { calculateStockPrice } from "./calculateStock.js";

export async function buyStock(
  context: any,
  user: string,
  subreddit: string,
  amount: number,
  tradePrice?: number
) {
  // Use provided trade price or calculate new one
  const price = tradePrice || (await calculateStockPrice(context, subreddit));
  const total = price * amount;

  // Get the portfolio
  const portfolioData = await context.redis.get(`portfolio_${user}`);
  let portfolio: Record<string, number> = portfolioData
    ? JSON.parse(portfolioData)
    : {};

  // Update portfolio
  portfolio[subreddit] = (portfolio[subreddit] || 0) + amount;
  await context.redis.set(`portfolio_${user}`, JSON.stringify(portfolio));

  // Record the trade
  const trade: Trade = {
    user,
    subreddit,
    amount,
    price,
    total,
    type: "buy",
    timestamp: new Date().toISOString(),
  };

  // Store trade in history
  const tradeHistory = await getTradeHistory(context, user);
  tradeHistory.push(trade);
  await context.redis.set(`trades_${user}`, JSON.stringify(tradeHistory));

  return { price, amount, total, trade };
}

export async function sellStock(
  context: any,
  user: string,
  subreddit: string,
  amount: number,
  tradePrice?: number
) {
  const portfolioData = await context.redis.get(`portfolio_${user}`);
  let portfolio: Record<string, number> = portfolioData
    ? JSON.parse(portfolioData)
    : {};

  if (!portfolio[subreddit] || portfolio[subreddit] < amount) {
    throw new Error("Not enough shares to sell!");
  }

  // Use provided trade price or calculate new one
  const price = tradePrice || (await calculateStockPrice(context, subreddit));
  const total = price * amount;

  // Update portfolio
  portfolio[subreddit] -= amount;
  if (portfolio[subreddit] === 0) {
    delete portfolio[subreddit]; // Remove subreddit if no shares left
  }
  await context.redis.set(`portfolio_${user}`, JSON.stringify(portfolio));

  // Record the trade
  const trade: Trade = {
    user,
    subreddit,
    amount,
    price,
    total,
    type: "sell",
    timestamp: new Date().toISOString(),
  };

  // Store trade in history
  const tradeHistory = await getTradeHistory(context, user);
  tradeHistory.push(trade);
  await context.redis.set(`trades_${user}`, JSON.stringify(tradeHistory));

  return { price, amount, total, trade };
}

export async function getTradeHistory(
  context: any,
  user: string
): Promise<Trade[]> {
  const tradesData = await context.redis.get(`trades_${user}`);
  return tradesData ? JSON.parse(tradesData) : [];
}
