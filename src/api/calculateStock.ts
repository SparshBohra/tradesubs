import { fetchSubredditData } from "./fetchData.js";

// Use a scaling factor so that huge karma values are reduced to a realistic trading price.
// For example, if karma is 3679, using SCALE=100 gives an initial price of ~36.79.
const SCALE = 100;

const FACTORS = {
  momentumDamper: 0.01,      // Reduced momentum effect
  speculationLimit: 0.04,    // Cap speculative change to ±3% of prevPrice
  decayStrength: 0.01,
  priceChangeLimit: 0.03,    // Clamp maximum change per update to ±3%
  baselineStability: 0.1     // Lower baseline stability so adjustments are more modest
};

/**
 * calculateStockPrice
 * 
 * Computes a new price based on the subreddit data and the previous price.
 * If no stored price exists, the price is initialized to (karma / SCALE).
 * Changes are computed using weighted components (posts, comments, scaled karma,
 * engagement, and scaled volatility) and then damped and clamped.
 */
export async function calculateStockPrice(context: any, subreddit: string, prevPrice: number = 0) {
  const log = context.log || console;

  // Fetch data from your existing fetchData (which returns absolute totals)
  const data = await fetchSubredditData(context, subreddit);
  const newPosts = Number(data.newPosts) || 0;
  const comments = Number(data.comments) || 0;
  const karma = Number(data.karma) || 0;
  const engagement = Number(data.engagement) || 0;
  const volatility = Number(data.volatility) || 0;

  // Scale down large values for a realistic trading range
  const scaledKarma = karma / SCALE;          // e.g. 3679/100 ≈ 36.79
  const scaledVolatility = volatility / SCALE;  // similarly scaled

  // If no previous price is stored, initialize to the scaled karma (as a baseline)
  const safePrevPrice = prevPrice > 0 ? Math.max(1, prevPrice) : Math.max(1, scaledKarma);

  // Base price: use weighted components. We use the scaled values for karma and volatility.
  const basePrice = 
    0.3 * newPosts +
    0.3 * comments +
    0.2 * scaledKarma +
    0.1 * engagement +
    0.1 * scaledVolatility;

  // Calculate the difference from the previous price.
  const diff = basePrice - safePrevPrice;
  const damped = diff * FACTORS.momentumDamper;

  // Activity score (using posts, comments, and half of the scaled karma)
  const activityScore = newPosts + comments + 0.5 * scaledKarma;
  const momentum = activityScore * (safePrevPrice / 100) * FACTORS.baselineStability;

  // Proposed new price before decay/clamping
  let proposed = safePrevPrice + damped + momentum;

  // Inject decay-based drift when subreddit is idle
  if (newPosts === 0 && comments === 0 && engagement === 0) {
    const idleDrift = (Math.random() - 0.5) * (volatility / (SCALE * 50)); // ~ ±0.78 max
    proposed += idleDrift;
    log.info(`[${subreddit}] Applied idle drift: ${idleDrift.toFixed(2)}`);
  }


  // Apply decay: pull the price toward the base price
  const decay = FACTORS.decayStrength * (safePrevPrice - basePrice);
  proposed -= decay;

  // Limit the speculative change to ±(speculationLimit × safePrevPrice)
  const specCap = safePrevPrice * FACTORS.speculationLimit;
  const overflow = proposed - safePrevPrice;
  if (Math.abs(overflow) > specCap) {
    proposed = safePrevPrice + Math.sign(overflow) * specCap;
  }

  // Clamp final change to ±(priceChangeLimit × safePrevPrice)
  const maxChange = safePrevPrice * FACTORS.priceChangeLimit;
  if (proposed > safePrevPrice + maxChange) {
    proposed = safePrevPrice + maxChange;
  } else if (proposed < safePrevPrice - maxChange) {
    proposed = safePrevPrice - maxChange;
  }

  const finalPrice = Math.max(1, parseFloat(proposed.toFixed(2)));

  log.info(`[${subreddit}] Price update: prev=${safePrevPrice.toFixed(2)}, base=${basePrice.toFixed(2)}, new=${finalPrice}`, {
    newPosts,
    comments,
    karma,
    scaledKarma,
    engagement,
    volatility,
    scaledVolatility,
    diff: diff.toFixed(2),
    damped: damped.toFixed(2),
    momentum: momentum.toFixed(2),
    decay: decay.toFixed(2),
    specCap: specCap.toFixed(2),
    maxChange: maxChange.toFixed(2)
  });

  return {
    price: finalPrice,
    posts: newPosts,
    comments,
    karma,
    engagement,
    volatility
  };
}
