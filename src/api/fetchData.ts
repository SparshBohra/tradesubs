interface SubredditData {
    posts: number;
    comments: number;
    subscribers: number;
    volatility: number;
}

interface SimulatedDataType {
    [key: string]: SubredditData;
}

export async function fetchSubredditData(context: any, subreddit: string) {
    const simulatedData: SimulatedDataType = {
        'wallstreetbets': { posts: 25, comments: 1200, subscribers: 15000, volatility: 0.8 },
        'cryptocurrency': { posts: 18, comments: 800, subscribers: 12000, volatility: 0.7 },
        'technology': { posts: 15, comments: 400, subscribers: 8000, volatility: 0.4 },
        'programming': { posts: 12, comments: 300, subscribers: 9000, volatility: 0.3 },
        'bitcoin': { posts: 20, comments: 900, subscribers: 11000, volatility: 0.9 },
        'ethereum': { posts: 16, comments: 700, subscribers: 10000, volatility: 0.8 },
        'investing': { posts: 10, comments: 200, subscribers: 7000, volatility: 0.5 },
        'personalfinance': { posts: 8, comments: 150, subscribers: 6000, volatility: 0.2 },
        'memes': { posts: 30, comments: 1500, subscribers: 20000, volatility: 0.6 },
        'dankmemes': { posts: 28, comments: 1300, subscribers: 18000, volatility: 0.7 },
        'penkemongo': { posts: 5, comments: 100, subscribers: 5000, volatility: 0.4 }
    };

    // Get data for the requested subreddit or use default values
    const data = simulatedData[subreddit.toLowerCase()] || { posts: 5, comments: 100, subscribers: 5000, volatility: 0.5 };

    // Add some random fluctuation with bounds
    const randomFactor = Math.max(0.5, Math.min(1.5, 1 + (Math.random() - 0.5) * data.volatility));

    // Calculate base metrics
    const newPosts = Math.max(1, Math.floor(data.posts * randomFactor));
    const comments = Math.max(1, Math.floor(data.comments * randomFactor));
    const karma = Math.max(100, Math.floor(data.subscribers * randomFactor));
    
    // Calculate derived metrics
    const engagement = Math.max(0.01, comments / (newPosts + 1));
    const volatility = Math.max(1, data.volatility * 100);
    
    // Calculate price with minimum value
    const basePrice = (karma / 100) * (1 + engagement);
    const price = Math.max(1, Math.floor(basePrice * 100) / 100);

    return {
        newPosts,
        comments,
        karma,
        engagement,
        volatility,
        price
    };
}
