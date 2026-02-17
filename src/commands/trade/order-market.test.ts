import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitMarketOrder } from './order-market.js';

describe('submitMarketOrder', () => {
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

  it('submits market buy order successfully', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: '' },
      }),
    };

    await submitMarketOrder(mockClient as never, {
      side: 'Buy',
      qty: '0.001',
      coin: 'BTC',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      side: 'Buy',
      orderType: 'Market',
      qty: '0.001',
      timeInForce: 'GTC',
      reduceOnly: false,
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it('submits market sell order with reduce-only', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order456', orderLinkId: '' },
      }),
    };

    await submitMarketOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.5',
      coin: 'ETH',
      category: 'linear',
      reduceOnly: true,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ reduceOnly: true, side: 'Sell' }),
    );
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order789', orderLinkId: 'link789' },
      }),
    };

    await submitMarketOrder(mockClient as never, {
      side: 'Buy',
      qty: '0.001',
      coin: 'BTC',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.orderId).toBe('order789');
  });

  it('handles API error response', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Insufficient balance',
        result: { orderId: '', orderLinkId: '' },
      }),
    };

    await submitMarketOrder(mockClient as never, {
      side: 'Buy',
      qty: '100',
      coin: 'BTC',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Insufficient balance'));
  });

  it('does not include price for market orders', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'o1', orderLinkId: '' },
      }),
    };

    await submitMarketOrder(mockClient as never, {
      side: 'Buy',
      qty: '1',
      coin: 'SOL',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: false,
    });

    const callArgs = mockClient.submitOrder.mock.calls[0][0];
    expect(callArgs.price).toBeUndefined();
  });
});
