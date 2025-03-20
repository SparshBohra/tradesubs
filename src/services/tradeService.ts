import { buyStock, sellStock } from '../api/trading';
import { logTrade } from '../storage/storeTrades';
import { Trade } from '../models/trade';

export async function processBuy(context: any, user: string, subreddit: string, amount: number) {
  await buyStock(context, user, subreddit, amount);
  const trade: Trade = {
    user,
    subreddit,
    amount,
    type: 'buy',
    timestamp: new Date().toISOString()
  };
  await logTrade(context, user, trade);
}

export async function processSell(context: any, user: string, subreddit: string, amount: number) {
  await sellStock(context, user, subreddit, amount);
  const trade: Trade = {
    user,
    subreddit,
    amount,
    type: 'sell',
    timestamp: new Date().toISOString()
  };
  await logTrade(context, user, trade);
}
