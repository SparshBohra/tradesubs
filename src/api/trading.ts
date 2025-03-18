// Updated to use context.redis from the Redis plugin.
export async function buyStock(context: any, user: string, subreddit: string, amount: number) {
    // Retrieve the current price (if needed)
    const price = await context.redis.get(`price_${subreddit}`) || 100;
    // Get the portfolio stored as JSON
    const portfolioData = await context.redis.get(`portfolio_${user}`);
    let portfolio: Record<string, number> = portfolioData ? JSON.parse(portfolioData) : {};

    portfolio[subreddit] = (portfolio[subreddit] || 0) + amount;
    await context.redis.set(`portfolio_${user}`, JSON.stringify(portfolio));
}

export async function sellStock(context: any, user: string, subreddit: string, amount: number) {
    const portfolioData = await context.redis.get(`portfolio_${user}`);
    let portfolio: Record<string, number> = portfolioData ? JSON.parse(portfolioData) : {};

    if (!portfolio[subreddit] || portfolio[subreddit] < amount) {
        throw new Error("Not enough shares to sell!");
    }

    portfolio[subreddit] -= amount;
    await context.redis.set(`portfolio_${user}`, JSON.stringify(portfolio));
}
