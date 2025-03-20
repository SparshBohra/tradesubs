import { updateStockPrice } from '../storage/storePrices';

// Accept context as parameter so that context.redis is available.
export async function updateAllStocks(context: any) {
  const subreddits = [
    'wallstreetbets', 'cryptocurrency', 'technology', 'investing',
    'worldnews', 'ycombinator', 'trumptweets', 'UkraineRussiaReport',
    'nbadiscussion', 'nfl_draft', 'sportsbook', 'formuladank',
    'artificialintelligence', 'openai', 'claudeai', 'singularity',
    'Ethereum', 'Bitcoin', 'satoshinakamoto', 'cryptocurrency',
    'climatechange', 'mapporn', 'homeworkhelp', 'sciencememes',
    'pokemongo', 'gtaonline', 'eldenring', 'clashofclans',
    'subredditdrama', 'tiktokcringe', 'onlyfans', 'ufos'
  ];
  for (const sub of subreddits) {
    await updateStockPrice(context, sub);
  }
}

// This function can be used as a scheduled job handler.
export async function scheduledUpdate(event: any, context: any) {
  await updateAllStocks(context);
  console.log("Scheduled update complete.");
}
