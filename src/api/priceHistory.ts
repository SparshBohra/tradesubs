import { calculateStockPrice } from "./calculateStock.js";

interface HistoricalPrice {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getHistoricalPrices(
  context: any,
  subreddit: string
): Promise<HistoricalPrice[]> {
  const now = Date.now();
  const data: HistoricalPrice[] = [];

  // Get current price as base
  const currentPrice = await calculateStockPrice(context, subreddit);

  // Generate 24 hours of historical data
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (23 - i) * 3600 * 1000;
    const volatility = 0.02; // 2% volatility

    // Generate OHLC data with some randomness but based on actual price
    const basePrice = currentPrice * (1 + (Math.random() - 0.5) * volatility);
    const open = basePrice * (0.98 + Math.random() * 0.04);
    const high = Math.max(open * (1 + Math.random() * 0.02), open);
    const low = Math.min(open * (0.98 + Math.random() * 0.02), open);
    const close = i === 23 ? currentPrice : basePrice;

    data.push({
      time: Math.floor(timestamp / 1000),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000) + 1000,
    });
  }

  return data;
}
