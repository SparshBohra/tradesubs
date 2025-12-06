import { Devvit } from "@devvit/public-api";
import { updateAllStocks } from "./api/scheduler.js";

// Initialize trading data using a trigger
Devvit.addTrigger({
  event: "AppInstall",
  async onEvent(event, context) {
    const { redis, scheduler } = context;
    
    // Initialize trading data
    await redis.set(
      "tradingData",
      JSON.stringify({
        prices: {},
        trades: [],
        lastUpdate: Date.now(),
      })
    );

    // Schedule the price update job to run every 5 minutes
    try {
      await scheduler.runJob({
        name: "updateMarketPrices",
        cron: "*/5 * * * *", // Every 5 minutes
      });
      console.log("Scheduled market price updates");
    } catch (error) {
      console.error("Failed to schedule job:", error);
    }
  },
});

// Add scheduler job to update all stock prices periodically
Devvit.addSchedulerJob({
  name: "updateMarketPrices",
  onRun: async (event, context) => {
    console.log("Running scheduled market price update...");
    
    try {
      await updateAllStocks(context);
      
      // Update the lastUpdate timestamp
      const tradingData = await context.redis.get("tradingData");
      if (tradingData) {
        const data = JSON.parse(tradingData);
        data.lastUpdate = Date.now();
        await context.redis.set("tradingData", JSON.stringify(data));
      }
      
      console.log("Market prices updated successfully");
    } catch (error) {
      console.error("Failed to update market prices:", error);
    }
  },
});

// Custom post type for trading view (fallback)
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
  label: "🏛️ Create Karma Street Trading Post",
  location: "subreddit",
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();

    const post = await reddit.submitPost({
      title: "🏛️ Karma Street - Trade Subreddits Like Stocks!",
      subredditName: subreddit.name,
      preview: (
        <vstack padding="medium" alignment="middle center">
          <text size="xlarge" weight="bold">🏛️ Karma Street</text>
          <spacer size="small" />
          <text>Loading the Reddit Stock Exchange...</text>
        </vstack>
      ),
    });

    ui.showToast({ text: "Created Karma Street trading post!" });
    ui.navigateTo(post);
  },
});
