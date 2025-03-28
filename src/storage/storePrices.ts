import { calculateStockPrice } from "../api/calculateStock.js";

// Fallback only used if Redis completely fails
const fallbackPrices: Record<string, number> = {};

export async function updateStockPrice(context: any, subreddit: string) {
  const priceKey = `price_${subreddit}`;
  const initialKey = `initialPrice_${subreddit}`;

  // Try to get the previous price from Redis
  let prevPrice: number;

  const storedPriceStr = await context.redis.get(priceKey);
  if (storedPriceStr) {
    prevPrice = parseFloat(storedPriceStr);
    console.log(`[${subreddit}] Loaded prevPrice from Redis: ${prevPrice}`);
  } else if (fallbackPrices[subreddit]) {
    prevPrice = fallbackPrices[subreddit];
    console.log(`[${subreddit}] Using fallbackPrice: ${prevPrice}`);
  } else {
    prevPrice = 100; // default
    console.log(`[${subreddit}] Using default initial price: ${prevPrice}`);
  }

  // Calculate new price
  const priceObj = await calculateStockPrice(context, subreddit, prevPrice);
  const newPrice = priceObj.price;

  console.log(`[${subreddit}] Price calculation: prev=${prevPrice}, new=${newPrice}`);

  // Save new price to Redis and fallback
  await context.redis.set(priceKey, newPrice.toString());
  const check = await context.redis.get(priceKey);
  console.log(`[${subreddit}] Confirmed saved newPrice in Redis: ${check}`);

  fallbackPrices[subreddit] = newPrice;

  console.log(`[${subreddit}] Stored newPrice in Redis: ${newPrice}`);

  // If no initial price stored, set it
  const storedInitial = await context.redis.get(initialKey);
  if (!storedInitial) {
    await context.redis.set(initialKey, newPrice.toString());
    console.log(`[${subreddit}] Set initialPrice in Redis: ${newPrice}`);
  }

  console.log(`[${subreddit}] Fetched prevPrice from Redis: ${storedPriceStr}`);
  console.log(`[${subreddit}] Saving updated price to Redis: ${newPrice}`);

  return newPrice;
}
