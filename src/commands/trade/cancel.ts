import type { RestClientV5 } from 'bybit-api';
import { toSymbol, displayOrderResult } from './shared.js';

export interface CancelOrderParams {
  readonly orderId: string;
  readonly coin: string;
  readonly category: string;
  readonly jsonOutput: boolean;
}

export async function cancelOrder(
  client: RestClientV5,
  params: CancelOrderParams,
): Promise<void> {
  const symbol = toSymbol(params.coin, params.category);

  const response = await client.cancelOrder({
    category: params.category as 'linear',
    symbol,
    orderId: params.orderId,
  });

  if (response.retCode !== 0) {
    console.error(`Cancel failed: ${response.retMsg}`);
    return;
  }

  displayOrderResult(
    { orderId: response.result.orderId, orderLinkId: response.result.orderLinkId },
    'Order cancelled successfully',
    params.jsonOutput,
  );
}
