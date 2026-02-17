import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitStopLossOrder } from './order-stop-loss.js';

describe('submitStopLossOrder', () => {
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

  it('submits stop-loss sell order with correct trigger direction', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'sl1', orderLinkId: '' },
      }),
    };

    await submitStopLossOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.001',
      coin: 'BTC',
      price: '48000',
      triggerPrice: '49000',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      side: 'Sell',
      orderType: 'Limit',
      qty: '0.001',
      price: '48000',
      triggerPrice: '49000',
      triggerDirection: 2,
      timeInForce: 'GTC',
      reduceOnly: false,
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it('submits stop-loss buy order with trigger direction 1', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'sl2', orderLinkId: '' },
      }),
    };

    await submitStopLossOrder(mockClient as never, {
      side: 'Buy',
      qty: '0.1',
      coin: 'ETH',
      price: '3500',
      triggerPrice: '3400',
      category: 'linear',
      reduceOnly: true,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ triggerDirection: 1, reduceOnly: true }),
    );
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'sl3', orderLinkId: 'link3' },
      }),
    };

    await submitStopLossOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.001',
      coin: 'BTC',
      price: '48000',
      triggerPrice: '49000',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.orderId).toBe('sl3');
  });

  it('handles API error response', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Invalid trigger price',
        result: { orderId: '', orderLinkId: '' },
      }),
    };

    await submitStopLossOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.001',
      coin: 'BTC',
      price: '48000',
      triggerPrice: '49000',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid trigger price'));
  });
});
