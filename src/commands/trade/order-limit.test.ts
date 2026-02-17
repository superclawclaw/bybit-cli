import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatOrderResult, submitLimitOrder } from './order-limit.js';

describe('formatOrderResult', () => {
  it('formats successful order result', () => {
    const rows = formatOrderResult({
      orderId: 'abc123',
      orderLinkId: 'link456',
    });
    expect(rows).toEqual([
      ['Order ID', 'abc123'],
      ['Order Link ID', 'link456'],
    ]);
  });

  it('formats result with empty orderLinkId', () => {
    const rows = formatOrderResult({
      orderId: 'abc123',
      orderLinkId: '',
    });
    expect(rows[1][1]).toBe('-');
  });
});

describe('submitLimitOrder', () => {
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

  it('submits limit buy order successfully', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: '' },
      }),
    };

    await submitLimitOrder(mockClient as never, {
      side: 'Buy',
      qty: '0.001',
      coin: 'BTC',
      price: '85000',
      category: 'linear',
      timeInForce: 'GTC',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      side: 'Buy',
      orderType: 'Limit',
      qty: '0.001',
      price: '85000',
      timeInForce: 'GTC',
      reduceOnly: false,
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it('submits limit sell order with PostOnly TIF', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order456', orderLinkId: '' },
      }),
    };

    await submitLimitOrder(mockClient as never, {
      side: 'Sell',
      qty: '0.5',
      coin: 'ETH',
      price: '3200',
      category: 'linear',
      timeInForce: 'PostOnly',
      reduceOnly: true,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'ETHUSDT',
      side: 'Sell',
      orderType: 'Limit',
      qty: '0.5',
      price: '3200',
      timeInForce: 'PostOnly',
      reduceOnly: true,
    });
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order789', orderLinkId: 'link789' },
      }),
    };

    await submitLimitOrder(mockClient as never, {
      side: 'Buy',
      qty: '0.001',
      coin: 'BTC',
      price: '85000',
      category: 'linear',
      timeInForce: 'GTC',
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

    await submitLimitOrder(mockClient as never, {
      side: 'Buy',
      qty: '0.001',
      coin: 'BTC',
      price: '85000',
      category: 'linear',
      timeInForce: 'GTC',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Insufficient balance'));
  });

  it('appends USDT suffix to coin for linear category', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'o1', orderLinkId: '' },
      }),
    };

    await submitLimitOrder(mockClient as never, {
      side: 'Buy',
      qty: '1',
      coin: 'SOL',
      price: '100',
      category: 'linear',
      timeInForce: 'GTC',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'SOLUSDT' }),
    );
  });

  it('uses coin directly for spot category', async () => {
    const mockClient = {
      submitOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'o1', orderLinkId: '' },
      }),
    };

    await submitLimitOrder(mockClient as never, {
      side: 'Buy',
      qty: '1',
      coin: 'BTCUSDT',
      price: '85000',
      category: 'spot',
      timeInForce: 'GTC',
      reduceOnly: false,
      jsonOutput: false,
    });

    expect(mockClient.submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'BTCUSDT' }),
    );
  });
});
