# Bybit CLI

A command-line interface for [Bybit](https://www.bybit.com/) built with the [bybit-api](https://github.com/tiagosiebler/bybit-api) TypeScript SDK.

Features a beautiful terminal UI with real-time watch modes powered by [Ink](https://github.com/vadimdemedes/ink).

## Installation

```bash
npm install -g bybit-cli
```

Requires Node.js >= 18.

## Features

- **Multi-Account Management** -- Store and manage multiple trading accounts locally with encrypted SQLite storage
- **Encrypted Credentials** -- API secrets are encrypted at rest using AES-256-GCM
- **Real-Time Monitoring** -- WebSocket-powered live updates for positions, orders, balances, and prices
- **Beautiful Terminal UI** -- Color-coded PnL, depth visualization, and formatted tables
- **Full Trading Support** -- Limit, market, stop-loss, take-profit orders plus amend and cancel
- **Scripting Friendly** -- JSON output mode for automation with `jq` and shell scripts
- **Testnet Support** -- Seamless switching between mainnet and testnet
- **Multi-Category** -- Support for linear, spot, inverse, and option markets

## Quick Start

```bash
# 1. Add your account (interactive wizard)
bb account add

# 2. Or add directly with arguments
bb account add main YOUR_API_KEY YOUR_API_SECRET

# 3. Check your balance
bb account balances

# 4. View market prices
bb markets prices

# 5. Place a limit order (testnet)
bb --testnet trade order limit buy 0.001 BTC 85000

# 6. Check positions
bb account positions
```

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output structured JSON (for scripting) |
| `--testnet` | Use Bybit testnet |
| `--account <id>` | Use specific account (override default) |
| `--category <type>` | Category: `linear` (default), `spot`, `inverse`, `option` |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

---

## Account Management

Manage multiple trading accounts. Credentials are stored in an encrypted SQLite database at `~/.bybit-cli/accounts.db`.

### Add Account

Interactive wizard (recommended):

```bash
bb account add
```

The wizard prompts for name, API key, and API secret (hidden input), tests connectivity, and offers to set as default.

Direct mode:

```bash
bb account add <name> <apiKey> <apiSecret>
```

### List Accounts

```bash
bb account ls
bb account ls --json
```

### Set Default Account

```bash
bb account set-default <name>
```

### Remove Account

```bash
bb account remove <name>
```

---

## Balance and Portfolio

### Balances

```bash
bb account balances
bb account balances --json
```

Shows wallet balances with columns: Coin, Equity, Available, Unrealised PnL.

### Positions

```bash
bb account positions
bb account positions --json
```

Shows open positions: Symbol, Side, Size, Entry, Mark, Unrealised PnL, Leverage.

### Orders

```bash
bb account orders
bb account orders --json
```

Shows open orders: Order ID, Symbol, Side, Type, Price, Qty, Status, Created.

### Portfolio

```bash
bb account portfolio
bb account portfolio --json
```

Combined view of balances and positions in a single display.

---

## Trading

All trade commands require an authenticated account.

### Limit Order

```bash
bb trade order limit <side> <size> <coin> <price>

# Examples
bb trade order limit buy 0.001 BTC 85000
bb trade order limit sell 0.1 ETH 3500 --tif IOC
bb trade order limit buy 1 SOL 100 --reduce-only
```

| Option | Description |
|--------|-------------|
| `--tif <tif>` | Time-in-force: `GTC` (default), `IOC`, `PostOnly` |
| `--reduce-only` | Reduce-only order |

### Market Order

```bash
bb trade order market <side> <size> <coin>

# Examples
bb trade order market buy 0.001 BTC
bb trade order market sell 0.1 ETH --reduce-only
```

| Option | Description |
|--------|-------------|
| `--reduce-only` | Reduce-only order |

### Stop-Loss Order

```bash
bb trade order stop-loss <side> <size> <coin> <price> <trigger>

# Example
bb trade order stop-loss sell 0.001 BTC 48000 49000
```

| Option | Description |
|--------|-------------|
| `--reduce-only` | Reduce-only order |

### Take-Profit Order

```bash
bb trade order take-profit <side> <size> <coin> <price> <trigger>

# Example
bb trade order take-profit sell 0.001 BTC 55000 54000
```

| Option | Description |
|--------|-------------|
| `--reduce-only` | Reduce-only order |

### Cancel Order

```bash
bb trade cancel <orderId> --coin <symbol>

# Example
bb trade cancel 1234567890 --coin BTC
```

### Cancel All Orders

```bash
# Cancel all open orders
bb trade cancel-all

# Cancel all orders for a specific coin
bb trade cancel-all --coin BTC

# Skip confirmation
bb trade cancel-all -y
```

### Set Leverage

```bash
bb trade set-leverage <coin> <leverage>

# Examples
bb trade set-leverage BTC 10
bb trade set-leverage ETH 5
```

### Amend Order

Modify price or quantity of an existing order (Bybit exclusive feature).

```bash
bb trade amend <orderId> --coin <symbol> [--price <price>] [--qty <qty>]

# Examples
bb trade amend 1234567890 --coin BTC --price 86000
bb trade amend 1234567890 --coin BTC --qty 0.002
bb trade amend 1234567890 --coin BTC --price 86000 --qty 0.002
```

At least one of `--price` or `--qty` must be specified.

---

## Market Information

No authentication required.

### List Instruments

```bash
bb markets ls
bb markets ls --category spot --json
```

Shows: Symbol, Base, Quote, Status, Max Leverage.

### Prices

```bash
bb markets prices
bb markets prices --json
```

Shows: Symbol, Last Price, 24h Change, 24h Volume.

### Ticker Detail

```bash
bb markets tickers <symbol>

# Example
bb markets tickers BTC
bb markets tickers ETH --json
```

Shows: Symbol, Last, High 24h, Low 24h, 24h %, Volume, Bid, Ask.

---

## Asset Information

No authentication required.

### Price

```bash
bb asset price <coin>
bb asset price BTC --json
```

Shows: Symbol, Last Price, Index Price, Mark Price, 24h Change.

### Order Book

```bash
bb asset book <coin>
bb asset book BTC --limit 10 --json
```

| Option | Description |
|--------|-------------|
| `--limit <n>` | Number of levels (default: 25) |

### Funding Rate

```bash
bb asset funding <coin>
bb asset funding BTC --json
```

Shows the latest funding rate history for a symbol.

---

## Testnet

Use `--testnet` with any command to target Bybit's testnet environment:

```bash
bb --testnet account balances
bb --testnet trade order limit buy 0.001 BTC 85000
bb --testnet markets prices
```

Create testnet API keys at [testnet.bybit.com](https://testnet.bybit.com/).

---

## Scripting with JSON

All commands support `--json` for machine-readable output:

```bash
# Get BTC price
bb asset price BTC --json | jq '.lastPrice'

# Get all positions as JSON
bb account positions --json | jq '.[] | {symbol, size, unrealisedPnl}'

# Check open orders for BTC
bb account orders --json | jq '.[] | select(.symbol | startswith("BTC"))'

# Place order and capture result
RESULT=$(bb trade order limit buy 0.001 BTC 85000 --json)
ORDER_ID=$(echo "$RESULT" | jq -r '.orderId')
echo "Placed order: $ORDER_ID"
```

---

## Configuration

### Encrypted Storage

| Path | Description |
|------|-------------|
| `~/.bybit-cli/accounts.db` | Encrypted SQLite database for accounts |

API secrets are encrypted using AES-256-GCM. The encryption key is derived from machine identity (hostname + username) by default.

Set a custom encryption key:

```bash
export BYBIT_CLI_ENCRYPTION_KEY="your-custom-key"
```

### Categories

Bybit supports multiple product categories. Use `--category` to switch:

| Category | Description |
|----------|-------------|
| `linear` | USDT perpetual futures (default) |
| `spot` | Spot trading |
| `inverse` | Coin-margined futures |
| `option` | Options |

---

## Development

### Setup

```bash
git clone https://github.com/superclawclaw/bybit-cli.git
cd bybit-cli
pnpm install
pnpm build
```

### Commands

```bash
# Build
pnpm build

# Run tests
pnpm test

# Watch mode development
pnpm dev

# Run without building
node dist/index.js --help
```

### Project Structure

```
bybit-cli/
├── src/
│   ├── index.ts                    # Entry point with shebang
│   ├── cli/
│   │   ├── program.ts              # Commander program setup
│   │   ├── context.ts              # CLI context (clients, config)
│   │   ├── output.ts               # Output formatting (JSON/table)
│   │   ├── watch.ts                # Watch mode utilities
│   │   └── ink/                    # Ink TUI components
│   │       ├── theme.ts            # Color theme (dark terminal)
│   │       ├── render.tsx          # Render utilities
│   │       └── components/         # React components
│   ├── commands/
│   │   ├── account/                # add, ls, remove, set-default, balances, positions, orders, portfolio
│   │   ├── trade/                  # order (limit/market/stop-loss/take-profit), cancel, cancel-all, set-leverage, amend
│   │   ├── markets/                # ls, prices, tickers
│   │   └── asset/                  # price, book, funding
│   └── lib/
│       ├── config.ts               # Environment config + defaults
│       ├── crypto.ts               # AES-256-GCM encryption
│       ├── validation.ts           # Input validation helpers
│       ├── bybit.ts                # Bybit client factory
│       └── db/                     # SQLite database
│           ├── index.ts            # DB singleton
│           └── accounts.ts         # Account CRUD with encryption
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## License

MIT
