# How to Run Karma Street

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Devvit CLI** installed globally
3. **Reddit Account** with developer access

## Install Devvit CLI

```bash
npm install -g devvit
```

## Login to Reddit

```bash
devvit login
```

This will open a browser window for Reddit OAuth authentication.

## Running Locally (Development)

### 1. Navigate to the project

```bash
cd karma-street
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
devvit playtest <your-subreddit-name>
```

Replace `<your-subreddit-name>` with a subreddit you moderate (e.g., `devvit_testing`).

This command:
- Builds your app
- Uploads it to your test subreddit
- Opens a browser with live reload

### 4. Create a test post

Once playtest is running:
1. Go to your test subreddit
2. Create a new post
3. Select "r/KarmaStreetTrading" from the post types
4. Click "Launch Trading App" to open the WebView

## Deploying to Production

### 1. Update version in devvit.yaml

```yaml
name: karma-street
version: 0.0.3
```

### 2. Upload to Reddit

```bash
devvit upload
```

### 3. Install on a subreddit

```bash
devvit install <subreddit-name>
```

## Common Commands

| Command | Description |
|---------|-------------|
| `devvit playtest <sub>` | Run app locally with hot reload |
| `devvit upload` | Upload app to Reddit |
| `devvit install <sub>` | Install app on a subreddit |
| `devvit logs <sub>` | View app logs |
| `devvit uninstall <sub>` | Remove app from subreddit |

## Troubleshooting

### "App not found" error
- Make sure you're logged in: `devvit login`
- Check your devvit.yaml has correct name

### WebView not loading
- Check browser console for errors
- Ensure all webroot files are present
- Verify script.js has no syntax errors

### Redis errors
- Redis is automatically available in Devvit
- No configuration needed
- Check logs with `devvit logs <sub>`

### Price data not updating
- Ensure Reddit API permissions in devvit.yaml
- Check if subreddit exists and is public
- View logs for API errors

## Project Structure

```
karma-street/
├── devvit.yaml          # App configuration
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── src/
│   ├── main.tsx         # Entry point & WebView handler
│   ├── createPost.tsx   # Post type definition
│   ├── message.ts       # Message types
│   ├── api/             # Backend logic
│   ├── models/          # Data types
│   ├── services/        # Business logic
│   ├── storage/         # Redis operations
│   └── utils/           # Helpers
└── webroot/             # Frontend files
    ├── page.html        # Home page
    ├── market.html      # Market view
    ├── trading.html     # Trading view
    ├── portfolio.html   # Portfolio view
    ├── settings.html    # Settings
    ├── styles.css       # Styles
    ├── script.js        # Frontend logic
    └── chart.js         # Chart component
```

## Development Tips

1. **Use `devvit logs`** to debug backend issues
2. **Check browser console** for frontend errors
3. **Test on mobile** - Devvit apps run in Reddit mobile too
4. **Keep WebView files small** - They're loaded in an iframe

## Need Help?

- [Devvit Documentation](https://developers.reddit.com/docs/)
- [Devvit Discord](https://discord.gg/devvit)
- [Reddit Developer Portal](https://developers.reddit.com)

