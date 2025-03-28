import { updateStockPrice } from '../storage/storePrices.js';

interface AppContext {
  [key: string]: any;
}

/**
 * updateAllStocks
 * Iterates through a curated list of subreddits and updates their stock price.
 * Processes them sequentially to avoid rate-limit issues.
 */
export async function updateAllStocks(context: AppContext) {
  const log = context.log || console;
  const subreddits = [
    'penkemongo',
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

  log.info(`Starting stock update for ${subreddits.length} subreddits.`);

  // Process each subreddit
  for (const sub of subreddits) {
    try {
      log.info(`Updating stock price for: ${sub}`);
      const newPrice = await updateStockPrice(context, sub);
      log.info(`Updated ${sub} to $${Number(newPrice).toFixed(2)}`);
    } catch (error) {
      log.error(`Failed to update stock price for: ${sub}`, { error });
    }
  }
  log.info("Finished updating all stocks.");
}

/**
 * scheduledUpdate
 * This function runs once when scheduled by Devvit. We start an interval that
 * calls updateAllStocks every 10 seconds. If Devvit re-instantiates the job often,
 * ensure we only call setInterval once per process lifetime.
 */
let intervalStarted = false;
export async function scheduledUpdate(event: any, context: AppContext) {
  const log = context.log || console;
  if (!intervalStarted) {
    intervalStarted = true;
    log.info("Starting interval to update stocks every 10 seconds.");

    setInterval(async () => {
      await updateAllStocks(context);
    }, 5000);
  } else {
    log.info("Interval already started; skipping.");
  }
}
