import type { RestClientV5 } from 'bybit-api';
import { toSymbol, displayOrderResult } from './shared.js';

export interface TakeProfitOrderParams {
  readonly side: 'Buy' | 'Sell';
  readonly qty: string;
  readonly coin: string;
  readonly price: string;
  readonly triggerPrice: string;
  readonly category: string;
  readonly reduceOnly: boolean;
  readonly jsonOutput: boolean;
}

export async function submitTakeProfitOrder(
  client: RestClientV5,
  params: TakeProfitOrderParams,
): Promise<void> {
  const symbol = toSymbol(params.coin, params.category);

  // triggerDirection: 1 = rise above trigger, 2 = fall below trigger
  // For take-profit sell: trigger when price rises above trigger price (direction=1)
  // For take-profit buy: trigger when price falls below trigger price (direction=2)
  const triggerDirection: 1 | 2 = params.side === 'Sell' ? 1 : 2;

  const response = await client.submitOrder({
    category: params.category as 'linear',
    symbol,
    side: params.side,
    orderType: 'Limit',
    qty: params.qty,
    price: params.price,
    triggerPrice: params.triggerPrice,
    triggerDirection,
    timeInForce: 'GTC',
    reduceOnly: params.reduceOnly,
  });

  if (response.retCode !== 0) {
    console.error(`Take-profit order failed: ${response.retMsg}`);
    return;
  }

  displayOrderResult(
    { orderId: response.result.orderId, orderLinkId: response.result.orderLinkId },
    `Take-profit ${params.side} order placed successfully`,
    params.jsonOutput,
  );
}
