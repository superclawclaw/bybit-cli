import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface OrderInfo {
  readonly orderId: string;
  readonly symbol: string;
  readonly side: string;
  readonly orderType: string;
  readonly price: string;
  readonly qty: string;
  readonly orderStatus: string;
  readonly createdTime: string;
}

const HEADERS = ['Order ID', 'Symbol', 'Side', 'Type', 'Price', 'Qty', 'Status', 'Created'] as const;

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

function formatTimestamp(ts: string): string {
  const num = Number(ts);
  if (Number.isNaN(num) || num === 0) return '-';
  return new Date(num).toISOString().replace('T', ' ').slice(0, 19);
}

export function formatOrder(order: OrderInfo): readonly string[] {
  return [
    shortId(order.orderId),
    order.symbol,
    order.side,
    order.orderType,
    order.price || '-',
    order.qty,
    order.orderStatus,
    formatTimestamp(order.createdTime),
  ];
}

export async function fetchAndDisplayOrders(
  client: RestClientV5,
  category: Category | string,
  jsonOutput: boolean,
): Promise<void> {
  const response = await client.getActiveOrders({
    category: category as 'linear' | 'inverse' | 'spot' | 'option',
    settleCoin: category === 'linear' ? 'USDT' : undefined,
  });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const allOrders = response.result.list ?? [];
  const orders: readonly OrderInfo[] = allOrders.map((o) => ({
    orderId: o.orderId,
    symbol: o.symbol,
    side: o.side,
    orderType: o.orderType,
    price: o.price,
    qty: o.qty,
    orderStatus: o.orderStatus,
    createdTime: o.createdTime,
  }));

  if (orders.length === 0) {
    console.log('No open orders.');
    return;
  }

  if (jsonOutput) {
    console.log(formatJson(orders));
    return;
  }

  const rows = orders.map(formatOrder);
  console.log(formatTable(HEADERS, rows));
}
