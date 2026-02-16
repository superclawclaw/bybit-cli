import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface DetailedTickerInfo {
  readonly symbol: string;
  readonly lastPrice: string;
  readonly highPrice24h: string;
  readonly lowPrice24h: string;
  readonly price24hPcnt: string;
  readonly volume24h: string;
  readonly turnover24h: string;
  readonly bid1Price: string;
  readonly ask1Price: string;
}

const HEADERS = ['Symbol', 'Last', 'High 24h', 'Low 24h', '24h %', 'Volume', 'Bid', 'Ask'] as const;

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

export function formatDetailedTicker(ticker: DetailedTickerInfo): readonly string[] {
  return [
    ticker.symbol,
    ticker.lastPrice,
    ticker.highPrice24h,
    ticker.lowPrice24h,
    formatPercent(ticker.price24hPcnt),
    formatVolume(ticker.volume24h),
    ticker.bid1Price,
    ticker.ask1Price,
  ];
}

export async function fetchAndDisplayTicker(
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

  const allTickers = response.result.list ?? [];
  if (allTickers.length === 0) {
    console.error(`Ticker for "${symbol}" not found.`);
    return;
  }

  const t = allTickers[0] as unknown as Record<string, string>;
  const ticker: DetailedTickerInfo = {
    symbol: t.symbol,
    lastPrice: t.lastPrice,
    highPrice24h: t.highPrice24h ?? '-',
    lowPrice24h: t.lowPrice24h ?? '-',
    price24hPcnt: t.price24hPcnt ?? '0',
    volume24h: t.volume24h ?? '0',
    turnover24h: t.turnover24h ?? '0',
    bid1Price: t.bid1Price ?? '-',
    ask1Price: t.ask1Price ?? '-',
  };

  if (jsonOutput) {
    console.log(formatJson(ticker));
    return;
  }

  const rows = [formatDetailedTicker(ticker)];
  console.log(formatTable(HEADERS, rows));
}
