import type { RestClientV5 } from 'bybit-api';
import { toSymbol, displayOrderResult } from './shared.js';

export interface MarketOrderParams {
  readonly side: 'Buy' | 'Sell';
  readonly qty: string;
  readonly coin: string;
  readonly category: string;
  readonly reduceOnly: boolean;
  readonly jsonOutput: boolean;
}

export async function submitMarketOrder(
  client: RestClientV5,
  params: MarketOrderParams,
): Promise<void> {
  const symbol = toSymbol(params.coin, params.category);

  const response = await client.submitOrder({
    category: params.category as 'linear',
    symbol,
    side: params.side,
    orderType: 'Market',
    qty: params.qty,
    timeInForce: 'GTC',
    reduceOnly: params.reduceOnly,
  });

  if (response.retCode !== 0) {
    console.error(`Order failed: ${response.retMsg}`);
    return;
  }

  displayOrderResult(
    { orderId: response.result.orderId, orderLinkId: response.result.orderLinkId },
    `Market ${params.side} order placed successfully`,
    params.jsonOutput,
  );
}
