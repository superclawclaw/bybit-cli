import { describe, it, expect } from 'vitest';
import { buildWsTopic } from './watch.js';

describe('buildWsTopic', () => {
  it('builds orderbook topic with depth', () => {
    expect(buildWsTopic('orderbook', 'BTCUSDT', 50)).toBe('orderbook.50.BTCUSDT');
  });

  it('builds orderbook topic with default depth', () => {
    expect(buildWsTopic('orderbook', 'ETHUSDT')).toBe('orderbook.50.ETHUSDT');
  });

  it('builds tickers topic', () => {
    expect(buildWsTopic('tickers', 'BTCUSDT')).toBe('tickers.BTCUSDT');
  });

  it('builds position topic (private)', () => {
    expect(buildWsTopic('position')).toBe('position');
  });

  it('builds order topic (private)', () => {
    expect(buildWsTopic('order')).toBe('order');
  });

  it('builds wallet topic (private)', () => {
    expect(buildWsTopic('wallet')).toBe('wallet');
  });
});
