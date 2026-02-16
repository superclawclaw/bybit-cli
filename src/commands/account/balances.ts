import type { RestClientV5 } from 'bybit-api';
import { formatJson, formatTable } from '../../cli/output.js';

export interface WalletBalance {
  readonly coin: string;
  readonly equity: string;
  readonly availableToWithdraw: string;
  readonly unrealisedPnl: string;
}

const HEADERS = ['Coin', 'Equity', 'Available', 'Unrealised PnL'] as const;

export function formatBalance(balance: WalletBalance): readonly string[] {
  return [
    balance.coin,
    balance.equity,
    balance.availableToWithdraw,
    balance.unrealisedPnl,
  ];
}

export async function fetchAndDisplayBalances(
  client: RestClientV5,
  accountType: string,
  jsonOutput: boolean,
): Promise<void> {
  const response = await client.getWalletBalance({ accountType: accountType as 'UNIFIED' | 'CONTRACT' | 'SPOT' | 'FUND' });

  if (response.retCode !== 0) {
    console.error(`API error: ${response.retMsg}`);
    return;
  }

  const accounts = response.result.list;
  if (!accounts || accounts.length === 0) {
    console.log('No balances found.');
    return;
  }

  const coins = accounts.flatMap((acct) =>
    (acct.coin ?? []).map((c) => ({
      coin: c.coin,
      equity: c.equity,
      availableToWithdraw: c.availableToWithdraw,
      unrealisedPnl: c.unrealisedPnl,
    })),
  );

  if (coins.length === 0) {
    console.log('No balances found.');
    return;
  }

  if (jsonOutput) {
    console.log(formatJson(coins));
    return;
  }

  const rows = coins.map(formatBalance);
  console.log(formatTable(HEADERS, rows));
}
