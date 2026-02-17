import { describe, it, expect } from 'vitest';
import {
  transformTickerUpdate,
  transformOrderbookUpdate,
  type TickerWatchData,
  type OrderbookWatchData,
} from './watch.js';

describe('transformTickerUpdate', () => {
  it('transforms ticker WS update into PriceInfo', () => {
    const prev: TickerWatchData = {
      symbol: 'BTCUSDT',
      lastPrice: '0',
      indexPrice: '0',
      markPrice: '0',
      price24hPcnt: '0',
    };
    const raw = {
      symbol: 'BTCUSDT',
      lastPrice: '86000',
      indexPrice: '85900',
      markPrice: '85950',
      price24hPcnt: '0.025',
    };
    const result = transformTickerUpdate(raw, prev);
    expect(result).toEqual({
      symbol: 'BTCUSDT',
      lastPrice: '86000',
      indexPrice: '85900',
      markPrice: '85950',
      price24hPcnt: '0.025',
    });
  });

  it('returns previous data on invalid update', () => {
    const prev: TickerWatchData = {
      symbol: 'BTCUSDT',
      lastPrice: '85000',
      indexPrice: '85000',
      markPrice: '85000',
      price24hPcnt: '0',
    };
    const result = transformTickerUpdate(null, prev);
    expect(result).toBe(prev);
  });

  it('handles partial updates by merging with previous', () => {
    const prev: TickerWatchData = {
      symbol: 'BTCUSDT',
      lastPrice: '85000',
      indexPrice: '85000',
      markPrice: '85000',
      price24hPcnt: '0.01',
    };
    const raw = {
      lastPrice: '86000',
    };
    const result = transformTickerUpdate(raw, prev);
    expect(result.lastPrice).toBe('86000');
    expect(result.symbol).toBe('BTCUSDT');
    expect(result.indexPrice).toBe('85000');
  });
});

describe('transformOrderbookUpdate', () => {
  it('transforms orderbook WS snapshot into BookLevel arrays', () => {
    const prev: OrderbookWatchData = { bids: [], asks: [] };
    const raw = {
      type: 'snapshot',
      b: [['85000', '1.5'], ['84999', '2.0']],
      a: [['85001', '0.8'], ['85002', '1.2']],
    };
    const result = transformOrderbookUpdate(raw, prev);
    expect(result.bids).toEqual([
      { price: '85000', size: '1.5' },
      { price: '84999', size: '2.0' },
    ]);
    expect(result.asks).toEqual([
      { price: '85001', size: '0.8' },
      { price: '85002', size: '1.2' },
    ]);
  });

  it('handles delta updates by replacing full book', () => {
    const prev: OrderbookWatchData = {
      bids: [{ price: '85000', size: '1.0' }],
      asks: [{ price: '85001', size: '0.5' }],
    };
    const raw = {
      type: 'delta',
      b: [['85000', '2.0'], ['84998', '3.0']],
      a: [['85001', '0.0'], ['85003', '1.0']],
    };
    const result = transformOrderbookUpdate(raw, prev);
    expect(result.bids).toEqual([
      { price: '85000', size: '2.0' },
      { price: '84998', size: '3.0' },
    ]);
    expect(result.asks).toEqual([
      { price: '85001', size: '0.0' },
      { price: '85003', size: '1.0' },
    ]);
  });

  it('returns previous data on invalid update', () => {
    const prev: OrderbookWatchData = {
      bids: [{ price: '85000', size: '1.0' }],
      asks: [],
    };
    const result = transformOrderbookUpdate('invalid', prev);
    expect(result).toBe(prev);
  });
});
