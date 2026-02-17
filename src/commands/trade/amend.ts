import type { RestClientV5 } from 'bybit-api';
import { toSymbol, displayOrderResult } from './shared.js';

export interface AmendOrderParams {
  readonly orderId: string;
  readonly coin: string;
  readonly category: string;
  readonly price: string | undefined;
  readonly qty: string | undefined;
  readonly jsonOutput: boolean;
}

export async function amendOrder(
  client: RestClientV5,
  params: AmendOrderParams,
): Promise<void> {
  if (!params.price && !params.qty) {
    console.error('At least one of --price or --qty must be specified.');
    return;
  }

  const symbol = toSymbol(params.coin, params.category);

  const requestParams: {
    category: 'linear';
    symbol: string;
    orderId: string;
    price?: string;
    qty?: string;
  } = {
    category: params.category as 'linear',
    symbol,
    orderId: params.orderId,
  };

  if (params.price) {
    requestParams.price = params.price;
  }
  if (params.qty) {
    requestParams.qty = params.qty;
  }

  const response = await client.amendOrder(requestParams);

  if (response.retCode !== 0) {
    console.error(`Amend failed: ${response.retMsg}`);
    return;
  }

  displayOrderResult(
    { orderId: response.result.orderId, orderLinkId: response.result.orderLinkId },
    'Order amended successfully',
    params.jsonOutput,
  );
}
