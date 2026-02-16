import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatBookLevel, fetchAndDisplayBook, type BookLevel } from './book.js';

describe('formatBookLevel', () => {
  it('formats bid level', () => {
    const level: BookLevel = { price: '85000', size: '1.5' };
    const row = formatBookLevel(level, 'bid');
    expect(row).toEqual(['85000', '1.5', 'BID']);
  });

  it('formats ask level', () => {
    const level: BookLevel = { price: '85001', size: '2.0' };
    const row = formatBookLevel(level, 'ask');
    expect(row).toEqual(['85001', '2.0', 'ASK']);
  });
});

describe('fetchAndDisplayBook', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays order book in JSON format', async () => {
    const mockClient = {
      getOrderbook: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          s: 'BTCUSDT',
          b: [['85000', '1.5'], ['84999', '2.0']],
          a: [['85001', '0.8'], ['85002', '1.2']],
          ts: 1700000000000,
          u: 12345,
        },
      }),
    };

    await fetchAndDisplayBook(mockClient as never, 'BTCUSDT', 'linear', true, 25);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.symbol).toBe('BTCUSDT');
    expect(parsed.bids).toHaveLength(2);
    expect(parsed.asks).toHaveLength(2);
  });

  it('displays order book in table format', async () => {
    const mockClient = {
      getOrderbook: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          s: 'BTCUSDT',
          b: [['85000', '1.5']],
          a: [['85001', '0.8']],
          ts: 1700000000000,
          u: 12345,
        },
      }),
    };

    await fetchAndDisplayBook(mockClient as never, 'BTCUSDT', 'linear', false, 25);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('85000'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('85001'));
  });

  it('handles API error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getOrderbook: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Invalid symbol',
        result: {},
      }),
    };

    await fetchAndDisplayBook(mockClient as never, 'INVALID', 'linear', false, 25);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid symbol'));
    errSpy.mockRestore();
  });
});
