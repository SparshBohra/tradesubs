import { fetchSubredditData } from "./fetchData.js";

/**
 * Realistic base prices for subreddits based on their typical size/activity
 * Larger, more active subs = higher base price
 */
const BASE_PRICES: Record<string, number> = {
  'wallstreetbets': 185.00,    // 14M+ members, very active
  'cryptocurrency': 142.50,    // 7M+ members
  'bitcoin': 210.00,           // 5M+ members, high value perception
  'ethereum': 165.00,          // 2M+ members
  'technology': 95.00,         // 15M+ members but less trading vibe
  'programming': 72.50,        // 5M+ members
  'investing': 88.00,          // 2M+ members
  'personalfinance': 65.00,    // 18M+ members
  'memes': 45.00,              // 22M+ but volatile/casual
  'dankmemes': 38.50,          // 7M+ members
};

const DEFAULT_BASE_PRICE = 50.00;

// Conservative factors for realistic movement
const FACTORS = {
  maxChangePercent: 0.015,      // Max ±1.5% per update
  momentumWeight: 0.002,        // Very small momentum effect
  activityWeight: 0.001,        // Activity impact on price
  decayRate: 0.005,             // Slow decay when inactive
  noiseRange: 0.003,            // Small random noise ±0.3%
};

/**
 * calculateStockPrice
 * 
 * Computes realistic stock price based on subreddit activity.
 * Prices move slowly and realistically, typically ±0.5-1.5% per update.
 */
export async function calculateStockPrice(context: any, subreddit: string, prevPrice: number = 0) {
  const log = context.log || console;

  // Fetch live data from Reddit
  const data = await fetchSubredditData(context, subreddit);
  const newPosts = Number(data.newPosts) || 0;
  const comments = Number(data.comments) || 0;
  const karma = Number(data.karma) || 0;
  const subscribers = Number(data.subscribers) || 0;
  
  // Get base price for this subreddit
  const basePrice = BASE_PRICES[subreddit.toLowerCase()] || DEFAULT_BASE_PRICE;
  
  // If no previous price, start at base price with small random offset
  let currentPrice = prevPrice;
  if (currentPrice <= 0) {
    // Start within ±5% of base price for variety
    const startOffset = (Math.random() - 0.5) * 0.1;
    currentPrice = basePrice * (1 + startOffset);
    
    log.info(`[${subreddit}] Initialized price at $${currentPrice.toFixed(2)} (base: $${basePrice})`);
  }

  // Calculate activity score (normalized 0-100)
  const activityScore = Math.min(100, 
    (newPosts * 2) + 
    (comments * 0.5) + 
    (karma / 1000)
  );

  // Determine price direction based on activity
  // High activity = slight upward pressure, low = slight downward
  const activityPressure = (activityScore - 30) * FACTORS.activityWeight;
  
  // Add small random market noise
  const noise = (Math.random() - 0.5) * 2 * FACTORS.noiseRange * currentPrice;
  
  // Calculate raw change
  let priceChange = (activityPressure * currentPrice) + noise;
  
  // Apply momentum from recent activity
  if (newPosts > 5 || comments > 20) {
    priceChange += currentPrice * FACTORS.momentumWeight;
  }
  
  // Apply decay if very inactive
  if (newPosts === 0 && comments === 0) {
    priceChange -= currentPrice * FACTORS.decayRate;
  }

  // Clamp change to max percentage
  const maxChange = currentPrice * FACTORS.maxChangePercent;
  priceChange = Math.max(-maxChange, Math.min(maxChange, priceChange));

  // Calculate new price
  let newPrice = currentPrice + priceChange;
  
  // Keep price within reasonable bounds (50% to 200% of base)
  const minPrice = basePrice * 0.5;
  const maxPrice = basePrice * 2.0;
  newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
  
  // Round to 2 decimal places
  newPrice = Math.round(newPrice * 100) / 100;

  const changePercent = ((newPrice - currentPrice) / currentPrice * 100).toFixed(2);
  
  log.info(`[${subreddit}] Price: $${currentPrice.toFixed(2)} → $${newPrice.toFixed(2)} (${changePercent}%)`, {
    activity: activityScore.toFixed(1),
    posts: newPosts,
    comments,
    karma
  });

  return {
    price: newPrice,
    posts: newPosts,
    comments,
    karma,
    engagement: data.engagement || 0,
    volatility: data.volatility || 0,
    subscribers
  };
}

/**
 * Get the base/starting price for a subreddit
 */
export function getBasePrice(subreddit: string): number {
  return BASE_PRICES[subreddit.toLowerCase()] || DEFAULT_BASE_PRICE;
}
