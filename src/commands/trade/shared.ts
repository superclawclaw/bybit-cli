import { formatJson, formatTable } from '../../cli/output.js';

export interface OrderResult {
  readonly orderId: string;
  readonly orderLinkId: string;
}

const RESULT_HEADERS = ['Field', 'Value'] as const;

export function toSymbol(coin: string, category: string): string {
  const upper = coin.toUpperCase();
  if (category === 'spot' || upper.includes('USDT') || upper.includes('USD') || upper.includes('PERP')) {
    return upper;
  }
  return `${upper}USDT`;
}

export function formatOrderResult(result: OrderResult): readonly (readonly string[])[] {
  return [
    ['Order ID', result.orderId],
    ['Order Link ID', result.orderLinkId || '-'],
  ];
}

export function displayOrderResult(
  result: OrderResult,
  label: string,
  jsonOutput: boolean,
): void {
  if (jsonOutput) {
    console.log(formatJson(result));
    return;
  }
  console.log(`${label}:`);
  console.log(formatTable(RESULT_HEADERS, formatOrderResult(result)));
}
