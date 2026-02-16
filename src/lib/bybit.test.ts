import { describe, it, expect } from 'vitest';
import { getBaseUrl, createRestClient, createWsClient } from './bybit.js';

describe('getBaseUrl', () => {
  it('returns mainnet URL when testnet is false', () => {
    expect(getBaseUrl(false)).toBe('https://api.bybit.com');
  });

  it('returns testnet URL when testnet is true', () => {
    expect(getBaseUrl(true)).toBe('https://api-testnet.bybit.com');
  });
});

describe('createRestClient', () => {
  it('creates instance with credentials', () => {
    const client = createRestClient({
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      testnet: true,
    });

    expect(client).toBeDefined();
  });

  it('creates instance without credentials', () => {
    const client = createRestClient({
      testnet: false,
    });

    expect(client).toBeDefined();
  });
});

describe('createWsClient', () => {
  it('creates instance with credentials', () => {
    const client = createWsClient({
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      testnet: true,
    });

    expect(client).toBeDefined();
  });

  it('creates instance without credentials', () => {
    const client = createWsClient({
      testnet: false,
    });

    expect(client).toBeDefined();
  });
});
