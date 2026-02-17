# Bybit CLI Skills for AI Agents

This document describes how AI agents can use the `bb` command-line tool to interact with Bybit exchange.

## Overview

The `bb` CLI provides programmatic access to Bybit trading across linear perpetuals, spot, inverse, and options markets. Use this tool when users want to:

- Check cryptocurrency prices, market data, or order books
- View trading positions, balances, or open orders
- Place limit, market, stop-loss, or take-profit orders
- Cancel or amend orders, adjust leverage
- Monitor funding rates

## Prerequisites

- The `bb` command must be installed and available in PATH (`npm install -g bybit-cli`)
- For trading commands: an account must be configured via `bb account add`
- For testnet: add `--testnet` flag to any command
- API keys are created at [bybit.com](https://www.bybit.com/) or [testnet.bybit.com](https://testnet.bybit.com/)

## Command Reference

### Global Options

All commands support these options:

| Option | Description |
|--------|-------------|
| `--json` | Output structured JSON (recommended for parsing) |
| `--testnet` | Use Bybit testnet |
| `--account <id>` | Use a specific account |
| `--category <type>` | Category: `linear` (default), `spot`, `inverse`, `option` |

### Account Commands (Authentication Required)

#### `bb account balances`

Get wallet balances.

```bash
bb account balances --json
```

**Output (JSON):**
```json
[
  {
    "coin": "USDT",
    "equity": "10000.00",
    "available": "8500.00",
    "unrealisedPnl": "150.00"
  }
]
```

#### `bb account positions`

Get open positions.

```bash
bb account positions --json
```

**Output (JSON):**
```json
[
  {
    "symbol": "BTCUSDT",
    "side": "Buy",
    "size": "0.001",
    "entryPrice": "85000.0",
    "markPrice": "86000.0",
    "unrealisedPnl": "1.00",
    "leverage": "10"
  }
]
```

#### `bb account orders`

Get open orders.

```bash
bb account orders --json
```

**Output (JSON):**
```json
[
  {
    "orderId": "1234567890",
    "symbol": "BTCUSDT",
    "side": "Buy",
    "orderType": "Limit",
    "price": "85000.0",
    "qty": "0.001",
    "orderStatus": "New",
    "createdTime": "1708200000000"
  }
]
```

#### `bb account portfolio`

Get combined balances and positions.

```bash
bb account portfolio --json
```

### Markets Commands (No Authentication Required)

#### `bb markets ls`

List all available instruments.

```bash
bb markets ls --json
bb markets ls --category spot --json
```

**Output (JSON):**
```json
[
  {
    "symbol": "BTCUSDT",
    "baseCoin": "BTC",
    "quoteCoin": "USDT",
    "status": "Trading",
    "maxLeverage": "100"
  }
]
```

#### `bb markets prices`

Get prices for all tickers.

```bash
bb markets prices --json
```

**Output (JSON):**
```json
[
  {
    "symbol": "BTCUSDT",
    "lastPrice": "86000.00",
    "change24h": "2.5%",
    "volume24h": "1234567890"
  }
]
```

#### `bb markets tickers <symbol>`

Get detailed ticker for a specific symbol.

```bash
bb markets tickers BTC --json
```

**Output (JSON):**
```json
{
  "symbol": "BTCUSDT",
  "lastPrice": "86000.00",
  "highPrice24h": "87000.00",
  "lowPrice24h": "84000.00",
  "price24hPcnt": "0.025",
  "volume24h": "1234567890",
  "bid1Price": "85999.00",
  "ask1Price": "86001.00"
}
```

### Asset Commands (No Authentication Required)

#### `bb asset price <coin>`

Get price of a specific asset.

```bash
bb asset price BTC --json
```

**Output (JSON):**
```json
{
  "symbol": "BTCUSDT",
  "lastPrice": "86000.00",
  "indexPrice": "85990.00",
  "markPrice": "86005.00",
  "change24h": "2.5%"
}
```

#### `bb asset book <coin>`

Get order book.

```bash
bb asset book BTC --json
bb asset book BTC --limit 10 --json
```

**Output (JSON):**
```json
{
  "bids": [
    {"price": "85999.00", "size": "1.5"},
    {"price": "85998.00", "size": "2.3"}
  ],
  "asks": [
    {"price": "86001.00", "size": "0.8"},
    {"price": "86002.00", "size": "1.2"}
  ]
}
```

#### `bb asset funding <coin>`

Get funding rate history.

```bash
bb asset funding BTC --json
```

**Output (JSON):**
```json
[
  {
    "symbol": "BTCUSDT",
    "fundingRate": "0.0001",
    "fundingRateTimestamp": "1708200000000"
  }
]
```

### Trade Commands (Authentication Required)

#### `bb trade order limit <side> <size> <coin> <price>`

Place a limit order.

```bash
bb trade order limit buy 0.001 BTC 85000 --json
bb trade order limit sell 0.1 ETH 3500 --tif IOC --json
bb trade order limit buy 1 SOL 100 --reduce-only --json
```

| Option | Values | Description |
|--------|--------|-------------|
| `--tif` | `GTC`, `IOC`, `PostOnly` | Time-in-force (default: GTC) |
| `--reduce-only` | flag | Only reduce position |

**Success Output:**
```json
{
  "orderId": "1234567890",
  "orderLinkId": ""
}
```

#### `bb trade order market <side> <size> <coin>`

Place a market order.

```bash
bb trade order market buy 0.001 BTC --json
bb trade order market sell 0.1 ETH --reduce-only --json
```

| Option | Description |
|--------|-------------|
| `--reduce-only` | Only reduce position |

#### `bb trade order stop-loss <side> <size> <coin> <price> <trigger>`

Place a stop-loss order.

```bash
bb trade order stop-loss sell 0.001 BTC 48000 49000 --json
```

#### `bb trade order take-profit <side> <size> <coin> <price> <trigger>`

Place a take-profit order.

```bash
bb trade order take-profit sell 0.001 BTC 55000 54000 --json
```

#### `bb trade cancel <orderId>`

Cancel a specific order.

```bash
bb trade cancel 1234567890 --coin BTC --json
```

#### `bb trade cancel-all`

Cancel all open orders.

```bash
bb trade cancel-all --json
bb trade cancel-all --coin BTC --json
bb trade cancel-all -y --json
```

#### `bb trade set-leverage <coin> <leverage>`

Set leverage for a symbol.

```bash
bb trade set-leverage BTC 10 --json
```

#### `bb trade amend <orderId>`

Amend an existing order (Bybit exclusive).

```bash
bb trade amend 1234567890 --coin BTC --price 86000 --json
bb trade amend 1234567890 --coin BTC --qty 0.002 --json
bb trade amend 1234567890 --coin BTC --price 86000 --qty 0.002 --json
```

At least one of `--price` or `--qty` must be specified.

## Common Workflows

### Check Market Before Trading

```bash
# 1. Get current price
bb asset price BTC --json

# 2. Check order book depth
bb asset book BTC --json

# 3. Check funding rate
bb asset funding BTC --json
```

### Open a Long Position

```bash
# 1. Set leverage
bb trade set-leverage BTC 10 --json

# 2. Place limit order
bb trade order limit buy 0.001 BTC 85000 --json

# 3. Verify order placed
bb account orders --json

# 4. Monitor position
bb account positions --json
```

### Close a Position

```bash
# Market close
bb trade order market sell 0.001 BTC --reduce-only --json

# Or limit close
bb trade order limit sell 0.001 BTC 90000 --reduce-only --json
```

### Set Stop-Loss and Take-Profit

```bash
# After opening a long position at 85000

# Stop-loss: trigger at 83000, sell at 82500
bb trade order stop-loss sell 0.001 BTC 82500 83000 --json

# Take-profit: trigger at 90000, sell at 90500
bb trade order take-profit sell 0.001 BTC 90500 90000 --json
```

### Amend an Order

```bash
# Get current orders
bb account orders --json

# Amend the price
bb trade amend 1234567890 --coin BTC --price 86000 --json
```

### Cancel All Orders for a Coin

```bash
bb trade cancel-all --coin BTC -y --json
```

### Full Portfolio Check

```bash
bb account portfolio --json
```

### Scripting: Monitor and Act

```bash
#!/bin/bash
# Check BTC price and place order if below threshold
PRICE=$(bb asset price BTC --json | jq -r '.lastPrice')
THRESHOLD=80000

if (( $(echo "$PRICE < $THRESHOLD" | bc -l) )); then
  echo "BTC at $PRICE, placing buy order"
  bb trade order limit buy 0.001 BTC "$PRICE" --json
fi
```

## Error Handling

Commands exit with code 1 on error and print to stderr:

```bash
bb trade order limit buy 0.001 BTC 85000 --json 2>/dev/null
# Check exit code: $?
```

Common errors:
- No account configured: run `bb account add` first
- Invalid API credentials: check key and secret
- Insufficient margin: reduce size or add funds
- Invalid symbol: use `bb markets ls --json` to get valid symbols
- Rate limiting: retry after a short delay

## Tips for AI Agents

1. **Always use `--json`** for reliable, parseable output
2. **Check prices first** before placing orders to validate parameters
3. **Use `jq`** to filter and extract specific fields from JSON output
4. **Validate symbols** using `bb markets ls --json` to get valid trading pairs
5. **For testnet testing**, always add `--testnet` flag
6. **Handle errors gracefully** by checking exit codes and stderr
7. **Category matters**: use `--category spot` for spot trading, default is `linear` (perpetuals)
8. **Coin vs symbol**: most commands accept just the coin name (e.g. `BTC`), the CLI auto-appends `USDT` for linear/inverse categories
9. **Amend orders** instead of cancel+replace for better execution (Bybit exclusive)
10. **Check leverage** before placing orders: `bb trade set-leverage <coin> <leverage> --json`
