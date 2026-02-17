import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toSymbol, formatOrderResult, displayOrderResult } from './shared.js';

describe('toSymbol', () => {
  it('appends USDT for linear category', () => {
    expect(toSymbol('BTC', 'linear')).toBe('BTCUSDT');
  });

  it('appends USDT for inverse category', () => {
    expect(toSymbol('ETH', 'inverse')).toBe('ETHUSDT');
  });

  it('preserves symbol that already contains USDT', () => {
    expect(toSymbol('BTCUSDT', 'linear')).toBe('BTCUSDT');
  });

  it('preserves symbol for spot category', () => {
    expect(toSymbol('BTCUSDT', 'spot')).toBe('BTCUSDT');
  });

  it('preserves symbol containing USD', () => {
    expect(toSymbol('BTCUSD', 'inverse')).toBe('BTCUSD');
  });

  it('preserves PERP symbol', () => {
    expect(toSymbol('BTCPERP', 'linear')).toBe('BTCPERP');
  });

  it('uppercases input', () => {
    expect(toSymbol('btc', 'linear')).toBe('BTCUSDT');
  });
});

describe('formatOrderResult', () => {
  it('formats order result rows', () => {
    const rows = formatOrderResult({
      orderId: 'abc123',
      orderLinkId: 'link456',
    });
    expect(rows).toEqual([
      ['Order ID', 'abc123'],
      ['Order Link ID', 'link456'],
    ]);
  });

  it('shows dash for empty orderLinkId', () => {
    const rows = formatOrderResult({
      orderId: 'abc123',
      orderLinkId: '',
    });
    expect(rows[1][1]).toBe('-');
  });
});

describe('displayOrderResult', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('outputs JSON when jsonOutput is true', () => {
    displayOrderResult(
      { orderId: 'o1', orderLinkId: 'l1' },
      'Order placed',
      true,
    );
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.orderId).toBe('o1');
  });

  it('outputs table with label when jsonOutput is false', () => {
    displayOrderResult(
      { orderId: 'o1', orderLinkId: 'l1' },
      'Limit Buy order placed',
      false,
    );
    expect(logSpy.mock.calls[0][0]).toContain('Limit Buy order placed');
  });
});
