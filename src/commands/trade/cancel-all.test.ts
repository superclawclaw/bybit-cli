import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cancelAllOrders } from './cancel-all.js';

describe('cancelAllOrders', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('cancels all orders for a specific coin', async () => {
    const mockClient = {
      cancelAllOrders: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: {
          list: [{ orderId: 'o1' }, { orderId: 'o2' }],
        },
      }),
    };

    await cancelAllOrders(mockClient as never, {
      coin: 'BTC',
      category: 'linear',
      jsonOutput: false,
    });

    expect(mockClient.cancelAllOrders).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('2 order(s)'));
  });

  it('cancels all orders without coin filter', async () => {
    const mockClient = {
      cancelAllOrders: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: {
          list: [{ orderId: 'o1' }],
        },
      }),
    };

    await cancelAllOrders(mockClient as never, {
      coin: undefined,
      category: 'linear',
      jsonOutput: false,
    });

    expect(mockClient.cancelAllOrders).toHaveBeenCalledWith({
      category: 'linear',
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('1 order(s)'));
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      cancelAllOrders: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: {
          list: [{ orderId: 'o1' }, { orderId: 'o2' }],
        },
      }),
    };

    await cancelAllOrders(mockClient as never, {
      coin: 'BTC',
      category: 'linear',
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.cancelled).toBe(2);
    expect(parsed.orders).toHaveLength(2);
  });

  it('handles no orders to cancel', async () => {
    const mockClient = {
      cancelAllOrders: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { list: [] },
      }),
    };

    await cancelAllOrders(mockClient as never, {
      coin: 'BTC',
      category: 'linear',
      jsonOutput: false,
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No orders to cancel'));
  });

  it('handles API error response', async () => {
    const mockClient = {
      cancelAllOrders: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Unauthorized',
        result: { list: [] },
      }),
    };

    await cancelAllOrders(mockClient as never, {
      coin: 'BTC',
      category: 'linear',
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Unauthorized'));
  });
});
