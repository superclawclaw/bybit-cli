import { describe, it, expect } from 'vitest';
import { createCliContext } from './context.js';
import type { CliContext, ContextOptions } from './context.js';

describe('createCliContext', () => {
  it('creates context with default options', () => {
    const context = createCliContext({});

    expect(context.config.testnet).toBe(false);
    expect(context.config.category).toBe('linear');
    expect(context.restClient).toBeDefined();
  });

  it('creates context with testnet option', () => {
    const context = createCliContext({ testnet: true });

    expect(context.config.testnet).toBe(true);
    expect(context.restClient).toBeDefined();
  });

  it('creates context with account credentials', () => {
    const context = createCliContext({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      testnet: true,
    });

    expect(context.config.testnet).toBe(true);
    expect(context.restClient).toBeDefined();
  });

  it('passes config options through to getConfig', () => {
    const context = createCliContext({
      testnet: true,
      category: 'spot',
      account: 'my-account',
      json: true,
    });

    expect(context.config.testnet).toBe(true);
    expect(context.config.category).toBe('spot');
    expect(context.config.accountId).toBe('my-account');
    expect(context.config.jsonOutput).toBe(true);
  });

  it('returns an object with readonly config and restClient', () => {
    const context = createCliContext({});

    expect(context).toHaveProperty('config');
    expect(context).toHaveProperty('restClient');
    expect(Object.isFrozen(context.config)).toBe(true);
  });
});
