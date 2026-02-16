import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface BookLevel {
  readonly price: string;
  readonly size: string;
}

const HEADERS = ['Price', 'Size', 'Side'] as const;

export function formatBookLevel(level: BookLevel, side: 'bid' | 'ask'): readonly string[] {
  return [
    level.price,
    level.size,
    side.toUpperCase(),
  ];
}

export async function fetchAndDisplayBook(
  client: RestClientV5,
  symbol: string,
  category: Category | string,
  jsonOutput: boolean,
  limit: number = 25,
): Promise<void> {
  const response = await client.getOrderbook({
    category: category as 'linear' | 'inverse' | 'spot' | 'option',
    symbol,
    limit,
  });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const result = response.result;
  const bids: readonly BookLevel[] = (result.b ?? []).map(([price, size]: [string, string]) => ({ price, size }));
  const asks: readonly BookLevel[] = (result.a ?? []).map(([price, size]: [string, string]) => ({ price, size }));

  if (jsonOutput) {
    console.log(formatJson({ symbol: result.s, bids, asks }));
    return;
  }

  const askRows = [...asks].reverse().map((level) => formatBookLevel(level, 'ask'));
  const bidRows = bids.map((level) => formatBookLevel(level, 'bid'));
  const allRows = [...askRows, ...bidRows];

  console.log(formatTable(HEADERS, allRows));
}
