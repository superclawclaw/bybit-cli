import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatPosition, fetchAndDisplayPositions, type PositionInfo } from './positions.js';

describe('formatPosition', () => {
  it('formats long position row', () => {
    const pos: PositionInfo = {
      symbol: 'BTCUSDT',
      side: 'Buy',
      size: '0.001',
      entryPrice: '85000',
      markPrice: '86000',
      unrealisedPnl: '1.00',
      leverage: '10',
    };
    const row = formatPosition(pos);
    expect(row).toEqual(['BTCUSDT', 'Buy', '0.001', '85000', '86000', '1.00', '10x']);
  });

  it('formats short position', () => {
    const pos: PositionInfo = {
      symbol: 'ETHUSDT',
      side: 'Sell',
      size: '0.1',
      entryPrice: '3200',
      markPrice: '3150',
      unrealisedPnl: '5.00',
      leverage: '5',
    };
    const row = formatPosition(pos);
    expect(row).toEqual(['ETHUSDT', 'Sell', '0.1', '3200', '3150', '5.00', '5x']);
  });

  it('formats zero PnL position', () => {
    const pos: PositionInfo = {
      symbol: 'SOLUSDT',
      side: 'Buy',
      size: '10',
      entryPrice: '150',
      markPrice: '150',
      unrealisedPnl: '0',
      leverage: '20',
    };
    const row = formatPosition(pos);
    expect(row).toEqual(['SOLUSDT', 'Buy', '10', '150', '150', '0', '20x']);
  });
});

describe('fetchAndDisplayPositions', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays positions in JSON format', async () => {
    const mockClient = {
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

    await fetchAndDisplayPositions(mockClient as never, 'linear', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].symbol).toBe('BTCUSDT');
  });

  it('displays positions in table format', async () => {
    const mockClient = {
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

    await fetchAndDisplayPositions(mockClient as never, 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BTCUSDT'));
  });

  it('handles API error response', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getPositionInfo: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Unauthorized',
        result: { list: [] },
      }),
    };

    await fetchAndDisplayPositions(mockClient as never, 'linear', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Unauthorized'));
    errSpy.mockRestore();
  });

  it('handles no open positions', async () => {
    const mockClient = {
      getPositionInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
    };

    await fetchAndDisplayPositions(mockClient as never, 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No open positions'));
  });

  it('filters out zero-size positions', async () => {
    const mockClient = {
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
            {
              symbol: 'ETHUSDT',
              side: 'None',
              size: '0',
              avgPrice: '0',
              markPrice: '3200',
              unrealisedPnl: '0',
              leverage: '10',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayPositions(mockClient as never, 'linear', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].symbol).toBe('BTCUSDT');
  });
});
