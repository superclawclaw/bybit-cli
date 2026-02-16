import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAndDisplayPortfolio } from './portfolio.js';

describe('fetchAndDisplayPortfolio', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays combined portfolio in JSON format', async () => {
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              accountType: 'UNIFIED',
              coin: [
                { coin: 'USDT', equity: '1000', availableToWithdraw: '800', unrealisedPnl: '50' },
              ],
            },
          ],
        },
      }),
      getPositionInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              side: 'Buy',
              size: '0.001',
              avgPrice: '85000',
              markPrice: '86000',
              unrealisedPnl: '1.00',
              leverage: '10',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayPortfolio(mockClient as never, 'UNIFIED', 'linear', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.balances).toHaveLength(1);
    expect(parsed.positions).toHaveLength(1);
    expect(parsed.balances[0].coin).toBe('USDT');
    expect(parsed.positions[0].symbol).toBe('BTCUSDT');
  });

  it('displays portfolio in table format', async () => {
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              accountType: 'UNIFIED',
              coin: [
                { coin: 'USDT', equity: '1000', availableToWithdraw: '800', unrealisedPnl: '0' },
              ],
            },
          ],
        },
      }),
      getPositionInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              side: 'Buy',
              size: '0.001',
              avgPrice: '85000',
              markPrice: '86000',
              unrealisedPnl: '1.00',
              leverage: '10',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayPortfolio(mockClient as never, 'UNIFIED', 'linear', false);
    const allOutput = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(allOutput).toContain('Balances');
    expect(allOutput).toContain('USDT');
    expect(allOutput).toContain('Positions');
    expect(allOutput).toContain('BTCUSDT');
  });

  it('handles empty portfolio', async () => {
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
      getPositionInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
    };

    await fetchAndDisplayPortfolio(mockClient as never, 'UNIFIED', 'linear', false);
    const allOutput = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(allOutput).toContain('No balances');
    expect(allOutput).toContain('No open positions');
  });

  it('handles API error on balances', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Auth failed',
        result: { list: [] },
      }),
      getPositionInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
    };

    await fetchAndDisplayPortfolio(mockClient as never, 'UNIFIED', 'linear', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Auth failed'));
    errSpy.mockRestore();
  });
});
