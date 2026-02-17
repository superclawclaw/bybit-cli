import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildWatchConfig, type WatchConfig } from './WatchApp.js';

describe('buildWatchConfig', () => {
  it('builds config for wallet topic', () => {
    const config = buildWatchConfig({
      topicType: 'wallet',
      isPrivate: true,
    });
    expect(config).toEqual({
      topic: 'wallet',
      isPrivate: true,
    });
  });

  it('builds config for position topic', () => {
    const config = buildWatchConfig({
      topicType: 'position',
      isPrivate: true,
    });
    expect(config).toEqual({
      topic: 'position',
      isPrivate: true,
    });
  });

  it('builds config for order topic', () => {
    const config = buildWatchConfig({
      topicType: 'order',
      isPrivate: true,
    });
    expect(config).toEqual({
      topic: 'order',
      isPrivate: true,
    });
  });

  it('builds config for tickers topic with symbol', () => {
    const config = buildWatchConfig({
      topicType: 'tickers',
      symbol: 'BTCUSDT',
      isPrivate: false,
    });
    expect(config).toEqual({
      topic: 'tickers.BTCUSDT',
      isPrivate: false,
    });
  });

  it('builds config for orderbook topic with symbol and depth', () => {
    const config = buildWatchConfig({
      topicType: 'orderbook',
      symbol: 'BTCUSDT',
      depth: 50,
      isPrivate: false,
    });
    expect(config).toEqual({
      topic: 'orderbook.50.BTCUSDT',
      isPrivate: false,
    });
  });

  it('defaults orderbook depth to 50', () => {
    const config = buildWatchConfig({
      topicType: 'orderbook',
      symbol: 'ETHUSDT',
      isPrivate: false,
    });
    expect(config).toEqual({
      topic: 'orderbook.50.ETHUSDT',
      isPrivate: false,
    });
  });
});
