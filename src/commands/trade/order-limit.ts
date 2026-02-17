import type { RestClientV5 } from 'bybit-api';
import { toSymbol, displayOrderResult } from './shared.js';

export { formatOrderResult } from './shared.js';

export interface LimitOrderParams {
  readonly side: 'Buy' | 'Sell';
  readonly qty: string;
  readonly coin: string;
  readonly price: string;
  readonly category: string;
  readonly timeInForce: string;
  readonly reduceOnly: boolean;
  readonly jsonOutput: boolean;
}

export async function submitLimitOrder(
  client: RestClientV5,
  params: LimitOrderParams,
): Promise<void> {
  const symbol = toSymbol(params.coin, params.category);

  const response = await client.submitOrder({
    category: params.category as 'linear',
    symbol,
    side: params.side,
    orderType: 'Limit',
    qty: params.qty,
    price: params.price,
    timeInForce: params.timeInForce as 'GTC' | 'IOC' | 'FOK' | 'PostOnly',
    reduceOnly: params.reduceOnly,
  });

  if (response.retCode !== 0) {
    console.error(`Order failed: ${response.retMsg}`);
    return;
  }

  displayOrderResult(
    { orderId: response.result.orderId, orderLinkId: response.result.orderLinkId },
    `Limit ${params.side} order placed successfully`,
    params.jsonOutput,
  );
}
