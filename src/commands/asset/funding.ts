import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface FundingInfo {
  readonly symbol: string;
  readonly fundingRate: string;
  readonly fundingRateTimestamp: string;
}

const HEADERS = ['Symbol', 'Funding Rate', 'Timestamp'] as const;

function formatRate(value: string): string {
  const num = Number(value) * 100;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(4)}%`;
}

function formatTimestamp(ts: string): string {
  const num = Number(ts);
  if (Number.isNaN(num) || num === 0) return '-';
  return new Date(num).toISOString().replace('T', ' ').slice(0, 19);
}

export function formatFunding(info: FundingInfo): readonly string[] {
  return [
    info.symbol,
    formatRate(info.fundingRate),
    formatTimestamp(info.fundingRateTimestamp),
  ];
}

export async function fetchAndDisplayFunding(
  client: RestClientV5,
  symbol: string,
  category: Category | string,
  jsonOutput: boolean,
): Promise<void> {
  const response = await client.getFundingRateHistory({
    category: category as 'linear' | 'inverse',
    symbol,
    limit: 10,
  });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const allRates = response.result.list ?? [];
  if (allRates.length === 0) {
    console.log(`No funding rate data for "${symbol}".`);
    return;
  }

  const rates: readonly FundingInfo[] = allRates.map((r) => ({
    symbol: r.symbol,
    fundingRate: r.fundingRate,
    fundingRateTimestamp: r.fundingRateTimestamp,
  }));

  if (jsonOutput) {
    console.log(formatJson(rates));
    return;
  }

  const rows = rates.map(formatFunding);
  console.log(formatTable(HEADERS, rows));
}
