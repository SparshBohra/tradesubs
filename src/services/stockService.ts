import { updateStockPrice } from '../storage/storePrices.js';

export async function updateStockForSubreddit(context: any, subreddit: string) {
  return await updateStockPrice(context, subreddit);
}

export async function updateAllStocksService(context: any, subreddits: string[]) {
  const results: Record<string, number> = {};
  for (const sub of subreddits) {
    results[sub] = await updateStockPrice(context, sub);
  }
  return results;
}
