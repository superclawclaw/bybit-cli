import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setLeverage } from './set-leverage.js';

describe('setLeverage', () => {
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

  it('sets leverage successfully', async () => {
    const mockClient = {
      setLeverage: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: {},
      }),
    };

    await setLeverage(mockClient as never, {
      coin: 'BTC',
      leverage: '10',
      category: 'linear',
      jsonOutput: false,
    });

    expect(mockClient.setLeverage).toHaveBeenCalledWith({
      category: 'linear',
      symbol: 'BTCUSDT',
      buyLeverage: '10',
      sellLeverage: '10',
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('10x'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BTCUSDT'));
  });

  it('outputs JSON when jsonOutput is true', async () => {
    const mockClient = {
      setLeverage: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: {},
      }),
    };

    await setLeverage(mockClient as never, {
      coin: 'ETH',
      leverage: '20',
      category: 'linear',
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.symbol).toBe('ETHUSDT');
    expect(parsed.leverage).toBe('20');
  });

  it('handles leverage already set (retCode 110043)', async () => {
    const mockClient = {
      setLeverage: vi.fn().mockResolvedValue({
        retCode: 110043,
        retMsg: 'Set leverage not modified',
        result: {},
      }),
    };

    await setLeverage(mockClient as never, {
      coin: 'BTC',
      leverage: '10',
      category: 'linear',
      jsonOutput: false,
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('already set'));
    expect(errSpy).not.toHaveBeenCalled();
  });

  it('handles leverage already set with JSON output', async () => {
    const mockClient = {
      setLeverage: vi.fn().mockResolvedValue({
        retCode: 110043,
        retMsg: 'Set leverage not modified',
        result: {},
      }),
    };

    await setLeverage(mockClient as never, {
      coin: 'BTC',
      leverage: '10',
      category: 'linear',
      jsonOutput: true,
    });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.message).toContain('already set');
  });

  it('handles API error response', async () => {
    const mockClient = {
      setLeverage: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Invalid leverage',
        result: {},
      }),
    };

    await setLeverage(mockClient as never, {
      coin: 'BTC',
      leverage: '999',
      category: 'linear',
      jsonOutput: false,
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid leverage'));
  });

  it('sets same leverage for buy and sell', async () => {
    const mockClient = {
      setLeverage: vi.fn().mockResolvedValue({
        retCode: 0,
        retMsg: 'OK',
        result: {},
      }),
    };

    await setLeverage(mockClient as never, {
      coin: 'BTC',
      leverage: '5',
      category: 'linear',
      jsonOutput: false,
    });

    expect(mockClient.setLeverage).toHaveBeenCalledWith(
      expect.objectContaining({
        buyLeverage: '5',
        sellLeverage: '5',
      }),
    );
  });
});
