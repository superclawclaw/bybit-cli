import type { RestClientV5 } from 'bybit-api';
import { formatJson } from '../../cli/output.js';
import { toSymbol } from './shared.js';

export interface CancelAllOrdersParams {
  readonly coin: string | undefined;
  readonly category: string;
  readonly jsonOutput: boolean;
}

export interface CancelAllResult {
  readonly success: boolean;
  readonly list: readonly { readonly orderId: string }[];
}

export async function cancelAllOrders(
  client: RestClientV5,
  params: CancelAllOrdersParams,
): Promise<void> {
  const requestParams: { category: 'linear'; symbol?: string; settleCoin?: string } = {
    category: params.category as 'linear',
  };

  if (params.coin) {
    requestParams.symbol = toSymbol(params.coin, params.category);
  } else if (params.category === 'linear') {
    requestParams.settleCoin = 'USDT';
  }

  const response = await client.cancelAllOrders(requestParams);

  if (response.retCode !== 0) {
    console.error(`Cancel all failed: ${response.retMsg}`);
    return;
  }

  const list = response.result.list ?? [];

  if (params.jsonOutput) {
    console.log(formatJson({ cancelled: list.length, orders: list }));
    return;
  }

  if (list.length === 0) {
    console.log('No orders to cancel.');
    return;
  }

  console.log(`Cancelled ${list.length} order(s) successfully.`);
}
