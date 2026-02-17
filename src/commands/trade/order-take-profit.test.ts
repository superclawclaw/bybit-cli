import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitTakeProfitOrder } from './order-take-profit.js';

describe('submitTakeProfitOrder', () => {
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

  it('submits take-profit sell order with correct trigger direction', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'tp1', orderLinkId: '' },
      }),
    };

    await submitTakeProfitOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.001',
      coin: 'BTC',
      price: '55000',
      triggerPrice: '54000',
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
      price: '55000',
      triggerPrice: '54000',
      triggerDirection: 1,
      timeInForce: 'GTC',
      reduceOnly: false,
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it('submits take-profit buy order with trigger direction 2', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'tp2', orderLinkId: '' },
      }),
    };

    await submitTakeProfitOrder(mockClient as never, {
      side: 'Buy',
      qty: '0.1',
      coin: 'ETH',
      price: '2800',
      triggerPrice: '2900',
      category: 'linear',
      reduceOnly: true,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ triggerDirection: 2, reduceOnly: true }),
    );
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'tp3', orderLinkId: 'link3' },
      }),
    };

    await submitTakeProfitOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.001',
      coin: 'BTC',
      price: '55000',
      triggerPrice: '54000',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.orderId).toBe('tp3');
  });

  it('handles API error response', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Invalid trigger price',
        result: { orderId: '', orderLinkId: '' },
      }),
    };

    await submitTakeProfitOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.001',
      coin: 'BTC',
      price: '55000',
      triggerPrice: '54000',
      category: 'linear',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid trigger price'));
  });
});
