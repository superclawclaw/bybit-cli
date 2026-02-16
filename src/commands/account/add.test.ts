import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AccountStore } from '../../lib/db/accounts.js';
import { addAccount } from './add.js';

describe('addAccount', () => {
  let tempDir: string;
  let store: AccountStore;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bybit-cli-test-'));
    store = new AccountStore(tempDir);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    store.close();
    consoleSpy.mockRestore();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('adds account successfully', () => {
    addAccount(store, 'main', 'test-api-key', 'test-api-secret');

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('main');
    expect(output).toContain('added');

    // Verify the account was actually stored
    const accounts = store.list();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]!.name).toBe('main');
    expect(accounts[0]!.apiKey).toBe('test-api-key');
    expect(accounts[0]!.apiSecret).toBe('test-api-secret');
    expect(accounts[0]!.isDefault).toBe(true);

    // Verify the secret is NOT in the output
    expect(output).not.toContain('test-api-secret');
  });

  it('rejects duplicate name', () => {
    store.add({ name: 'main', apiKey: 'key-1', apiSecret: 'secret-1' });

    const consoleSpy2 = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    addAccount(store, 'main', 'key-2', 'secret-2');

    expect(consoleSpy2).toHaveBeenCalled();
    const errorOutput = consoleSpy2.mock.calls[0]?.[0] as string;
    expect(errorOutput).toContain('already exists');

    consoleSpy2.mockRestore();

    // Verify original account is unchanged
    const account = store.get('main');
    expect(account!.apiKey).toBe('key-1');
  });

  it('does not include apiSecret in success output', () => {
    addAccount(store, 'test-acct', 'my-key', 'my-very-secret-value');

    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(allOutput).not.toContain('my-very-secret-value');
  });
});
