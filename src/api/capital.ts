import { Context } from "@devvit/public-api";

export async function saveUserCapital(context: Context, username: string, capital: number) {
  if (capital < 0) {
    throw new Error("Capital cannot be negative");
  }
  await context.redis.set(`${username}:capital`, capital.toString());
}

export async function getUserCapital(context: Context, username: string): Promise<number | null> {
  const capital = await context.redis.get(`${username}:capital`);
  return capital ? Number(capital) : null;
}

export async function validateAndUpdateCapital(
  context: Context, 
  username: string, 
  amount: number, 
  tradeType: 'buy' | 'sell'
): Promise<number> {
  const currentCapital = await getUserCapital(context, username) ?? 10000;
  
  if (tradeType === 'buy') {
    if (currentCapital < amount) {
      throw new Error(`Insufficient funds. Required: $${amount}, Available: $${currentCapital}`);
    }
    const newCapital = currentCapital - amount;
    await saveUserCapital(context, username, newCapital);
    return newCapital;
  } else {
    const newCapital = currentCapital + amount;
    await saveUserCapital(context, username, newCapital);
    return newCapital;
  }
}