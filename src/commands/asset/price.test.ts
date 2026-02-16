import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatPrice, fetchAndDisplayPrice, type PriceInfo } from './price.js';

describe('formatPrice', () => {
  it('formats price info row', () => {
    const price: PriceInfo = {
      symbol: 'BTCUSDT',
      lastPrice: '85000.50',
      indexPrice: '84999.00',
      markPrice: '85001.25',
      price24hPcnt: '0.0235',
    };
    const row = formatPrice(price);
    expect(row).toEqual(['BTCUSDT', '85000.50', '84999.00', '85001.25', '+2.35%']);
  });

  it('formats price with negative change', () => {
    const price: PriceInfo = {
      symbol: 'ETHUSDT',
      lastPrice: '3200.00',
      indexPrice: '3199.50',
      markPrice: '3200.50',
      price24hPcnt: '-0.03',
    };
    const row = formatPrice(price);
    expect(row).toEqual(['ETHUSDT', '3200.00', '3199.50', '3200.50', '-3.00%']);
  });
});

describe('fetchAndDisplayPrice', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays price in JSON format', async () => {
    const mockClient = {
      getTickers: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              lastPrice: '85000.50',
              indexPrice: '84999.00',
              markPrice: '85001.25',
              price24hPcnt: '0.0235',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayPrice(mockClient as never, 'BTCUSDT', 'linear', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.symbol).toBe('BTCUSDT');
    expect(parsed.lastPrice).toBe('85000.50');
  });

  it('displays price in table format', async () => {
    const mockClient = {
      getTickers: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              lastPrice: '85000.50',
              indexPrice: '84999.00',
              markPrice: '85001.25',
              price24hPcnt: '0.0235',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayPrice(mockClient as never, 'BTCUSDT', 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BTCUSDT'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('85000.50'));
  });

  it('handles API error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getTickers: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Invalid symbol',
        result: { list: [] },
      }),
    };

    await fetchAndDisplayPrice(mockClient as never, 'INVALID', 'linear', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid symbol'));
    errSpy.mockRestore();
  });

  it('handles symbol not found', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getTickers: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
    };

    await fetchAndDisplayPrice(mockClient as never, 'FAKECOIN', 'linear', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    errSpy.mockRestore();
  });
});
