import { Trade } from '../models/trade';

export async function logTrade(context: any, user: string, trade: Trade) {
  const tradesData = await context.redis.get(`trades_${user}`);
  let trades: Trade[] = tradesData ? JSON.parse(tradesData) : [];
  trades.push(trade);
  await context.redis.set(`trades_${user}`, JSON.stringify(trades));
}
