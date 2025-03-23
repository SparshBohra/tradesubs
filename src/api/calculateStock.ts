import { fetchSubredditData } from "./fetchData.js";

const baseMomentum = 0.1;
const baseSpeculation = 0.2;
const decayFactor = 0.02;
const bearishCorrection = 0.03;

export async function calculateStockPrice(
  context: any,
  subreddit: string,
  prevPrice: number = 100
) {
  const data = await fetchSubredditData(context, subreddit);

  const basePrice =
    0.4 * data.newPosts +
    0.3 * data.comments +
    0.2 * data.karma +
    0.05 * data.engagement +
    0.05 * data.volatility;

  const activityChange = data.newPosts + data.comments - prevPrice / 10;
  const momentum = baseMomentum * (activityChange / (prevPrice + 1));

  const priceSwing = Math.abs(prevPrice - basePrice);
  const speculation = baseSpeculation * (priceSwing / (prevPrice + 1));

  const decay = decayFactor * (prevPrice - basePrice);

  let newPrice = basePrice + momentum + speculation - decay;

  if (newPrice > prevPrice * 1.5) {
    newPrice -= bearishCorrection * newPrice;
  }

  return Math.max(newPrice, 1);
}
