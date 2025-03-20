export interface Trade {
    user: string;
    subreddit: string;
    amount: number;
    type: 'buy' | 'sell' | 'short';
    timestamp: string;
  }
  