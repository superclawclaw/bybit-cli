import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface PriceInfo {
  readonly symbol: string;
  readonly lastPrice: string;
  readonly indexPrice: string;
  readonly markPrice: string;
  readonly price24hPcnt: string;
}

const HEADERS = ['Symbol', 'Last Price', 'Index Price', 'Mark Price', '24h Change'] as const;

function formatPercent(value: string): string {
  const num = Number(value) * 100;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatPrice(price: PriceInfo): readonly string[] {
  return [
    price.symbol,
    price.lastPrice,
    price.indexPrice,
    price.markPrice,
    formatPercent(price.price24hPcnt),
  ];
}

export async function fetchAndDisplayPrice(
  client: RestClientV5,
  symbol: string,
  category: Category | string,
  jsonOutput: boolean,
): Promise<void> {
  const response = await client.getTickers({
    category: category as 'linear',
    symbol,
  });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const tickers = response.result.list ?? [];
  if (tickers.length === 0) {
    console.error(`Ticker for "${symbol}" not found.`);
    return;
  }

  const t = tickers[0] as unknown as Record<string, string>;
  const priceInfo: PriceInfo = {
    symbol: t.symbol,
    lastPrice: t.lastPrice,
    indexPrice: t.indexPrice ?? '-',
    markPrice: t.markPrice ?? '-',
    price24hPcnt: t.price24hPcnt ?? '0',
  };

  if (jsonOutput) {
    console.log(formatJson(priceInfo));
    return;
  }

  const rows = [formatPrice(priceInfo)];
  console.log(formatTable(HEADERS, rows));
}
