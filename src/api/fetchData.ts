/**
 * fetchData.ts
 *
 * Fetches real-time subreddit data using the provided context's reddit API,
 * counting only the new posts that weren't processed in the previous fetch.
 *
 * Assumes each post has a 'createdAt' property representing its creation time (as a Unix timestamp in seconds).
 */

 export async function fetchSubredditData(context: any, subreddit: string) {
    // Define a key to store the last processed timestamp for this subreddit
    const lastTimestampKey = `lastTimestamp_${subreddit}`;
    
    // Retrieve the last processed timestamp from the KV store; default to 0 if not set.
    let lastTimestamp = parseInt(await context.redis.get(lastTimestampKey) || "0");
  
    // Fetch the latest 50 posts from the subreddit, sorted by "new"
    const posts = await context.reddit.listing({
      subreddit,
      sort: "new",
      limit: 50
    });
  
    // Filter posts that are truly new (i.e. created after lastTimestamp)
    const newPosts = posts.filter((post: any) => {
      // Ensure post.createdAt is available; adjust if using milliseconds instead of seconds.
      return post.createdAt > lastTimestamp;
    });
  
    // If there are new posts, update the stored lastTimestamp to the newest post's createdAt value.
    if (newPosts.length > 0) {
      // posts are assumed to be sorted descending (newest first), so newPosts[0] is the newest.
      lastTimestamp = newPosts[0].createdAt;
      await context.redis.set(lastTimestampKey, lastTimestamp.toString());
    }
  
    // For simplicity, fetch comments from the newest post if available.
    let comments = [];
    if (posts.length > 0) {
      comments = await context.reddit.comments({
        subreddit,
        postId: posts[0].id
      });
    }
  
    // Fetch detailed subreddit info by name.
    const subredditInfo = await context.reddit.getSubredditByName({ name: subreddit });
  
    return {
      // Count only the new posts rather than the full listing
      newPosts: newPosts.length,
      comments: comments.length,
      karma: subredditInfo.karma,
      // Engagement is calculated based on new posts count + comments
      engagement: subredditInfo.karma / (newPosts.length + comments.length + 1),
      // Volatility is a simple function of karma and new posts count
      volatility: Math.abs(subredditInfo.karma - newPosts.length * 10)
    };
  }
  