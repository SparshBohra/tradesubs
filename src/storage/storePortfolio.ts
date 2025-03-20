export async function saveUserPortfolio(context: any, user: string, portfolio: Record<string, number>) {
    await context.redis.set(`portfolio_${user}`, JSON.stringify(portfolio));
  }
  
  export async function getUserPortfolio(context: any, user: string): Promise<Record<string, number>> {
    const data = await context.redis.get(`portfolio_${user}`);
    return data ? JSON.parse(data) : {};
  }
  