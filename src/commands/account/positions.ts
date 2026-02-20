import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import type { Category } from '../../lib/config.js';

export interface PositionInfo {
  readonly symbol: string;
  readonly side: string;
  readonly size: string;
  readonly entryPrice: string;
  readonly markPrice: string;
  readonly unrealisedPnl: string;
  readonly leverage: string;
}

const HEADERS = ['Symbol', 'Side', 'Size', 'Entry', 'Mark', 'Unreal. PnL', 'Leverage'] as const;

export function formatPosition(pos: PositionInfo): readonly string[] {
  return [
    pos.symbol,
    pos.side,
    pos.size,
    pos.entryPrice,
    pos.markPrice,
    pos.unrealisedPnl,
    `${pos.leverage}x`,
  ];
}

export async function fetchAndDisplayPositions(
  client: RestClientV5,
  category: Category | string,
  jsonOutput: boolean,
): Promise<void> {
  const response = await client.getPositionInfo({
    category: category as 'linear' | 'inverse',
    settleCoin: category === 'linear' ? 'USDT' : undefined,
  });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const allPositions = response.result.list ?? [];
  const positions: readonly PositionInfo[] = allPositions
    .filter((p) => p.size !== '0' && p.size !== '')
    .map((p) => ({
      symbol: p.symbol,
      side: p.side,
      size: p.size,
      entryPrice: p.avgPrice,
      markPrice: p.markPrice,
      unrealisedPnl: p.unrealisedPnl,
      leverage: p.leverage ?? '0',
    }));

  if (positions.length === 0) {
    console.log('No open positions.');
    return;
  }

  if (jsonOutput) {
    console.log(formatJson(positions));
    return;
  }

  const rows = positions.map(formatPosition);
  console.log(formatTable(HEADERS, rows));
}
