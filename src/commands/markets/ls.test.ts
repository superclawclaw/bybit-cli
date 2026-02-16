import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatInstrument, fetchAndDisplayInstruments, type InstrumentInfo } from './ls.js';

describe('formatInstrument', () => {
  it('formats instrument row', () => {
    const instrument: InstrumentInfo = {
      symbol: 'BTCUSDT',
      baseCoin: 'BTC',
      quoteCoin: 'USDT',
      status: 'Trading',
      maxLeverage: '100',
    };
    const row = formatInstrument(instrument);
    expect(row).toEqual(['BTCUSDT', 'BTC', 'USDT', 'Trading', '100x']);
  });

  it('formats instrument with low leverage', () => {
    const instrument: InstrumentInfo = {
      symbol: 'DOGEUSDT',
      baseCoin: 'DOGE',
      quoteCoin: 'USDT',
      status: 'Trading',
      maxLeverage: '25',
    };
    const row = formatInstrument(instrument);
    expect(row).toEqual(['DOGEUSDT', 'DOGE', 'USDT', 'Trading', '25x']);
  });
});

describe('fetchAndDisplayInstruments', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('displays instruments in JSON format', async () => {
    const mockClient = {
      getInstrumentsInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              baseCoin: 'BTC',
              quoteCoin: 'USDT',
              status: 'Trading',
              leverageFilter: { maxLeverage: '100' },
            },
          ],
        },
      }),
    };

    await fetchAndDisplayInstruments(mockClient as never, 'linear', true);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].symbol).toBe('BTCUSDT');
  });

  it('displays instruments in table format', async () => {
    const mockClient = {
      getInstrumentsInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              baseCoin: 'BTC',
              quoteCoin: 'USDT',
              status: 'Trading',
              leverageFilter: { maxLeverage: '100' },
            },
          ],
        },
      }),
    };

    await fetchAndDisplayInstruments(mockClient as never, 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BTCUSDT'));
  });

  it('handles API error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = {
      getInstrumentsInfo: vi.fn().mockResolvedValue({
        retCode: 10001,
        retMsg: 'Rate limit exceeded',
        result: { list: [] },
      }),
    };

    await fetchAndDisplayInstruments(mockClient as never, 'linear', false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Rate limit exceeded'));
    errSpy.mockRestore();
  });

  it('handles empty instrument list', async () => {
    const mockClient = {
      getInstrumentsInfo: vi.fn().mockResolvedValue({
        retCode: 0,
        result: { list: [] },
      }),
    };

    await fetchAndDisplayInstruments(mockClient as never, 'linear', false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No instruments'));
  });
});
