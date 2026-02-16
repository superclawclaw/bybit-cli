import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatBalance, fetchAndDisplayBalances, type WalletBalance } from './balances.js';

describe('formatBalance', () => {
  it('formats balance row for table output', () => {
    const balance: WalletBalance = {
      coin: 'USDT',
      equity: '1000.50',
      availableToWithdraw: '800.00',
      unrealisedPnl: '50.25',
    };
    const row = formatBalance(balance);
    expect(row).toEqual(['USDT', '1000.50', '800.00', '50.25']);
  });

  it('formats zero balance', () => {
    const balance: WalletBalance = {
      coin: 'BTC',
      equity: '0',
      availableToWithdraw: '0',
      unrealisedPnl: '0',
    };
    const row = formatBalance(balance);
    expect(row).toEqual(['BTC', '0', '0', '0']);
  });

  it('formats negative unrealised PnL', () => {
    const balance: WalletBalance = {
      coin: 'ETH',
      equity: '500.00',
      availableToWithdraw: '400.00',
      unrealisedPnl: '-25.50',
    };
    const row = formatBalance(balance);
    expect(row).toEqual(['ETH', '500.00', '400.00', '-25.50']);
  });
});

describe('fetchAndDisplayBalances', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays balances in JSON format', async () => {
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              accountType: 'UNIFIED',
              coin: [
                {
                  coin: 'USDT',
                  equity: '1000.50',
                  availableToWithdraw: '800.00',
                  unrealisedPnl: '50.25',
                },
                {
                  coin: 'BTC',
                  equity: '0.5',
                  availableToWithdraw: '0.4',
                  unrealisedPnl: '0.01',
                },
              ],
            },
          ],
        },
      }),
    };

    await fetchAndDisplayBalances(mockClient as never, 'UNIFIED', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].coin).toBe('USDT');
    expect(parsed[1].coin).toBe('BTC');
  });

  it('displays balances in table format', async () => {
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              accountType: 'UNIFIED',
              coin: [
                {
                  coin: 'USDT',
                  equity: '1000.50',
                  availableToWithdraw: '800.00',
                  unrealisedPnl: '50.25',
                },
              ],
            },
          ],
        },
      }),
    };

    await fetchAndDisplayBalances(mockClient as never, 'UNIFIED', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('USDT'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('1000.50'));
  });

  it('handles API error response', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Invalid API key',
        result: { list: [] },
      }),
    };

    await fetchAndDisplayBalances(mockClient as never, 'UNIFIED', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid API key'));
    errSpy.mockRestore();
  });

  it('handles empty balance list', async () => {
    const mockClient = {
      getWalletBalance: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
    };

    await fetchAndDisplayBalances(mockClient as never, 'UNIFIED', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No balances'));
  });
});
