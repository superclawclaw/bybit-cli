import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cancelOrder } from './cancel.js';

describe('cancelOrder', () => {
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

  it('cancels order successfully', async () => {
    const mockClient = {
      cancelOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: '' },
      }),
    };

    await cancelOrder(mockClient as never, {
      orderId: 'order123',
      coin: 'BTC',
      category: 'linear',
      jsonOutput: false,
    });

    expect(mockClient.cancelOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      orderId: 'order123',
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cancelled successfully'));
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      cancelOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: 'link123' },
      }),
    };

    await cancelOrder(mockClient as never, {
      orderId: 'order123',
      coin: 'BTC',
      category: 'linear',
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.orderId).toBe('order123');
  });

  it('handles API error response', async () => {
    const mockClient = {
      cancelOrder: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Order not found',
        result: { orderId: '', orderLinkId: '' },
      }),
    };

    await cancelOrder(mockClient as never, {
      orderId: 'invalid',
      coin: 'BTC',
      category: 'linear',
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Order not found'));
  });

  it('constructs symbol from coin for linear category', async () => {
    const mockClient = {
      cancelOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'o1', orderLinkId: '' },
      }),
    };

    await cancelOrder(mockClient as never, {
      orderId: 'o1',
      coin: 'ETH',
      category: 'linear',
      jsonOutput: false,
    });

    expect(mockClient.cancelOrder).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'ETHUSDT' }),
    );
  });
});
