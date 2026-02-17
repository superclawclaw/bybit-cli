// Background server daemon for caching market data via WebSocket.
// Launched by `bb server start` as a detached process.
// Env vars: BB_DATA_DIR, BB_TESTNET

const dataDir = process.env.BB_DATA_DIR ?? '';
const testnet = process.env.BB_TESTNET === '1';

function handleShutdown() {
  process.exit(0);
}

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// Keep the process alive
const keepAlive = setInterval(() => {
  // Future: check WS health, refresh subscriptions
}, 30_000);

// Cleanup on exit
process.on('exit', () => {
  clearInterval(keepAlive);
});
