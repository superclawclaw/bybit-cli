# Bybit CLI Phase 1 (Read-Only MVP) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `bb`, a read-only CLI for Bybit DEX with account management, balance/position/order viewing, market data, and real-time watch mode via WebSocket.

**Architecture:** Commander.js commands delegate to `bybit-api` SDK (RestClientV5 + WebsocketClient). Accounts stored in encrypted SQLite. Output via `--json` flag or human-readable tables (cli-table3 + chalk). Watch mode uses Ink (React for terminal) for live TUI.

**Tech Stack:** TypeScript (strict), Commander.js, Ink + ink-spinner, bybit-api v4.5.3, better-sqlite3, chalk, cli-table3, vitest

---

## Task 1: Project Setup (package.json, tsconfig, vitest, bin entry)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "bybit-cli",
  "version": "0.1.0",
  "description": "Bybit DEX CLI tool",
  "type": "module",
  "bin": {
    "bb": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "node dist/index.js"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "bybit-api": "^4.5.3",
    "chalk": "^5.4.1",
    "cli-table3": "^0.6.5",
    "commander": "^13.1.0",
    "better-sqlite3": "^11.8.1",
    "ink": "^5.1.0",
    "ink-spinner": "^5.0.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', 'vitest.config.ts'],
    },
  },
});
```

**Step 4: Create src/index.ts (minimal entry)**

```typescript
#!/usr/bin/env node
console.log('bb: bybit-cli v0.1.0');
```

**Step 5: Run pnpm install**

```bash
cd /path/to/bybit-cli && pnpm install
```

**Step 6: Build and verify**

```bash
pnpm build && node dist/index.js
```
Expected: prints `bb: bybit-cli v0.1.0`

**Step 7: Run test suite (empty but should pass)**

```bash
pnpm test
```
Expected: 0 tests, exit 0

**Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json vitest.config.ts src/index.ts
git commit -m "feat: project setup with package.json, tsconfig, vitest"
```

---

## Task 2: Config Module + Validation Helpers

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/lib/validation.ts`
- Test: `src/lib/config.test.ts`
- Test: `src/lib/validation.test.ts`

**Step 1: Write failing test for config**

```typescript
// src/lib/config.test.ts
import { describe, it, expect } from 'vitest';
import { getConfig } from './config.js';

