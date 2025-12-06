import { updateStockPrice } from '../storage/storePrices.js';

// List of all tracked subreddits
const TRACKED_SUBREDDITS = [
  'wallstreetbets',
  'cryptocurrency',
  'technology',
  'programming',
  'bitcoin',
  'ethereum',
  'investing',
  'personalfinance',
  'memes',
  'dankmemes'
];

interface AppContext {
  redis: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<unknown>;
  };
  reddit: any;
  log?: {
    error: (message: string, metadata?: Record<string, any>) => void;
    warn: (message: string, metadata?: Record<string, any>) => void;
    info: (message: string, metadata?: Record<string, any>) => void;
    debug: (message: string, metadata?: Record<string, any>) => void;
  };
}

/**
 * updateAllStocks
 * Iterates through all tracked subreddits and updates their stock prices.
 * Called by the Devvit scheduler job.
 */
export async function updateAllStocks(context: AppContext) {
  const log = context.log || console;
  
  log.info(`Starting scheduled stock update for ${TRACKED_SUBREDDITS.length} subreddits.`);
  
  const results = {
    success: 0,
    failed: 0,
    prices: {} as Record<string, number>
  };

  // Process each subreddit sequentially to avoid rate limits
  for (const subreddit of TRACKED_SUBREDDITS) {
    try {
      log.info(`Updating stock price for: ${subreddit}`);
      const newPrice = await updateStockPrice(context, subreddit);
      results.prices[subreddit] = newPrice;
      results.success++;
      log.info(`Updated ${subreddit} to $${Number(newPrice).toFixed(2)}`);
    } catch (error) {
      results.failed++;
      log.error(`Failed to update stock price for: ${subreddit}`, { error });
    }
  }

  // Store the market snapshot for quick access
  try {
    await context.redis.set('market_snapshot', JSON.stringify({
      prices: results.prices,
      timestamp: Date.now(),
      updated: results.success,
      failed: results.failed
    }));
    log.info(`Market snapshot saved: ${results.success} updated, ${results.failed} failed`);
  } catch (error) {
    log.error('Failed to save market snapshot', { error });
  }

  log.info(`Finished updating stocks: ${results.success} success, ${results.failed} failed`);
  
  return results;
}

/**
 * getMarketSnapshot
 * Returns the latest cached market snapshot
 */
export async function getMarketSnapshot(context: AppContext) {
  try {
    const snapshot = await context.redis.get('market_snapshot');
    if (snapshot) {
      return JSON.parse(snapshot);
    }
  } catch (error) {
    console.error('Failed to get market snapshot:', error);
  }
  return null;
}

/**
 * Get list of tracked subreddits
 */
export function getTrackedSubreddits() {
  return TRACKED_SUBREDDITS;
}
