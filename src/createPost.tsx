import { Devvit } from "@devvit/public-api";

// Initialize trading data using a trigger
Devvit.addTrigger({
  event: "AppInstall",
  async handler(event, context) {
    const { redis } = context;
    await redis.set(
      "tradingData",
      JSON.stringify({
        prices: {},
        trades: [],
        lastUpdate: Date.now(),
      })
    );
  },
});

// Add scheduler job to update trading data periodically
Devvit.addSchedulerJob({
  name: "updateTradingData",
  schedule: "*/5 * * * *", // Run every 5 minutes
  async handler(event, context) {
    const { redis } = context;
    const tradingData = await redis.get("tradingData");
    if (tradingData) {
      const data = JSON.parse(tradingData);
      // Update prices and other data
      data.lastUpdate = Date.now();
      await redis.set("tradingData", JSON.stringify(data));
    }
  },
});

// Custom post type for trading view
Devvit.addCustomPostType({
  name: "trading",
  render: (context) => {
    return (
      <vstack height="100%" width="100%" alignment="middle center">
        <text size="large">Trading View</text>
      </vstack>
    );
  },
});

// Menu item to create trading post
Devvit.addMenuItem({
  label: "TradingApp for Subreddits",
  location: "subreddit",
  onPress: async (_event, context) => {
    const { reddit, ui, redis } = context;
    const subreddit = await reddit.getCurrentSubreddit();

    const post = await reddit.submitPost({
      title: "r/KarmaStreetTrading",
      subredditName: subreddit.name,
      kind: "trading",
    });

    ui.showToast({ text: "Created post!" });
    ui.navigateTo(post);
  },
});
