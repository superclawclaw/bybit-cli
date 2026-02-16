import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTicker, fetchAndDisplayPrices, type TickerInfo } from './prices.js';

describe('formatTicker', () => {
  it('formats ticker row with positive change', () => {
    const ticker: TickerInfo = {
      symbol: 'BTCUSDT',
      lastPrice: '85000.50',
      price24hPcnt: '0.0235',
      volume24h: '1234567.89',
    };
    const row = formatTicker(ticker);
    expect(row).toEqual(['BTCUSDT', '85000.50', '+2.35%', '1,234,567.89']);
  });

  it('formats ticker row with negative change', () => {
    const ticker: TickerInfo = {
      symbol: 'ETHUSDT',
      lastPrice: '3200.00',
      price24hPcnt: '-0.05',
      volume24h: '500000.00',
    };
    const row = formatTicker(ticker);
    expect(row).toEqual(['ETHUSDT', '3200.00', '-5.00%', '500,000']);
  });

  it('formats ticker row with zero change', () => {
    const ticker: TickerInfo = {
      symbol: 'SOLUSDT',
      lastPrice: '150.00',
      price24hPcnt: '0',
      volume24h: '100000',
    };
    const row = formatTicker(ticker);
    expect(row).toEqual(['SOLUSDT', '150.00', '0.00%', '100,000']);
  });
});

describe('fetchAndDisplayPrices', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays prices in JSON format', async () => {
    const mockClient = {
      getTickers: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              lastPrice: '85000.50',
              price24hPcnt: '0.0235',
              volume24h: '1234567.89',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayPrices(mockClient as never, 'linear', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].symbol).toBe('BTCUSDT');
  });

  it('displays prices in table format', async () => {
    const mockClient = {
      getTickers: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              lastPrice: '85000.50',
              price24hPcnt: '0.0235',
              volume24h: '1234567.89',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayPrices(mockClient as never, 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BTCUSDT'));
  });

  it('handles API error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getTickers: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Server error',
        result: { list: [] },
      }),
    };

    await fetchAndDisplayPrices(mockClient as never, 'linear', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Server error'));
    errSpy.mockRestore();
  });
});
