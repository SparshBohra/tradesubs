// Retrieve user portfolio using context.redis.
export async function getUserPortfolio(context: any, user: string) {
    const portfolioData = await context.redis.get(`portfolio_${user}`);
    return portfolioData ? JSON.parse(portfolioData) : {};
  }
  