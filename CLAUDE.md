# CLAUDE.md — Bybit CLI Project

## Project Overview
Build a Bybit DEX CLI tool modeled after [hyperliquid-cli](https://github.com/chrisling-dev/hyperliquid-cli).
Command name: `bb` (short for Bybit, like `hl` is for Hyperliquid).

## Tech Stack
- **Language**: TypeScript (strict mode)
- **CLI Framework**: Commander.js
- **TUI**: Ink (React for terminal) + ink-spinner
- **API SDK**: `bybit-api` (tiagosiebler/bybit-api v4.5.3) — RestClientV5 + WebsocketClient
- **Account Storage**: SQLite via better-sqlite3
- **Auth**: API Key + API Secret (HMAC), stored encrypted in SQLite
- **Build**: tsc (target ES2022, module NodeNext)
- **Test**: vitest
- **Package Manager**: pnpm

## Architecture (mirror hyperliquid-cli structure)
```
bybit-cli/
├── src/
│   ├── index.ts                # Entry point, bin
│   ├── cli/
│   │   ├── program.ts          # Commander program setup
│   │   ├── context.ts          # CLI context (RestClientV5, WebsocketClient, config)
│   │   ├── output.ts           # Output formatting (JSON/table/text)
│   │   ├── watch.ts            # Watch mode utilities (WebSocket subscription helpers)
│   │   └── ink/                # Ink TUI components
│   │       ├── theme.ts        # Color theme (dark terminal optimized)
│   │       ├── render.tsx       # Render utilities
│   │       └── components/     # React components (PositionsTable, OrdersTable, BookView, etc.)
│   ├── commands/
│   │   ├── account/            # add, ls, remove, set-default, positions, orders, balances, portfolio
│   │   ├── trade/              # limit, market, stop-loss, take-profit, cancel, cancel-all, set-leverage, amend
│   │   ├── markets/            # ls, prices, tickers
│   │   ├── asset/              # price, book, funding
│   │   └── server.ts           # Background WebSocket cache server (start, stop, status)
│   ├── lib/
│   │   ├── config.ts           # Environment config + defaults
│   │   ├── validation.ts       # Input validation helpers
│   │   ├── db/                 # SQLite database for accounts
│   │   │   ├── index.ts        # DB singleton
│   │   │   └── accounts.ts     # Account CRUD
│   │   ├── watchers/           # WebSocket watcher classes
│   │   │   ├── position-watcher.ts
│   │   │   ├── order-watcher.ts
│   │   │   ├── balance-watcher.ts
│   │   │   ├── price-watcher.ts
│   │   │   └── book-watcher.ts
│   │   └── bybit.ts            # Bybit client factory (RestClientV5 + WS setup)
│   └── server/                 # Background server for caching
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── CLAUDE.md
├── SKILLS.md                   # AI agent usage guide (like hyperliquid-cli)
└── README.md
```

## Key Design Decisions

### 1. Command Structure
```bash
bb account add              # Interactive account setup
bb account ls               # List accounts
bb account positions [-w]   # Positions (watch mode)
bb account orders [-w]      # Open orders (watch mode)
bb account balances [-w]    # Balances (watch mode)
bb account portfolio [-w]   # Combined view

bb trade order limit buy 0.001 BTC 85000
bb trade order market buy 0.001 BTC
bb trade order stop-loss sell 0.001 BTC 48000 49000
bb trade order take-profit sell 0.001 BTC 55000 54000
bb trade cancel <orderId>
bb trade cancel-all [--coin BTC]
bb trade set-leverage BTC 10 [--isolated]
bb trade amend <orderId> [--price 86000] [--qty 0.002]  # Bybit exclusive

bb markets ls [--category linear|spot|inverse|option]
bb markets prices
bb markets tickers BTC

bb asset price BTC [-w]
bb asset book BTC [-w]
bb asset funding BTC          # Bybit: funding rate history
```

### 2. Global Options
```
--json          Output JSON (for scripting)
--testnet       Use testnet (api-testnet.bybit.com)
--account <id>  Use specific account (override default)
-V, --version   Show version
-h, --help      Show help
```

### 3. Authentication
- API Key + Secret stored in SQLite at `~/.bybit-cli/accounts.db`
- Support both Unified Trading Account and Classic Account
- Category parameter: `linear` (default), `spot`, `inverse`, `option`

### 4. Bybit API v5 Endpoints Used
| Feature | Endpoint |
|---------|----------|
| Wallet Balance | GET /v5/account/wallet-balance |
| Positions | GET /v5/position/list |
| Open Orders | GET /v5/order/realtime |
| Place Order | POST /v5/order/create |
| Amend Order | POST /v5/order/amend |
| Cancel Order | POST /v5/order/cancel |
| Cancel All | POST /v5/order/cancel-all |
| Set Leverage | POST /v5/position/set-leverage |
| Instruments | GET /v5/market/instruments-info |
| Tickers | GET /v5/market/tickers |
| Orderbook | GET /v5/market/orderbook |
| WS Public | wss://stream.bybit.com/v5/public/linear |
| WS Private | wss://stream.bybit.com/v5/private |

### 5. Watch Mode WebSocket Topics
- `position` — Real-time position updates
- `order` — Order status changes
- `wallet` — Balance changes
- `orderbook.{depth}.{symbol}` — Order book (1/50/200 levels)
- `tickers.{symbol}` — Price tickers

### 6. TUI Theme (Dark Terminal Optimized)
```typescript
const theme = {
  profit: '#00ff87',    // Green for positive PnL
  loss: '#ff5f5f',      // Red for negative PnL
  neutral: '#808080',   // Gray for zero/neutral
  accent: '#ffd700',    // Gold for highlights
  muted: '#6c757d',     // Muted text
  header: '#87ceeb',    // Light blue for headers
  border: '#4a4a4a',    // Subtle borders
}
```

## Code Quality Rules
1. **Strict TypeScript** — no `any`, proper type definitions
2. **Error handling** — graceful errors with helpful messages, never crash
3. **Consistent output** — `--json` always works, human output is beautiful
4. **Security** — never log API secrets, encrypt at rest
5. **Testnet first** — all examples show `--testnet` flag
6. **TDD** — write tests for parsing, validation, output formatting

## Phase 1 Deliverables (MVP Read-Only)
1. Project setup (package.json, tsconfig, etc.)
2. Account management (add, ls, remove, set-default)
3. `bb account balances` (REST + watch mode)
4. `bb account positions` (REST + watch mode)
5. `bb account orders` (REST + watch mode)
6. `bb markets ls` and `bb markets prices`
7. `bb asset price <coin>` with watch mode
8. `bb asset book <coin>` with watch mode
9. `--json` output for all commands
10. Beautiful Ink TUI for watch mode
