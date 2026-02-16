import React from 'react';
import { Box, Text } from 'ink';
import { theme, pnlColor } from '../theme.js';
import type { WalletBalance } from '../../../commands/account/balances.js';

interface BalancesTableProps {
  readonly balances: readonly WalletBalance[];
}

export function BalancesTable({ balances }: BalancesTableProps): React.ReactElement {
  if (balances.length === 0) {
    return (
      <Box paddingX={1}>
        <Text color={theme.muted}>No balances.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box gap={2}>
        <Text color={theme.header} bold>{'Coin'.padEnd(8)}</Text>
        <Text color={theme.header} bold>{'Equity'.padEnd(16)}</Text>
        <Text color={theme.header} bold>{'Available'.padEnd(16)}</Text>
        <Text color={theme.header} bold>{'Unreal. PnL'.padEnd(16)}</Text>
      </Box>
      {balances.map((bal) => {
        const pnl = Number(bal.unrealisedPnl);
        return (
          <Box key={bal.coin} gap={2}>
            <Text color={theme.accent}>{bal.coin.padEnd(8)}</Text>
            <Text>{bal.equity.padEnd(16)}</Text>
            <Text>{bal.availableToWithdraw.padEnd(16)}</Text>
            <Text color={pnlColor(pnl)}>{bal.unrealisedPnl.padEnd(16)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
