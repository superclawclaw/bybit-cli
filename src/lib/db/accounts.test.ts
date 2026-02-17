import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { AccountStore } from './accounts.js';
import type { Account, AddAccountInput } from './accounts.js';
import { isEncrypted } from '../crypto.js';

describe('AccountStore', () => {
  let tempDir: string;
  let store: AccountStore;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bybit-cli-test-'));
    store = new AccountStore(tempDir);
  });

  afterEach(() => {
    store.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('starts with empty account list', () => {
    const accounts = store.list();

    expect(accounts).toEqual([]);
    expect(accounts).toHaveLength(0);
  });

  it('adds an account', () => {
    const input: AddAccountInput = {
      name: 'main',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
    };

    store.add(input);
    const accounts = store.list();

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toEqual({
      name: 'main',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      isDefault: true,
    });
  });

  it('prevents duplicate names', () => {
    store.add({
      name: 'main',
      apiKey: 'key-1',
      apiSecret: 'secret-1',
    });

    expect(() =>
      store.add({
        name: 'main',
        apiKey: 'key-2',
        apiSecret: 'secret-2',
      })
    ).toThrow('Account "main" already exists');
  });

  it('removes an account', () => {
    store.add({
      name: 'main',
      apiKey: 'key-1',
      apiSecret: 'secret-1',
    });

    store.remove('main');
    const accounts = store.list();

    expect(accounts).toHaveLength(0);
  });

  it('throws when removing non-existent account', () => {
    expect(() => store.remove('ghost')).toThrow('Account "ghost" not found');
  });

  it('sets and gets default account', () => {
    store.add({
      name: 'account-a',
      apiKey: 'key-a',
      apiSecret: 'secret-a',
    });
    store.add({
      name: 'account-b',
      apiKey: 'key-b',
      apiSecret: 'secret-b',
    });

    // First added should be default
    expect(store.getDefault()?.name).toBe('account-a');

    // Set second as default
    store.setDefault('account-b');

    const defaultAccount = store.getDefault();
    expect(defaultAccount).toBeDefined();
    expect(defaultAccount!.name).toBe('account-b');
    expect(defaultAccount!.isDefault).toBe(true);

    // Previous default should no longer be default
    const accountA = store.get('account-a');
    expect(accountA!.isDefault).toBe(false);
  });

  it('first added account becomes default', () => {
    store.add({
      name: 'first',
      apiKey: 'key-1',
      apiSecret: 'secret-1',
    });

    const account = store.get('first');
    expect(account!.isDefault).toBe(true);

    // Second account should not be default
    store.add({
      name: 'second',
      apiKey: 'key-2',
      apiSecret: 'secret-2',
    });

    const second = store.get('second');
    expect(second!.isDefault).toBe(false);

    // First should still be default
    const first = store.get('first');
    expect(first!.isDefault).toBe(true);
  });

  it('gets account by name', () => {
    store.add({
      name: 'my-account',
      apiKey: 'my-key',
      apiSecret: 'my-secret',
    });

    const account = store.get('my-account');

    expect(account).toBeDefined();
    expect(account).toEqual({
      name: 'my-account',
      apiKey: 'my-key',
      apiSecret: 'my-secret',
      isDefault: true,
    });
  });

  it('returns undefined for non-existent account', () => {
    const account = store.get('does-not-exist');

    expect(account).toBeUndefined();
  });

  it('throws when setting default to non-existent account', () => {
    expect(() => store.setDefault('ghost')).toThrow('Account "ghost" not found');
  });

  it('returns undefined when no default account exists', () => {
    const defaultAccount = store.getDefault();

    expect(defaultAccount).toBeUndefined();
  });

  it('lists accounts ordered by name', () => {
    store.add({ name: 'charlie', apiKey: 'k3', apiSecret: 's3' });
    store.add({ name: 'alice', apiKey: 'k1', apiSecret: 's1' });
    store.add({ name: 'bob', apiKey: 'k2', apiSecret: 's2' });

    const accounts = store.list();

    expect(accounts.map((a) => a.name)).toEqual(['alice', 'bob', 'charlie']);
  });

  it('returns readonly account list', () => {
    store.add({ name: 'test', apiKey: 'k', apiSecret: 's' });

    const accounts = store.list();

    expect(Object.isFrozen(accounts)).toBe(true);
  });

  describe('encryption', () => {
    it('stores api_secret encrypted in the database', () => {
      store.add({ name: 'enc-test', apiKey: 'key-1', apiSecret: 'my-secret' });

      // Read raw row from DB to verify encryption
      const dbPath = join(tempDir, 'accounts.db');
      const rawDb = new Database(dbPath, { readonly: true });
      const row = rawDb.prepare('SELECT api_secret FROM accounts WHERE name = ?').get('enc-test') as { api_secret: string };
      rawDb.close();

      expect(isEncrypted(row.api_secret)).toBe(true);
      expect(row.api_secret).not.toBe('my-secret');
    });

    it('decrypts api_secret transparently on read', () => {
      store.add({ name: 'dec-test', apiKey: 'key-1', apiSecret: 'transparent-secret' });

      const account = store.get('dec-test');
      expect(account!.apiSecret).toBe('transparent-secret');
    });

    it('decrypts api_secret in list()', () => {
      store.add({ name: 'list-test', apiKey: 'k1', apiSecret: 'list-secret' });

      const accounts = store.list();
      expect(accounts[0]!.apiSecret).toBe('list-secret');
    });

    it('decrypts api_secret in getDefault()', () => {
      store.add({ name: 'default-test', apiKey: 'k1', apiSecret: 'default-secret' });

      const account = store.getDefault();
      expect(account!.apiSecret).toBe('default-secret');
    });

    it('auto-migrates unencrypted secrets on startup', () => {
      // Insert a plaintext secret directly into DB
      const dbPath = join(tempDir, 'accounts.db');
      const rawDb = new Database(dbPath);
      rawDb.prepare('INSERT INTO accounts (name, api_key, api_secret, is_default) VALUES (?, ?, ?, ?)').run('legacy', 'old-key', 'plaintext-secret', 1);
      rawDb.close();

      // Re-open store which triggers migration
      store.close();
      store = new AccountStore(tempDir);

      // Verify the secret is now encrypted in raw DB
      const rawDb2 = new Database(dbPath, { readonly: true });
      const row = rawDb2.prepare('SELECT api_secret FROM accounts WHERE name = ?').get('legacy') as { api_secret: string };
      rawDb2.close();

      expect(isEncrypted(row.api_secret)).toBe(true);

      // Verify it decrypts correctly
      const account = store.get('legacy');
      expect(account!.apiSecret).toBe('plaintext-secret');
    });

    it('does not re-encrypt already encrypted secrets during migration', () => {
      store.add({ name: 'already-enc', apiKey: 'k1', apiSecret: 'enc-secret' });

      // Read the encrypted value
      const dbPath = join(tempDir, 'accounts.db');
      const rawDb = new Database(dbPath, { readonly: true });
      const before = rawDb.prepare('SELECT api_secret FROM accounts WHERE name = ?').get('already-enc') as { api_secret: string };
      rawDb.close();

      // Re-open store (triggers migration)
      store.close();
      store = new AccountStore(tempDir);

      // Read again - should be unchanged
      const rawDb2 = new Database(dbPath, { readonly: true });
      const after = rawDb2.prepare('SELECT api_secret FROM accounts WHERE name = ?').get('already-enc') as { api_secret: string };
      rawDb2.close();

      expect(after.api_secret).toBe(before.api_secret);
    });
  });
});
