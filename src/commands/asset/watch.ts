import type { PriceInfo } from './price.js';
import type { BookLevel } from './book.js';

export type TickerWatchData = PriceInfo;

export interface OrderbookWatchData {
  readonly bids: readonly BookLevel[];
  readonly asks: readonly BookLevel[];
}

export function transformTickerUpdate(raw: unknown, prev: TickerWatchData): TickerWatchData {
  if (raw == null || typeof raw !== 'object') return prev;

  const data = raw as Record<string, unknown>;
  return {
    symbol: typeof data.symbol === 'string' ? data.symbol : prev.symbol,
    lastPrice: typeof data.lastPrice === 'string' ? data.lastPrice : prev.lastPrice,
    indexPrice: typeof data.indexPrice === 'string' ? data.indexPrice : prev.indexPrice,
    markPrice: typeof data.markPrice === 'string' ? data.markPrice : prev.markPrice,
    price24hPcnt: typeof data.price24hPcnt === 'string' ? data.price24hPcnt : prev.price24hPcnt,
  };
}

function parseBookLevels(raw: unknown): readonly BookLevel[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => Array.isArray(entry) && entry.length >= 2)
    .map(([price, size]: [string, string]) => ({ price, size }));
}

export function transformOrderbookUpdate(raw: unknown, prev: OrderbookWatchData): OrderbookWatchData {
  if (raw == null || typeof raw !== 'object') return prev;

  const data = raw as Record<string, unknown>;
  const bids = parseBookLevels(data.b);
  const asks = parseBookLevels(data.a);

  if (bids.length === 0 && asks.length === 0) return prev;

  return { bids, asks };
}
