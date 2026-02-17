import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { amendOrder } from './amend.js';

describe('amendOrder', () => {
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

  it('amends order price successfully', async () => {
    const mockClient = {
      amendOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: '' },
      }),
    };

    await amendOrder(mockClient as never, {
      orderId: 'order123',
      coin: 'BTC',
      category: 'linear',
      price: '86000',
      qty: undefined,
      jsonOutput: false,
    });

    expect(mockClient.amendOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      orderId: 'order123',
      price: '86000',
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('amended successfully'));
  });

  it('amends order qty successfully', async () => {
    const mockClient = {
      amendOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: '' },
      }),
    };

    await amendOrder(mockClient as never, {
      orderId: 'order123',
      coin: 'BTC',
      category: 'linear',
      price: undefined,
      qty: '0.002',
      jsonOutput: false,
    });

    expect(mockClient.amendOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      orderId: 'order123',
      qty: '0.002',
    });
  });

  it('amends both price and qty', async () => {
    const mockClient = {
      amendOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: '' },
      }),
    };

    await amendOrder(mockClient as never, {
      orderId: 'order123',
      coin: 'BTC',
      category: 'linear',
      price: '86000',
      qty: '0.002',
      jsonOutput: false,
    });

    expect(mockClient.amendOrder).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      orderId: 'order123',
      price: '86000',
      qty: '0.002',
    });
  });

  it('errors when neither price nor qty specified', async () => {
    const mockClient = {
      amendOrder: vi.fn(),
    };

    await amendOrder(mockClient as never, {
      orderId: 'order123',
      coin: 'BTC',
      category: 'linear',
      price: undefined,
      qty: undefined,
      jsonOutput: false,
    });

    expect(mockClient.amendOrder).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('--price or --qty'));
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      amendOrder: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: { orderId: 'order123', orderLinkId: 'link123' },
      }),
    };

    await amendOrder(mockClient as never, {
      orderId: 'order123',
      coin: 'BTC',
      category: 'linear',
      price: '86000',
      qty: undefined,
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.orderId).toBe('order123');
  });

  it('handles API error response', async () => {
    const mockClient = {
      amendOrder: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Order not found',
        result: { orderId: '', orderLinkId: '' },
      }),
    };

    await amendOrder(mockClient as never, {
      orderId: 'invalid',
      coin: 'BTC',
      category: 'linear',
      price: '86000',
      qty: undefined,
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Order not found'));
  });
});
