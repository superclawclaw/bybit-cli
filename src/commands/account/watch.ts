import type { WalletBalance } from './balances.js';
import type { PositionInfo } from './positions.js';
import type { OrderInfo } from './orders.js';

export type WalletWatchData = readonly WalletBalance[];
export type PositionWatchData = readonly PositionInfo[];
export type OrderWatchData = readonly OrderInfo[];

const TERMINAL_ORDER_STATUSES = new Set(['Filled', 'Cancelled', 'Rejected', 'Deactivated']);

export function transformWalletUpdate(raw: unknown, prev: WalletWatchData): WalletWatchData {
  if (!Array.isArray(raw)) return prev;

  const balances: WalletBalance[] = [];
  for (const acct of raw) {
    const coins = acct?.coin;
    if (!Array.isArray(coins)) continue;
    for (const c of coins) {
      balances.push({
        coin: c.coin ?? '',
        equity: c.equity ?? '0',
        availableToWithdraw: c.availableToWithdraw ?? '0',
        unrealisedPnl: c.unrealisedPnl ?? '0',
      });
    }
  }
  return balances;
}

export function transformPositionUpdate(raw: unknown, prev: PositionWatchData): PositionWatchData {
  if (!Array.isArray(raw)) return prev;

  return raw
    .filter((p) => p?.size !== '0' && p?.size !== '' && p?.size != null)
    .map((p) => ({
      symbol: p.symbol ?? '',
      side: p.side ?? '',
      size: p.size ?? '0',
      entryPrice: p.avgPrice ?? '0',
      markPrice: p.markPrice ?? '0',
      unrealisedPnl: p.unrealisedPnl ?? '0',
      leverage: p.leverage ?? '0',
    }));
}

export function transformOrderUpdate(raw: unknown, prev: OrderWatchData): OrderWatchData {
  if (!Array.isArray(raw)) return prev;

  const incoming: OrderInfo[] = raw.map((o) => ({
    orderId: o.orderId ?? '',
    symbol: o.symbol ?? '',
    side: o.side ?? '',
    orderType: o.orderType ?? '',
    price: o.price ?? '',
    qty: o.qty ?? '0',
    orderStatus: o.orderStatus ?? '',
    createdTime: o.createdTime ?? '',
  }));

  // Merge: replace matching orders, keep untouched ones
  const updatedIds = new Set(incoming.map((o) => o.orderId));
  const kept = prev.filter((o) => !updatedIds.has(o.orderId));
  const merged = [...kept, ...incoming];

  // Remove terminal status orders
  return merged.filter((o) => !TERMINAL_ORDER_STATUSES.has(o.orderStatus));
}
