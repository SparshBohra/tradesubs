// Listen for messages from Devvit
window.addEventListener('message', (event) => {
    // Check if message is from Devvit
    if (event.data.type === 'devvit-message') {
        const { message } = event.data;
        console.log('Received from Devvit:', message);
        
        // Handle different message types
        if (message.type === 'initialData') {
            document.getElementById('username').textContent = message.data.username;
            document.getElementById('counter').textContent = message.data.currentCounter;
            document.getElementById('message').textContent = 'Connected to Karma Street!';
        } else if (message.type === 'updateCounter') {
            document.getElementById('counter').textContent = message.data.currentCounter;
        }
    }
});

// Tell Devvit the web view is ready
window.addEventListener('load', () => {
    console.log('Karma Street webview loaded - sending ready signal');
    window.parent.postMessage({ type: 'webViewReady' }, '*');
});

// Send a message to Devvit when buttons are clicked
document.getElementById('sendMessage').addEventListener('click', () => {
    window.parent.postMessage(
        { 
            type: 'setCounter', 
            data: { newCounter: Math.floor(Math.random() * 100) } 
        },
        '*'
    );
});

// Additional functionality for view trades button
document.getElementById('viewTrades').addEventListener('click', () => {
    document.getElementById('portfolio-data').textContent = 'Loading trade history...';
    
    // Request trade data from Devvit
    window.parent.postMessage(
        { type: 'requestTrades' },
        '*'
    );
});