import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DB_FILENAME = 'accounts.db';

export function createDatabase(dataDir: string): Database.Database {
  mkdirSync(dataDir, { recursive: true });

  const dbPath = join(dataDir, DB_FILENAME);
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}
