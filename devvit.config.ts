import { Devvit } from '@devvit/public-api';

// @ts-ignore - Suppress TypeScript errors for the configuration
export default Devvit.configure({
  redditAPI: true,
  redis: true, 
  webview: true, 
  name: 'Karma Street',
  shortName: 'karma-street',
  permissions: ['read', 'write']
} as any);
