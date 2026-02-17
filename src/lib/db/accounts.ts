import type Database from 'better-sqlite3';
import { createDatabase } from './index.js';
import { encrypt, decrypt, isEncrypted } from '../crypto.js';

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

interface AccountRow {
  readonly name: string;
  readonly api_key: string;
  readonly api_secret: string;
  readonly is_default: number;
}

function rowToAccount(row: AccountRow): Account {
  return Object.freeze({
    name: row.name,
    apiKey: row.api_key,
    apiSecret: decrypt(row.api_secret),
    isDefault: row.is_default === 1,
  });
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS accounts (
    name TEXT PRIMARY KEY,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0
  )
`;

export class AccountStore {
  private readonly db: Database.Database;

  constructor(dataDir: string) {
    this.db = createDatabase(dataDir);
    this.db.exec(CREATE_TABLE_SQL);
    this.migrateUnencryptedSecrets();
  }

  list(): readonly Account[] {
    const rows = this.db
      .prepare('SELECT name, api_key, api_secret, is_default FROM accounts ORDER BY name')
      .all() as readonly AccountRow[];

    return Object.freeze(rows.map(rowToAccount));
  }

  add(input: AddAccountInput): void {
    const existing = this.getRaw(input.name);
    if (existing !== undefined) {
      throw new Error(`Account "${input.name}" already exists`);
    }

    const hasAny = this.db
      .prepare('SELECT COUNT(*) as count FROM accounts')
      .get() as { readonly count: number };

    const isDefault = hasAny.count === 0 ? 1 : 0;
    const encryptedSecret = encrypt(input.apiSecret);

    this.db
      .prepare(
        'INSERT INTO accounts (name, api_key, api_secret, is_default) VALUES (?, ?, ?, ?)'
      )
      .run(input.name, input.apiKey, encryptedSecret, isDefault);
  }

  remove(name: string): void {
    const result = this.db
      .prepare('DELETE FROM accounts WHERE name = ?')
      .run(name);

    if (result.changes === 0) {
      throw new Error(`Account "${name}" not found`);
    }
  }

  get(name: string): Account | undefined {
    const row = this.getRaw(name);

    if (row === undefined) {
      return undefined;
    }

    return rowToAccount(row);
  }

  getDefault(): Account | undefined {
    const row = this.db
      .prepare('SELECT name, api_key, api_secret, is_default FROM accounts WHERE is_default = 1')
      .get() as AccountRow | undefined;

    if (row === undefined) {
      return undefined;
    }

    return rowToAccount(row);
  }

  setDefault(name: string): void {
    const existing = this.get(name);
    if (existing === undefined) {
      throw new Error(`Account "${name}" not found`);
    }

    const setDefaultTx = this.db.transaction(() => {
      this.db.prepare('UPDATE accounts SET is_default = 0').run();
      this.db.prepare('UPDATE accounts SET is_default = 1 WHERE name = ?').run(name);
    });

    setDefaultTx();
  }

  close(): void {
    this.db.close();
  }

  private getRaw(name: string): AccountRow | undefined {
    return this.db
      .prepare('SELECT name, api_key, api_secret, is_default FROM accounts WHERE name = ?')
      .get(name) as AccountRow | undefined;
  }

  private migrateUnencryptedSecrets(): void {
    const rows = this.db
      .prepare('SELECT name, api_secret FROM accounts')
      .all() as readonly { readonly name: string; readonly api_secret: string }[];

    const updateStmt = this.db.prepare(
      'UPDATE accounts SET api_secret = ? WHERE name = ?'
    );

    const migrateTx = this.db.transaction(() => {
      for (const row of rows) {
        if (!isEncrypted(row.api_secret)) {
          updateStmt.run(encrypt(row.api_secret), row.name);
        }
      }
    });

    migrateTx();
  }
}
