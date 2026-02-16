import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface InstrumentInfo {
  readonly symbol: string;
  readonly baseCoin: string;
  readonly quoteCoin: string;
  readonly status: string;
  readonly maxLeverage: string;
}

const HEADERS = ['Symbol', 'Base', 'Quote', 'Status', 'Max Leverage'] as const;

export function formatInstrument(instrument: InstrumentInfo): readonly string[] {
  return [
    instrument.symbol,
    instrument.baseCoin,
    instrument.quoteCoin,
    instrument.status,
    `${instrument.maxLeverage}x`,
  ];
}

export async function fetchAndDisplayInstruments(
  client: RestClientV5,
  category: Category | string,
  jsonOutput: boolean,
): Promise<void> {
  const response = await client.getInstrumentsInfo({ category: category as 'linear' | 'inverse' | 'spot' | 'option' });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const allInstruments = response.result.list ?? [];
  if (allInstruments.length === 0) {
    console.log('No instruments found.');
    return;
  }

  const instruments: readonly InstrumentInfo[] = allInstruments.map((i) => ({
    symbol: i.symbol,
    baseCoin: i.baseCoin,
    quoteCoin: i.quoteCoin,
    status: i.status,
    maxLeverage: 'leverageFilter' in i ? (i.leverageFilter as { maxLeverage: string }).maxLeverage : '-',
  }));

  if (jsonOutput) {
    console.log(formatJson(instruments));
    return;
  }

  const rows = instruments.map(formatInstrument);
  console.log(formatTable(HEADERS, rows));
}
