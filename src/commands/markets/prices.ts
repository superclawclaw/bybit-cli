import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface TickerInfo {
  readonly symbol: string;
  readonly lastPrice: string;
  readonly price24hPcnt: string;
  readonly volume24h: string;
}

const HEADERS = ['Symbol', 'Last Price', '24h Change', '24h Volume'] as const;

function formatPercent(value: string): string {
  const num = Number(value) * 100;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function formatVolume(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('en-US');
}

export function formatTicker(ticker: TickerInfo): readonly string[] {
  return [
    ticker.symbol,
    ticker.lastPrice,
    formatPercent(ticker.price24hPcnt),
    formatVolume(ticker.volume24h),
  ];
}

export async function fetchAndDisplayPrices(
  client: RestClientV5,
  category: Category | string,
  jsonOutput: boolean,
): Promise<void> {
  const response = await client.getTickers({ category: category as 'linear' });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const allTickers = response.result.list ?? [];
  if (allTickers.length === 0) {
    console.log('No price data found.');
    return;
  }

  const tickers: readonly TickerInfo[] = allTickers.map((raw) => {
    const t = raw as unknown as Record<string, string>;
    return {
      symbol: t.symbol,
      lastPrice: t.lastPrice,
      price24hPcnt: t.price24hPcnt ?? '0',
      volume24h: t.volume24h ?? '0',
    };
  });

  if (jsonOutput) {
    console.log(formatJson(tickers));
    return;
  }

  const rows = tickers.map(formatTicker);
  console.log(formatTable(HEADERS, rows));
}
