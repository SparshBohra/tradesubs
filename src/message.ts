export interface SubredditStock {
  price: number;
  newPosts: number;
  comments: number;
  karma: number;
  engagement: number;
  volatility: number;
}

export interface WebViewMessage {
  type: "webViewReady" | "buyStock" | "sellStock" | "requestPriceUpdate";
  data?: {
    subreddit?: string;
    amount?: number;
  };
}

export interface DevvitMessage {
  type: "initialData" | "updatePortfolio" | "tradeError" | "priceUpdate";
  data: {
    username?: string;
    portfolio?: Record<string, number>;
    message?: string;
    stockData?: {
      price: number;
      previousPrice?: number;
      newPosts: number;
      comments: number;
      karma: number;
      engagement: number;
      volatility: number;
      timestamp: number;
    };
  };
}
