import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';
import { formatBalance, type WalletBalance } from './balances.js';
import { formatPosition, type PositionInfo } from './positions.js';
import type { Category } from '../../lib/config.js';

const BALANCE_HEADERS = ['Coin', 'Equity', 'Available', 'Unrealised PnL'] as const;
const POSITION_HEADERS = ['Symbol', 'Side', 'Size', 'Entry', 'Mark', 'Unreal. PnL', 'Leverage'] as const;

export async function fetchAndDisplayPortfolio(
  client: RestClientV5,
  accountType: string,
  category: Category | string,
  jsonOutput: boolean,
): Promise<void> {
  const [balanceResponse, positionResponse] = await Promise.all([
    client.getWalletBalance({ accountType: accountType as 'UNIFIED' | 'CONTRACT' | 'SPOT' | 'FUND' }),
    client.getPositionInfo({ category: category as 'linear' | 'inverse' }),
  ]);

  if (balanceResponse.retCode !== 0) {
    console.error(`Balance API error: ${balanceResponse.retMsg}`);
  }
  if (positionResponse.retCode !== 0) {
    console.error(`Position API error: ${positionResponse.retMsg}`);
  }

  const balances: readonly WalletBalance[] = (balanceResponse.retCode === 0
    ? balanceResponse.result.list ?? []
    : []
  ).flatMap((acct) =>
    (acct.coin ?? []).map((c) => ({
      coin: c.coin,
      equity: c.equity,
      availableToWithdraw: c.availableToWithdraw,
      unrealisedPnl: c.unrealisedPnl,
    })),
  );

  const positions: readonly PositionInfo[] = (positionResponse.retCode === 0
    ? positionResponse.result.list ?? []
    : []
  )
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

  if (jsonOutput) {
    console.log(formatJson({ balances, positions }));
    return;
  }

  console.log('\n  Balances');
  if (balances.length === 0) {
    console.log('  No balances found.');
  } else {
    const balanceRows = balances.map(formatBalance);
    console.log(formatTable(BALANCE_HEADERS, balanceRows));
  }

  console.log('\n  Positions');
  if (positions.length === 0) {
    console.log('  No open positions.');
  } else {
    const positionRows = positions.map(formatPosition);
    console.log(formatTable(POSITION_HEADERS, positionRows));
  }
}
