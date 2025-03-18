import { Devvit } from '@devvit/public-api';
import './api/index';

Devvit.configure({
    redditAPI: true,
    redis: true,
    webview: true, 
    name: 'Karma Street',
    shortName: 'karma-street',
    permissions: ['read', 'write']
} as any);

// Log initialization
console.log("Initializing Karma Street application!");

Devvit.addMenuItem({
  label: 'Hello World',
  location: 'post',
  onPress: async (event, context) => {
    console.log("🚀 Menu Item Clicked! Target ID:", event.targetId);
    
    try {
      // Try accessing Reddit API to verify it's working
      const post = await context.reddit.getPostById(event.targetId);
      console.log("Post data retrieved successfully:", post.id);
      
      context.ui.showToast('Hello from Karma Street!');
      await context.kvStore.put('debug-log', 'Menu item was clicked');
    } catch (error) {
      console.error("Error in menu handler:", error);
      context.ui.showToast('Error: ' + (error || 'Unknown error'));
    }
  }
});

// Export the Devvit instance
export default Devvit;