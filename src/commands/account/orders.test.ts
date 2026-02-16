import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatOrder, fetchAndDisplayOrders, type OrderInfo } from './orders.js';

describe('formatOrder', () => {
  it('formats limit order row', () => {
    const order: OrderInfo = {
      orderId: 'abc123',
      symbol: 'BTCUSDT',
      side: 'Buy',
      orderType: 'Limit',
      price: '85000',
      qty: '0.001',
      orderStatus: 'New',
      createdTime: '1700000000000',
    };
    const row = formatOrder(order);
    expect(row).toContain('abc123');
    expect(row).toContain('BTCUSDT');
    expect(row).toContain('Buy');
    expect(row).toContain('Limit');
    expect(row).toContain('85000');
    expect(row).toContain('0.001');
    expect(row).toContain('New');
  });

  it('formats market order row', () => {
    const order: OrderInfo = {
      orderId: 'def456',
      symbol: 'ETHUSDT',
      side: 'Sell',
      orderType: 'Market',
      price: '',
      qty: '0.1',
      orderStatus: 'Filled',
      createdTime: '1700000000000',
    };
    const row = formatOrder(order);
    expect(row).toContain('Market');
    expect(row).toContain('Sell');
  });

  it('formats order with short orderId for display', () => {
    const order: OrderInfo = {
      orderId: 'abcdefghijklmnop1234567890',
      symbol: 'BTCUSDT',
      side: 'Buy',
      orderType: 'Limit',
      price: '85000',
      qty: '0.001',
      orderStatus: 'New',
      createdTime: '1700000000000',
    };
    const row = formatOrder(order);
    expect(row[0].length).toBeLessThanOrEqual(12);
  });
});

describe('fetchAndDisplayOrders', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays orders in JSON format', async () => {
    const mockClient = {
      getActiveOrders: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              orderId: 'abc123',
              symbol: 'BTCUSDT',
              side: 'Buy',
              orderType: 'Limit',
              price: '85000',
              qty: '0.001',
              orderStatus: 'New',
              createdTime: '1700000000000',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayOrders(mockClient as never, 'linear', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].symbol).toBe('BTCUSDT');
  });

  it('displays orders in table format', async () => {
    const mockClient = {
      getActiveOrders: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              orderId: 'abc123',
              symbol: 'BTCUSDT',
              side: 'Buy',
              orderType: 'Limit',
              price: '85000',
              qty: '0.001',
              orderStatus: 'New',
              createdTime: '1700000000000',
            },
          ],
        },
      }),
    };

    await fetchAndDisplayOrders(mockClient as never, 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BTCUSDT'));
  });

  it('handles API error response', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getActiveOrders: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Invalid API key',
        result: { list: [] },
      }),
    };

    await fetchAndDisplayOrders(mockClient as never, 'linear', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid API key'));
    errSpy.mockRestore();
  });

  it('handles no open orders', async () => {
    const mockClient = {
      getActiveOrders: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
    };

    await fetchAndDisplayOrders(mockClient as never, 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No open orders'));
  });
});
