export interface Trade {
    user: string;
    subreddit: string;
    amount: number;
    price: number;
    total: number;
    type: 'buy' | 'sell' | 'short';
    timestamp: string;
}
  