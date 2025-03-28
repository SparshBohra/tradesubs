/**
 * fetchData.ts
 * Fetches real-time subreddit data, using correct property names.
 */
 import { RedditAPIClient, Post, Comment, Subreddit } from '@devvit/public-api';

 interface AppContext {
     redis: {
         get: (key: string) => Promise<string | null>;
         set: (key: string, value: string) => Promise<unknown>;
     };
     reddit: RedditAPIClient;
     log?: {
       error: (message: string, metadata?: Record<string, any>) => void;
       warn: (message: string, metadata?: Record<string, any>) => void;
       info: (message: string, metadata?: Record<string, any>) => void;
       debug: (message: string, metadata?: Record<string, any>) => void;
     };
 }
 
 export async function fetchSubredditData(context: AppContext, subreddit: string) {
   const log = context.log || console;
   const debugLog = context.log?.debug || log.info;
 
   const lastTimestampKey = `lastTimestamp_${subreddit}`;
   let lastTimestampSeconds = 0;
   let fetchedPosts: Post[] = [];
   let fetchedComments: Comment[] = [];
   let subredditInfo: Subreddit | null = null;
   // *** FIX: Use the correct property name from the start ***
   let numberOfSubscribers = 0;
 
   try {
     // --- Get Last Timestamp ---
     // ... (keep existing logic) ...
     try {
         const storedTimestamp = await context.redis.get(lastTimestampKey);
         lastTimestampSeconds = parseInt(storedTimestamp || "0", 10);
         if (isNaN(lastTimestampSeconds)) { lastTimestampSeconds = 0; /* log warning */ }
         debugLog(`[${subreddit}] Retrieved lastTimestampSeconds: ${lastTimestampSeconds}`);
     } catch (redisError) { /* handle error */ }
 
     // --- Fetch Posts ---
     // ... (keep existing logic using createdAt) ...
     try {
       // ... fetch posts using getNewPosts ...
       // ... handle async iterable ...
       // ... use post.createdAt.getTime() for filtering ...
       debugLog(`[${subreddit}] Fetched ${fetchedPosts.length} raw posts.`);
     } catch (error) { /* handle error */ }
 
     // --- Filter New Posts (Using 'createdAt') ---
      const lastTimestampMillis = lastTimestampSeconds * 1000;
      // ... (debug logging) ...
      const newPosts = fetchedPosts.filter((post) => {
          const postTimeMillis = post?.createdAt?.getTime();
          return typeof postTimeMillis === 'number' && !isNaN(postTimeMillis) && postTimeMillis > lastTimestampMillis;
      });
      log.info(`[${subreddit}] Found ${newPosts.length} new posts.`);
 
 
     // --- Update Timestamp ---
     // ... (keep existing logic using createdAt) ...
     if (newPosts.length > 0) {
       // ... get newLastTimestampMillis using createdAt ...
       // ... update Redis ...
     }
 
     // --- Fetch Comments ---
     // ... (keep existing logic) ...
     const newestPostOverall = fetchedPosts.length > 0 ? fetchedPosts[0] : null;
     if (newestPostOverall?.id) {
       try {
         // ... fetch comments using getComments ...
         // ... handle async iterable ...
         debugLog(`[${subreddit}] Fetched ${fetchedComments.length} comments for post ${newestPostOverall.id}.`);
       } catch (error) { /* handle error */ }
     }
 
     // --- Fetch Subreddit Info (Using 'numberOfSubscribers') ---
     try {
         subredditInfo = await context.reddit.getSubredditByName(subreddit);
 
         // *** FIX: Access and Validate using numberOfSubscribers ***
         const fetchedSubsValue = subredditInfo?.numberOfSubscribers; // Access the correct property
 
         if (typeof fetchedSubsValue === 'number' && fetchedSubsValue >= 0) {
             numberOfSubscribers = fetchedSubsValue; // Assign the valid number
             log.info(`[${subreddit}] Successfully validated subreddit info with ${numberOfSubscribers} subscribers.`);
         } else {
             log.warn(`[${subreddit}] Subreddit info validation failed. 'numberOfSubscribers' invalid or missing.`, {
                 fetchedValue: fetchedSubsValue, // Log the value we actually got
                 // subredditInfo // Avoid logging the whole object unless necessary
             });
             subredditInfo = null;
             numberOfSubscribers = 0; // Ensure default
         }
     } catch (error: any) {
          if (error?.message?.includes('404 Not Found')) { log.warn(`[${subreddit}] Subreddit not found when fetching info (404).`); }
          else { log.error(`[${subreddit}] Failed to fetch subreddit info`, { error }); }
          subredditInfo = null;
          numberOfSubscribers = 0; // Ensure default
     }
 
     // --- Calculate Derived Metrics ---
     // *** FIX: Use the correctly named variable numberOfSubscribers ***
     const karmaEstimate = numberOfSubscribers / 1000 + (newPosts.length * 5) + (fetchedComments.length * 1);
     const newPostsCount = newPosts.length;
     const commentsCount = fetchedComments.length;
     const activitySum = newPostsCount + commentsCount;
     const engagement = activitySum > 0 ? (karmaEstimate / activitySum) : 0;
     const volatility = Math.abs(karmaEstimate - newPostsCount * 10);
 
     log.info(`[${subreddit}] Returning data:`, {
         newPosts: newPostsCount,
         comments: commentsCount,
         karmaEstimate: Math.round(karmaEstimate),
         // *** FIX: Use the correctly named variable numberOfSubscribers ***
         subscribers: numberOfSubscribers,
         engagement: engagement,
         volatility: volatility
     });
 
     return {
       newPosts: newPostsCount,
       comments: commentsCount,
       karma: Math.round(karmaEstimate),
       // *** FIX: Use the correctly named variable numberOfSubscribers ***
       subscribers: numberOfSubscribers,
       engagement: isNaN(engagement) ? 0 : engagement,
       volatility: isNaN(volatility) ? 0 : volatility
     };
 
   } catch (globalError) {
       log.error(`[${subreddit}] Unhandled error in fetchSubredditData`, { error: globalError });
       return { /* Return default zero values */ };
   }
 }