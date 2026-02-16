import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AccountStore } from '../../lib/db/accounts.js';
import { listAccounts } from './ls.js';

describe('listAccounts', () => {
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

  it('shows "no accounts" message when empty', () => {
    listAccounts(store, false);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('No accounts configured');
    expect(output).toContain('bb account add');
  });

  it('lists accounts in JSON format without apiSecret', () => {
    store.add({ name: 'main', apiKey: 'ABCD1234EFGH', apiSecret: 'super-secret' });

    listAccounts(store, true);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as readonly { name: string; apiKey: string; isDefault: boolean; apiSecret?: string }[];

    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.name).toBe('main');
    expect(parsed[0]!.apiKey).toBe('ABCD1234EFGH');
    expect(parsed[0]!.isDefault).toBe(true);
    // CRITICAL: apiSecret must never appear in output
    expect(output).not.toContain('super-secret');
    expect(parsed[0]).not.toHaveProperty('apiSecret');
  });

  it('lists accounts in table format with masked API key', () => {
    store.add({ name: 'main', apiKey: 'ABCD1234EFGH', apiSecret: 'super-secret' });

    listAccounts(store, false);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;

    expect(output).toContain('main');
    expect(output).toContain('ABCD****');
    // Must NOT show full API key
    expect(output).not.toContain('ABCD1234EFGH');
    // Must NOT show API secret
    expect(output).not.toContain('super-secret');
  });

  it('shows default indicator', () => {
    store.add({ name: 'account-a', apiKey: 'KEY1ABCDEF', apiSecret: 'secret-a' });
    store.add({ name: 'account-b', apiKey: 'KEY2ABCDEF', apiSecret: 'secret-b' });

    listAccounts(store, false);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;

    expect(output).toContain('account-a');
    expect(output).toContain('account-b');
    // The default indicator should appear (account-a is first so it's default)
    expect(output).toContain('*');
  });

  it('shows default indicator in JSON format', () => {
    store.add({ name: 'account-a', apiKey: 'KEY1ABCDEF', apiSecret: 'secret-a' });
    store.add({ name: 'account-b', apiKey: 'KEY2ABCDEF', apiSecret: 'secret-b' });

    listAccounts(store, true);

    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as readonly { name: string; apiKey: string; isDefault: boolean }[];

    expect(parsed).toHaveLength(2);
    const defaultAccount = parsed.find((a) => a.isDefault);
    expect(defaultAccount).toBeDefined();
    expect(defaultAccount!.name).toBe('account-a');

    const nonDefault = parsed.find((a) => !a.isDefault);
    expect(nonDefault).toBeDefined();
    expect(nonDefault!.name).toBe('account-b');
  });
});