describe('getConfig', () => {
  it('returns default config', () => {
    const config = getConfig({});
    expect(config.testnet).toBe(false);
    expect(config.category).toBe('linear');
    expect(config.dataDir).toContain('.bybit-cli');
  });

  it('returns testnet config when testnet flag is true', () => {
    const config = getConfig({ testnet: true });
    expect(config.testnet).toBe(true);
  });

  it('respects category override', () => {
    const config = getConfig({ category: 'spot' });
    expect(config.category).toBe('spot');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/config.test.ts
```
Expected: FAIL (module not found)

**Step 3: Implement config.ts**

```typescript
// src/lib/config.ts
import path from 'node:path';
import os from 'node:os';

export type Category = 'linear' | 'spot' | 'inverse' | 'option';

export interface CliConfig {
  readonly testnet: boolean;
  readonly category: Category;
  readonly dataDir: string;
  readonly accountId: string | undefined;
  readonly jsonOutput: boolean;
}

export interface ConfigOptions {
  readonly testnet?: boolean;
  readonly category?: Category;
  readonly account?: string;
  readonly json?: boolean;
}

export function getConfig(options: ConfigOptions): CliConfig {
  return {
    testnet: options.testnet ?? false,
    category: options.category ?? 'linear',
    dataDir: path.join(os.homedir(), '.bybit-cli'),
    accountId: options.account,
    jsonOutput: options.json ?? false,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test src/lib/config.test.ts
```
Expected: PASS

**Step 5: Write failing test for validation**

```typescript
// src/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateSymbol, validateCategory, validatePositiveNumber } from './validation.js';

describe('validateSymbol', () => {
  it('accepts valid uppercase symbol', () => {
    expect(validateSymbol('BTC')).toBe('BTC');
  });

  it('uppercases lowercase input', () => {
    expect(validateSymbol('btc')).toBe('BTC');
  });

  it('rejects empty string', () => {
    expect(() => validateSymbol('')).toThrow('Symbol cannot be empty');
  });

  it('rejects symbols with special characters', () => {
    expect(() => validateSymbol('BTC!')).toThrow('Invalid symbol');
  });
});

describe('validateCategory', () => {
  it('accepts valid categories', () => {
    expect(validateCategory('linear')).toBe('linear');
    expect(validateCategory('spot')).toBe('spot');
    expect(validateCategory('inverse')).toBe('inverse');
    expect(validateCategory('option')).toBe('option');
  });

  it('rejects invalid category', () => {
    expect(() => validateCategory('futures')).toThrow('Invalid category');
  });
});

describe('validatePositiveNumber', () => {
  it('accepts positive numbers', () => {
    expect(validatePositiveNumber('10', 'leverage')).toBe(10);
  });

  it('rejects zero', () => {
    expect(() => validatePositiveNumber('0', 'leverage')).toThrow('leverage must be positive');
  });

  it('rejects negative', () => {
    expect(() => validatePositiveNumber('-5', 'leverage')).toThrow('leverage must be positive');
  });

  it('rejects non-numeric', () => {
    expect(() => validatePositiveNumber('abc', 'leverage')).toThrow('leverage must be a number');
  });
});
```

**Step 6: Run test to verify it fails**

```bash
pnpm test src/lib/validation.test.ts
```
Expected: FAIL

**Step 7: Implement validation.ts**

```typescript
// src/lib/validation.ts
import type { Category } from './config.js';

const VALID_CATEGORIES: readonly Category[] = ['linear', 'spot', 'inverse', 'option'];
const SYMBOL_REGEX = /^[A-Z0-9]+$/;

export function validateSymbol(input: string): string {
  const symbol = input.trim().toUpperCase();
  if (symbol.length === 0) {
    throw new Error('Symbol cannot be empty');
  }
  if (!SYMBOL_REGEX.test(symbol)) {
    throw new Error(`Invalid symbol: ${input}. Only alphanumeric characters allowed.`);
  }
  return symbol;
}

export function validateCategory(input: string): Category {
  if (!VALID_CATEGORIES.includes(input as Category)) {
    throw new Error(`Invalid category: ${input}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  return input as Category;
}

export function validatePositiveNumber(input: string, name: string): number {
  const num = Number(input);
  if (Number.isNaN(num)) {
    throw new Error(`${name} must be a number, got: ${input}`);
  }
  if (num <= 0) {
    throw new Error(`${name} must be positive, got: ${num}`);
  }
  return num;
}
```

**Step 8: Run tests to verify they pass**

```bash
pnpm test src/lib/validation.test.ts
```
Expected: PASS

**Step 9: Commit**

```bash
git add src/lib/config.ts src/lib/config.test.ts src/lib/validation.ts src/lib/validation.test.ts
git commit -m "feat: add config module and validation helpers with tests"
```

---

## Task 3: SQLite Database + Account CRUD

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/accounts.ts`
- Test: `src/lib/db/accounts.test.ts`

**Step 1: Write failing test for accounts CRUD**

```typescript
// src/lib/db/accounts.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { AccountStore } from './accounts.js';

describe('AccountStore', () => {
  let store: AccountStore;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-test-'));
    store = new AccountStore(tmpDir);
  });

  afterEach(() => {
    store.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('starts with empty account list', () => {
    expect(store.list()).toEqual([]);
  });

  it('adds an account', () => {
    store.add({ name: 'test', apiKey: 'key123', apiSecret: 'secret456' });
    const accounts = store.list();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('test');
    expect(accounts[0].apiKey).toBe('key123');
  });

  it('prevents duplicate names', () => {
    store.add({ name: 'test', apiKey: 'key1', apiSecret: 'secret1' });
    expect(() => store.add({ name: 'test', apiKey: 'key2', apiSecret: 'secret2' }))
      .toThrow('Account "test" already exists');
  });

  it('removes an account', () => {
    store.add({ name: 'test', apiKey: 'key1', apiSecret: 'secret1' });
    store.remove('test');
    expect(store.list()).toEqual([]);
  });

  it('throws when removing non-existent account', () => {
    expect(() => store.remove('ghost')).toThrow('Account "ghost" not found');
  });

  it('sets and gets default account', () => {
    store.add({ name: 'a1', apiKey: 'k1', apiSecret: 's1' });
    store.add({ name: 'a2', apiKey: 'k2', apiSecret: 's2' });
    store.setDefault('a2');
    expect(store.getDefault()?.name).toBe('a2');
  });

  it('first added account becomes default', () => {
    store.add({ name: 'first', apiKey: 'k1', apiSecret: 's1' });
    expect(store.getDefault()?.name).toBe('first');
  });

  it('gets account by name', () => {
    store.add({ name: 'myacct', apiKey: 'k1', apiSecret: 's1' });
    const acct = store.get('myacct');
    expect(acct).toBeDefined();
    expect(acct!.apiKey).toBe('k1');
  });

  it('returns undefined for non-existent account', () => {
    expect(store.get('nope')).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/db/accounts.test.ts
```
Expected: FAIL (module not found)

**Step 3: Implement db/index.ts**

```typescript
// src/lib/db/index.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

export function createDatabase(dataDir: string): Database.Database {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'accounts.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}
```

**Step 4: Implement db/accounts.ts**

```typescript
// src/lib/db/accounts.ts
import type Database from 'better-sqlite3';
import { createDatabase } from './index.js';

export interface Account {
  readonly name: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly isDefault: boolean;
}

export interface AddAccountInput {
  readonly name: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}

export class AccountStore {
  private readonly db: Database.Database;

  constructor(dataDir: string) {
    this.db = createDatabase(dataDir);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        name TEXT PRIMARY KEY,
        api_key TEXT NOT NULL,
        api_secret TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  list(): readonly Account[] {
    const rows = this.db.prepare('SELECT name, api_key, api_secret, is_default FROM accounts ORDER BY name').all() as Array<{
      name: string;
      api_key: string;
      api_secret: string;
      is_default: number;
    }>;
    return rows.map((r) => ({
      name: r.name,
      apiKey: r.api_key,
      apiSecret: r.api_secret,
      isDefault: r.is_default === 1,
    }));
  }

  add(input: AddAccountInput): void {
    const existing = this.db.prepare('SELECT name FROM accounts WHERE name = ?').get(input.name);
    if (existing) {
      throw new Error(`Account "${input.name}" already exists`);
    }
    const count = (this.db.prepare('SELECT COUNT(*) as cnt FROM accounts').get() as { cnt: number }).cnt;
    const isDefault = count === 0 ? 1 : 0;
    this.db.prepare('INSERT INTO accounts (name, api_key, api_secret, is_default) VALUES (?, ?, ?, ?)').run(
      input.name,
      input.apiKey,
      input.apiSecret,
      isDefault,
    );
  }

  remove(name: string): void {
    const result = this.db.prepare('DELETE FROM accounts WHERE name = ?').run(name);
    if (result.changes === 0) {
      throw new Error(`Account "${name}" not found`);
    }
  }

  get(name: string): Account | undefined {
    const row = this.db.prepare('SELECT name, api_key, api_secret, is_default FROM accounts WHERE name = ?').get(name) as
      | { name: string; api_key: string; api_secret: string; is_default: number }
      | undefined;
    if (!row) return undefined;
    return {
      name: row.name,
      apiKey: row.api_key,
      apiSecret: row.api_secret,
      isDefault: row.is_default === 1,
    };
  }

  getDefault(): Account | undefined {
    const row = this.db.prepare('SELECT name, api_key, api_secret, is_default FROM accounts WHERE is_default = 1').get() as
      | { name: string; api_key: string; api_secret: string; is_default: number }
      | undefined;
    if (!row) return undefined;
    return {
      name: row.name,
      apiKey: row.api_key,
      apiSecret: row.api_secret,
      isDefault: row.is_default === 1,
    };
  }

  setDefault(name: string): void {
    const existing = this.db.prepare('SELECT name FROM accounts WHERE name = ?').get(name);
    if (!existing) {
      throw new Error(`Account "${name}" not found`);
    }
    this.db.prepare('UPDATE accounts SET is_default = 0').run();
    this.db.prepare('UPDATE accounts SET is_default = 1 WHERE name = ?').run(name);
  }

  close(): void {
    this.db.close();
  }
}
```

**Step 5: Run tests**

```bash
pnpm test src/lib/db/accounts.test.ts
```
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/db/
git commit -m "feat: add SQLite account store with CRUD operations"
```

---

## Task 4: Bybit Client Factory

**Files:**
- Create: `src/lib/bybit.ts`
- Test: `src/lib/bybit.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/bybit.test.ts
import { describe, it, expect } from 'vitest';
import { createRestClient, getBaseUrl } from './bybit.js';

describe('getBaseUrl', () => {
  it('returns mainnet URL when testnet is false', () => {
    expect(getBaseUrl(false)).toBe('https://api.bybit.com');
  });

  it('returns testnet URL when testnet is true', () => {
    expect(getBaseUrl(true)).toBe('https://api-testnet.bybit.com');
  });
});

describe('createRestClient', () => {
  it('creates RestClientV5 instance with credentials', () => {
    const client = createRestClient({
      apiKey: 'testkey',
      apiSecret: 'testsecret',
      testnet: true,
    });
    expect(client).toBeDefined();
  });

  it('creates RestClientV5 instance without credentials', () => {
    const client = createRestClient({ testnet: false });
    expect(client).toBeDefined();
  });
});
```

**Step 2: Run test - verify fails**

```bash
pnpm test src/lib/bybit.test.ts
```

**Step 3: Implement bybit.ts**

```typescript
// src/lib/bybit.ts
import { RestClientV5, WebsocketClient } from 'bybit-api';

export interface RestClientOptions {
  readonly apiKey?: string;
  readonly apiSecret?: string;
  readonly testnet: boolean;
}

export function getBaseUrl(testnet: boolean): string {
  return testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
}

export function createRestClient(options: RestClientOptions): RestClientV5 {
  return new RestClientV5({
    key: options.apiKey,
    secret: options.apiSecret,
    testnet: options.testnet,
  });
}

export interface WsClientOptions {
  readonly apiKey?: string;
  readonly apiSecret?: string;
  readonly testnet: boolean;
}

export function createWsClient(options: WsClientOptions): WebsocketClient {
  return new WebsocketClient({
    key: options.apiKey,
    secret: options.apiSecret,
    testnet: options.testnet,
    market: 'v5',
  });
}
```

**Step 4: Run test - verify passes**

```bash
pnpm test src/lib/bybit.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/bybit.ts src/lib/bybit.test.ts
git commit -m "feat: add Bybit REST and WebSocket client factory"
```

---

## Task 5: Output Formatting (JSON + Table)

**Files:**
- Create: `src/cli/output.ts`
- Test: `src/cli/output.test.ts`

**Step 1: Write failing test**

```typescript
// src/cli/output.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatJson, formatTable, outputResult } from './output.js';

describe('formatJson', () => {
  it('returns JSON string of data', () => {
    const data = { coin: 'BTC', price: '85000' };
    const result = formatJson(data);
    expect(JSON.parse(result)).toEqual(data);
  });

  it('handles arrays', () => {
    const data = [{ coin: 'BTC' }, { coin: 'ETH' }];
    const result = formatJson(data);
    expect(JSON.parse(result)).toEqual(data);
  });
});

describe('formatTable', () => {
  it('formats data as table string', () => {
    const headers = ['Coin', 'Price'];
    const rows = [['BTC', '85000'], ['ETH', '3200']];
    const result = formatTable(headers, rows);
    expect(result).toContain('BTC');
    expect(result).toContain('85000');
    expect(result).toContain('ETH');
  });

  it('handles empty rows', () => {
    const result = formatTable(['Coin'], []);
    expect(result).toContain('Coin');
  });
});

describe('outputResult', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('outputs JSON when jsonOutput is true', () => {
    const data = { coin: 'BTC' };
    outputResult({ data, jsonOutput: true, headers: ['Coin'], toRow: (d: typeof data) => [d.coin] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"coin"'));
  });

  it('outputs table when jsonOutput is false', () => {
    const data = [{ coin: 'BTC' }];
    outputResult({ data, jsonOutput: false, headers: ['Coin'], toRow: (d: { coin: string }) => [d.coin] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BTC'));
  });
});
```

**Step 2: Run test - verify fails**

```bash
pnpm test src/cli/output.test.ts
```

**Step 3: Implement output.ts**

```typescript
// src/cli/output.ts
import Table from 'cli-table3';
import chalk from 'chalk';

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatTable(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const table = new Table({
    head: headers.map((h) => chalk.hex('#87ceeb')(h)),
    style: { head: [], border: ['gray'] },
  });
  for (const row of rows) {
    table.push([...row]);
  }
  return table.toString();
}

export interface OutputOptions<T> {
  readonly data: T | readonly T[];
  readonly jsonOutput: boolean;
  readonly headers: readonly string[];
  readonly toRow: (item: T) => readonly string[];
}

export function outputResult<T>(options: OutputOptions<T>): void {
  if (options.jsonOutput) {
    console.log(formatJson(options.data));
    return;
  }
  const items = Array.isArray(options.data) ? options.data : [options.data];
  const rows = items.map(options.toRow);
  console.log(formatTable(options.headers, rows));
}
```

**Step 4: Run test - verify passes**

```bash
pnpm test src/cli/output.test.ts
```

**Step 5: Commit**

```bash
git add src/cli/output.ts src/cli/output.test.ts
git commit -m "feat: add output formatting (JSON and table)"
```

---

## Task 6: CLI Context + Commander Program Setup

**Files:**
- Create: `src/cli/context.ts`
- Create: `src/cli/program.ts`
- Modify: `src/index.ts`
- Test: `src/cli/context.test.ts`

**Step 1: Write failing test for context**

```typescript
// src/cli/context.test.ts
import { describe, it, expect } from 'vitest';
import { createCliContext } from './context.js';

describe('createCliContext', () => {
  it('creates context with default options', () => {
    const ctx = createCliContext({ testnet: false });
    expect(ctx.config.testnet).toBe(false);
    expect(ctx.config.category).toBe('linear');
    expect(ctx.restClient).toBeDefined();
  });

  it('creates context with testnet option', () => {
    const ctx = createCliContext({ testnet: true });
    expect(ctx.config.testnet).toBe(true);
  });

  it('creates context with account credentials', () => {
    const ctx = createCliContext({
      testnet: true,
      apiKey: 'key',
      apiSecret: 'secret',
    });
    expect(ctx.restClient).toBeDefined();
  });
});
```

**Step 2: Run test - verify fails**

```bash
pnpm test src/cli/context.test.ts
```

**Step 3: Implement context.ts**

```typescript
// src/cli/context.ts
import { RestClientV5 } from 'bybit-api';
import { createRestClient } from '../lib/bybit.js';
import { getConfig, type CliConfig, type ConfigOptions } from '../lib/config.js';

export interface CliContext {
  readonly config: CliConfig;
  readonly restClient: RestClientV5;
}

export interface ContextOptions extends ConfigOptions {
  readonly apiKey?: string;
  readonly apiSecret?: string;
}

export function createCliContext(options: ContextOptions): CliContext {
  const config = getConfig(options);
  const restClient = createRestClient({
    apiKey: options.apiKey,
    apiSecret: options.apiSecret,
    testnet: config.testnet,
  });
  return { config, restClient };
}
```

**Step 4: Run test - verify passes**

```bash
pnpm test src/cli/context.test.ts
```

**Step 5: Implement program.ts (Commander setup)**

```typescript
// src/cli/program.ts
import { Command } from 'commander';

export function createProgram(): Command {
  const program = new Command();
  program
    .name('bb')
    .description('Bybit DEX CLI')
    .version('0.1.0')
    .option('--json', 'Output JSON (for scripting)', false)
    .option('--testnet', 'Use testnet', false)
    .option('--account <id>', 'Use specific account')
    .option('--category <type>', 'Category: linear, spot, inverse, option', 'linear');

  return program;
}
```

**Step 6: Update src/index.ts**

```typescript
#!/usr/bin/env node
import { createProgram } from './cli/program.js';

const program = createProgram();
program.parse();
```

**Step 7: Build and verify**

```bash
pnpm build && node dist/index.js --help
```
Expected: shows help with `bb` name, version, options

**Step 8: Commit**

```bash
git add src/cli/context.ts src/cli/context.test.ts src/cli/program.ts src/index.ts
git commit -m "feat: add CLI context and Commander program setup"
```

---

## Task 7: Account Commands (add, ls, remove, set-default)

**Files:**
- Create: `src/commands/account/add.ts`
- Create: `src/commands/account/ls.ts`
- Create: `src/commands/account/remove.ts`
- Create: `src/commands/account/set-default.ts`
- Create: `src/commands/account/index.ts`
- Modify: `src/cli/program.ts`
- Test: `src/commands/account/ls.test.ts`
- Test: `src/commands/account/add.test.ts`

**Step 1: Write failing test for account ls**

```typescript
// src/commands/account/ls.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { AccountStore } from '../../lib/db/accounts.js';
import { listAccounts } from './ls.js';

describe('listAccounts', () => {
  let store: AccountStore;
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-test-'));
    store = new AccountStore(tmpDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    store.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    logSpy.mockRestore();
  });

  it('shows no accounts message when empty', () => {
    listAccounts(store, false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No accounts'));
  });

  it('lists accounts in JSON format', () => {
    store.add({ name: 'test', apiKey: 'key1', apiSecret: 'secret1' });
    listAccounts(store, true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('test');
    // Must NOT include apiSecret in output
    expect(parsed[0].apiSecret).toBeUndefined();
  });

  it('lists accounts in table format', () => {
    store.add({ name: 'acc1', apiKey: 'key1', apiSecret: 'secret1' });
    listAccounts(store, false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('acc1'));
  });
});
```

**Step 2: Run test - verify fails**

```bash
pnpm test src/commands/account/ls.test.ts
```

**Step 3: Implement account commands**

Implement `ls.ts`, `add.ts`, `remove.ts`, `set-default.ts`, and `index.ts` that registers all commands. Wire into `program.ts`.

Key points:
- `ls` shows name, apiKey (masked), isDefault status. Never shows apiSecret.
- `add` takes name, apiKey, apiSecret as arguments (non-interactive for now, interactive can be added later).
- `remove` takes account name.
- `set-default` takes account name.
- All respect `--json` flag.

**Step 4: Run tests - verify passes**

```bash
pnpm test src/commands/account/
```

**Step 5: Build and verify manually**

```bash
pnpm build && node dist/index.js account ls --testnet
```

**Step 6: Commit**

```bash
git add src/commands/account/ src/cli/program.ts
git commit -m "feat: add account management commands (add, ls, remove, set-default)"
```

---

## Task 8: Account Balances Command (REST)

**Files:**
- Create: `src/commands/account/balances.ts`
- Test: `src/commands/account/balances.test.ts`

**Step 1: Write failing test**

Test the balance formatting/output logic (mock the REST client response).

```typescript
// src/commands/account/balances.test.ts
import { describe, it, expect } from 'vitest';
import { formatBalance, type WalletBalance } from './balances.js';

describe('formatBalance', () => {
  it('formats balance row for table output', () => {
    const balance: WalletBalance = {
      coin: 'USDT',
      equity: '1000.50',
      availableToWithdraw: '800.00',
      unrealisedPnl: '50.25',
    };
    const row = formatBalance(balance);
    expect(row).toContain('USDT');
    expect(row).toContain('1000.50');
  });

  it('formats zero balance', () => {
    const balance: WalletBalance = {
      coin: 'BTC',
      equity: '0',
      availableToWithdraw: '0',
      unrealisedPnl: '0',
    };
    const row = formatBalance(balance);
    expect(row).toContain('BTC');
  });
});
```

**Step 2: Run test - verify fails**

**Step 3: Implement balances.ts**

Uses RestClientV5.getWalletBalance(). Formats output as table or JSON. Supports `--json` flag.

**Step 4: Run test - verify passes**

**Step 5: Wire into account command group and test manually with `--testnet`**

**Step 6: Commit**

```bash
git add src/commands/account/balances.ts src/commands/account/balances.test.ts
git commit -m "feat: add account balances command (REST)"
```

---

## Task 9: Account Positions Command (REST)

**Files:**
- Create: `src/commands/account/positions.ts`
- Test: `src/commands/account/positions.test.ts`

**Step 1: Write failing test**

Test position formatting logic (mock REST response).

```typescript
// src/commands/account/positions.test.ts
import { describe, it, expect } from 'vitest';
import { formatPosition, type PositionInfo } from './positions.js';

describe('formatPosition', () => {
  it('formats long position row', () => {
    const pos: PositionInfo = {
      symbol: 'BTCUSDT',
      side: 'Buy',
      size: '0.001',
      entryPrice: '85000',
      markPrice: '86000',
      unrealisedPnl: '1.00',
      leverage: '10',
    };
    const row = formatPosition(pos);
    expect(row).toContain('BTCUSDT');
    expect(row).toContain('Buy');
  });

  it('formats short position', () => {
    const pos: PositionInfo = {
      symbol: 'ETHUSDT',
      side: 'Sell',
      size: '0.1',
      entryPrice: '3200',
      markPrice: '3150',
      unrealisedPnl: '5.00',
      leverage: '5',
    };
    const row = formatPosition(pos);
    expect(row).toContain('Sell');
  });
});
```

**Step 2-6: Standard TDD cycle, wire in, commit**

```bash
git commit -m "feat: add account positions command (REST)"
```

---

## Task 10: Account Orders Command (REST)

**Files:**
- Create: `src/commands/account/orders.ts`
- Test: `src/commands/account/orders.test.ts`

**Step 1: Write failing test**

Test order formatting logic.

```typescript
// src/commands/account/orders.test.ts
import { describe, it, expect } from 'vitest';
import { formatOrder, type OrderInfo } from './orders.js';

describe('formatOrder', () => {
  it('formats limit order row', () => {
    const order: OrderInfo = {
      orderId: 'abc123',
      symbol: 'BTCUSDT',
      side: 'Buy',
      orderType: 'Limit',
      price: '85000',
      qty: '0.001',
      orderStatus: 'New',
      createdTime: '1700000000000',
    };
    const row = formatOrder(order);
    expect(row).toContain('BTCUSDT');
    expect(row).toContain('Limit');
  });
});
```

**Step 2-6: Standard TDD cycle, wire in, commit**

```bash
git commit -m "feat: add account orders command (REST)"
```

---

## Task 11: Markets Commands (ls, prices, tickers)

**Files:**
- Create: `src/commands/markets/ls.ts`
- Create: `src/commands/markets/prices.ts`
- Create: `src/commands/markets/tickers.ts`
- Create: `src/commands/markets/index.ts`
- Test: `src/commands/markets/ls.test.ts`
- Test: `src/commands/markets/prices.test.ts`

**Step 1: Write failing test for markets ls formatting**

```typescript
// src/commands/markets/ls.test.ts
import { describe, it, expect } from 'vitest';
import { formatInstrument, type InstrumentInfo } from './ls.js';

describe('formatInstrument', () => {
  it('formats instrument row', () => {
    const instrument: InstrumentInfo = {
      symbol: 'BTCUSDT',
      baseCoin: 'BTC',
      quoteCoin: 'USDT',
      status: 'Trading',
      maxLeverage: '100',
    };
    const row = formatInstrument(instrument);
    expect(row).toContain('BTCUSDT');
    expect(row).toContain('100');
  });
});
```

**Step 2: Write failing test for markets prices formatting**

```typescript
// src/commands/markets/prices.test.ts
import { describe, it, expect } from 'vitest';
import { formatTicker, type TickerInfo } from './prices.js';

describe('formatTicker', () => {
  it('formats ticker row', () => {
    const ticker: TickerInfo = {
      symbol: 'BTCUSDT',
      lastPrice: '85000.50',
      price24hPcnt: '0.0235',
      volume24h: '1234567.89',
    };
    const row = formatTicker(ticker);
    expect(row).toContain('BTCUSDT');
    expect(row).toContain('85000.50');
  });
});
```

**Step 3-6: Standard TDD cycle for each, wire into program, commit**

```bash
git commit -m "feat: add markets commands (ls, prices, tickers)"
```

---

## Task 12: Asset Commands (price, book, funding)

**Files:**
- Create: `src/commands/asset/price.ts`
- Create: `src/commands/asset/book.ts`
- Create: `src/commands/asset/funding.ts`
- Create: `src/commands/asset/index.ts`
- Test: `src/commands/asset/price.test.ts`
- Test: `src/commands/asset/book.test.ts`

**Step 1: Write failing test for asset price formatting**

```typescript
// src/commands/asset/price.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice, type PriceInfo } from './price.js';

describe('formatPrice', () => {
  it('formats price info', () => {
    const price: PriceInfo = {
      symbol: 'BTCUSDT',
      lastPrice: '85000.50',
      indexPrice: '84999.00',
      markPrice: '85001.25',
      price24hPcnt: '0.0235',
    };
    const result = formatPrice(price);
    expect(result).toContain('BTCUSDT');
    expect(result).toContain('85000.50');
  });
});
```

**Step 2: Write failing test for asset book formatting**

```typescript
// src/commands/asset/book.test.ts
import { describe, it, expect } from 'vitest';
import { formatBookLevel, type BookLevel } from './book.js';

describe('formatBookLevel', () => {
  it('formats bid level', () => {
    const level: BookLevel = { price: '85000', size: '1.5' };
    const result = formatBookLevel(level, 'bid');
    expect(result).toContain('85000');
    expect(result).toContain('1.5');
  });

  it('formats ask level', () => {
    const level: BookLevel = { price: '85001', size: '2.0' };
    const result = formatBookLevel(level, 'ask');
    expect(result).toContain('85001');
  });
});
```

**Step 3-6: Standard TDD cycle, wire in, commit**

```bash
git commit -m "feat: add asset commands (price, book, funding)"
```

---

## Task 13: TUI Theme + Ink Components for Watch Mode

**Files:**
- Create: `src/cli/ink/theme.ts`
- Create: `src/cli/ink/components/PriceDisplay.tsx`
- Create: `src/cli/ink/components/PositionsTable.tsx`
- Create: `src/cli/ink/components/OrdersTable.tsx`
- Create: `src/cli/ink/components/BalancesTable.tsx`
- Create: `src/cli/ink/components/BookView.tsx`
- Create: `src/cli/ink/render.tsx`
- Test: `src/cli/ink/theme.test.ts`

**Step 1: Write failing test for theme**

```typescript
// src/cli/ink/theme.test.ts
import { describe, it, expect } from 'vitest';
import { theme, pnlColor } from './theme.js';

describe('theme', () => {
  it('has required color keys', () => {
    expect(theme.profit).toBeDefined();
    expect(theme.loss).toBeDefined();
    expect(theme.neutral).toBeDefined();
    expect(theme.accent).toBeDefined();
    expect(theme.muted).toBeDefined();
    expect(theme.header).toBeDefined();
    expect(theme.border).toBeDefined();
  });
});

describe('pnlColor', () => {
  it('returns profit color for positive values', () => {
    expect(pnlColor(100)).toBe(theme.profit);
  });

  it('returns loss color for negative values', () => {
    expect(pnlColor(-50)).toBe(theme.loss);
  });

  it('returns neutral color for zero', () => {
    expect(pnlColor(0)).toBe(theme.neutral);
  });
});
```

**Step 2: Run test - verify fails**

**Step 3: Implement theme.ts**

```typescript
// src/cli/ink/theme.ts
export const theme = {
  profit: '#00ff87',
  loss: '#ff5f5f',
  neutral: '#808080',
  accent: '#ffd700',
  muted: '#6c757d',
  header: '#87ceeb',
  border: '#4a4a4a',
} as const;

export function pnlColor(value: number): string {
  if (value > 0) return theme.profit;
  if (value < 0) return theme.loss;
  return theme.neutral;
}
```

**Step 4: Run test - verify passes**

**Step 5: Create Ink components**

Create minimal React components for:
- `PriceDisplay` - shows symbol + price with color
- `PositionsTable` - table of positions with PnL coloring
- `OrdersTable` - table of open orders
- `BalancesTable` - table of wallet balances
- `BookView` - order book with bid/ask spread visualization

These components receive data as props (no API calls inside components).

**Step 6: Create render.tsx utility**

```typescript
// src/cli/ink/render.tsx
import React from 'react';
import { render } from 'ink';

export function renderComponent(component: React.ReactElement): void {
  render(component);
}
```

**Step 7: Commit**

```bash
git add src/cli/ink/
git commit -m "feat: add TUI theme and Ink components for watch mode"
```

---

## Task 14: WebSocket Watch Mode Integration

**Files:**
- Create: `src/cli/watch.ts`
- Modify: `src/commands/asset/price.ts` (add -w flag)
- Modify: `src/commands/asset/book.ts` (add -w flag)
- Modify: `src/commands/account/positions.ts` (add -w flag)
- Modify: `src/commands/account/orders.ts` (add -w flag)
- Modify: `src/commands/account/balances.ts` (add -w flag)
- Test: `src/cli/watch.test.ts`

**Step 1: Write failing test for watch mode utilities**

```typescript
// src/cli/watch.test.ts
import { describe, it, expect } from 'vitest';
import { buildWsTopic } from './watch.js';

describe('buildWsTopic', () => {
  it('builds orderbook topic', () => {
    expect(buildWsTopic('orderbook', 'BTCUSDT', 50)).toBe('orderbook.50.BTCUSDT');
  });

  it('builds tickers topic', () => {
    expect(buildWsTopic('tickers', 'BTCUSDT')).toBe('tickers.BTCUSDT');
  });

  it('builds position topic (private)', () => {
    expect(buildWsTopic('position')).toBe('position');
  });

  it('builds order topic (private)', () => {
    expect(buildWsTopic('order')).toBe('order');
  });

  it('builds wallet topic (private)', () => {
    expect(buildWsTopic('wallet')).toBe('wallet');
  });
});
```

**Step 2: Run test - verify fails**

**Step 3: Implement watch.ts**

Watch mode helper that:
1. Creates WebsocketClient via factory
2. Subscribes to topic
3. On update, re-renders Ink component with new data
4. Handles cleanup on Ctrl+C

**Step 4: Run test - verify passes**

**Step 5: Add `-w` flag to asset price, asset book, account positions/orders/balances commands**

Each command checks for `-w` flag. If set:
1. Fetch initial data via REST
2. Subscribe to WS topic
3. Render Ink component
4. Update component on WS messages

**Step 6: Build and verify manually**

```bash
pnpm build && node dist/index.js asset price BTC --testnet
pnpm build && node dist/index.js asset price BTC --testnet -w
```

**Step 7: Commit**

```bash
git add src/cli/watch.ts src/cli/watch.test.ts src/commands/
git commit -m "feat: add WebSocket watch mode for all read commands"
```

---

## Task 15: Wire Everything Together + Final Integration

**Files:**
- Modify: `src/cli/program.ts` (register all command groups)
- Modify: `src/index.ts`
- Create: `src/commands/account/portfolio.ts`

**Step 1: Wire all command groups into program**

Ensure program.ts imports and registers:
- `account` command group (add, ls, remove, set-default, balances, positions, orders, portfolio)
- `markets` command group (ls, prices, tickers)
- `asset` command group (price, book, funding)

**Step 2: Add portfolio command**

Portfolio combines positions + balances in a single view. Reuse formatting from positions.ts and balances.ts.

**Step 3: Full build and smoke test**

```bash
pnpm build
node dist/index.js --help
node dist/index.js account --help
node dist/index.js markets --help
node dist/index.js asset --help
node dist/index.js --version
```

**Step 4: Run all tests**

```bash
pnpm test
```
Expected: All pass, >80% coverage on utility/formatting code

**Step 5: Commit**

```bash
git add .
git commit -m "feat: wire all commands and add portfolio command"
```

---

## Task 16: Final Verification + Cleanup

**Step 1: Run full test suite**

```bash
pnpm test
```

**Step 2: Run build**

```bash
pnpm build
```

**Step 3: Verify binary works**

```bash
node dist/index.js --help
node dist/index.js --version
node dist/index.js account ls
node dist/index.js markets ls --testnet --json
```

**Step 4: Check for linting / type errors**

```bash
npx tsc --noEmit
```

**Step 5: Verify no secrets in codebase**

```bash
grep -r "apiSecret\|password\|token" src/ --include="*.ts" | grep -v "test" | grep -v "type\|interface\|param"
```

**Step 6: Final commit if cleanup needed**

```bash
git commit -m "chore: final cleanup and verification"
```
