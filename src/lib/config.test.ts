import { describe, it, expect } from 'vitest';
import { getConfig } from './config.js';
import type { CliConfig, ConfigOptions } from './config.js';

describe('getConfig', () => {
  it('returns default config when no options provided', () => {
    const config = getConfig({});

    expect(config.testnet).toBe(false);
    expect(config.category).toBe('linear');
    expect(config.dataDir).toContain('.bybit-cli');
    expect(config.accountId).toBeUndefined();
    expect(config.jsonOutput).toBe(false);
  });

  it('returns testnet config when testnet flag is true', () => {
    const config = getConfig({ testnet: true });

    expect(config.testnet).toBe(true);
  });

  it('respects category override', () => {
    const config = getConfig({ category: 'spot' });
    expect(config.category).toBe('spot');

    const config2 = getConfig({ category: 'inverse' });
    expect(config2.category).toBe('inverse');

    const config3 = getConfig({ category: 'option' });
    expect(config3.category).toBe('option');
  });

  it('respects json flag', () => {
    const config = getConfig({ json: true });

    expect(config.jsonOutput).toBe(true);
  });

  it('respects account override', () => {
    const config = getConfig({ account: 'my-account-id' });

    expect(config.accountId).toBe('my-account-id');
  });

  it('returns immutable config object', () => {
    const config = getConfig({});

    expect(Object.isFrozen(config)).toBe(true);
  });

  it('uses dataDir based on home directory', () => {
    const config = getConfig({});
    const homedir = process.env['HOME'] ?? '';

    expect(config.dataDir).toBe(`${homedir}/.bybit-cli`);
  });
});
