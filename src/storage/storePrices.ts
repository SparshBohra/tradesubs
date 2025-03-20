import { calculateStockPrice } from '../api/calculateStock';

export async function updateStockPrice(context: any, subreddit: string) {
  const prevPrice = await context.redis.get(`price_${subreddit}`) || 100;
  const newPrice = await calculateStockPrice(context, subreddit, prevPrice);
  await context.redis.set(`price_${subreddit}`, newPrice.toString());
  return newPrice;
}
