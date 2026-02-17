import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AccountStore } from '../../lib/db/accounts.js';
import { addAccount, testConnectivity } from './add.js';

vi.mock('../../lib/bybit.js', () => ({
  createRestClient: vi.fn(),
}));

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

describe('testConnectivity', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success when API call succeeds', async () => {
    const { createRestClient } = await import('../../lib/bybit.js');
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({ retCode: 0, retMsg: 'OK' }),
    };
    vi.mocked(createRestClient).mockReturnValue(mockClient as never);

    const result = await testConnectivity('key', 'secret', false);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns failure when API returns error code', async () => {
    const { createRestClient } = await import('../../lib/bybit.js');
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({ retCode: 10003, retMsg: 'Invalid API key' }),
    };
    vi.mocked(createRestClient).mockReturnValue(mockClient as never);

    const result = await testConnectivity('bad-key', 'bad-secret', false);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('returns failure when API call throws', async () => {
    const { createRestClient } = await import('../../lib/bybit.js');
    const mockClient = {
      getWalletBalance: vi.fn().mockRejectedValue(new Error('Network error')),
    };
    vi.mocked(createRestClient).mockReturnValue(mockClient as never);

    const result = await testConnectivity('key', 'secret', true);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('passes testnet flag to createRestClient', async () => {
    const { createRestClient } = await import('../../lib/bybit.js');
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({ retCode: 0, retMsg: 'OK' }),
    };
    vi.mocked(createRestClient).mockReturnValue(mockClient as never);

    await testConnectivity('key', 'secret', true);

    expect(createRestClient).toHaveBeenCalledWith({
      apiKey: 'key',
      apiSecret: 'secret',
      testnet: true,
    });
  });
});
