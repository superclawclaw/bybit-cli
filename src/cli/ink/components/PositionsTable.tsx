import React from 'react';
import { Box, Text } from 'ink';
import { theme, pnlColor } from '../theme.js';
import type { PositionInfo } from '../../../commands/account/positions.js';

interface PositionsTableProps {
  readonly positions: readonly PositionInfo[];
}

export function PositionsTable({ positions }: PositionsTableProps): React.ReactElement {
  if (positions.length === 0) {
    return (
      <Box paddingX={1}>
        <Text color={theme.muted}>No open positions.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box gap={2}>
        <Text color={theme.header} bold>{'Symbol'.padEnd(12)}</Text>
        <Text color={theme.header} bold>{'Side'.padEnd(6)}</Text>
        <Text color={theme.header} bold>{'Size'.padEnd(10)}</Text>
        <Text color={theme.header} bold>{'Entry'.padEnd(12)}</Text>
        <Text color={theme.header} bold>{'Mark'.padEnd(12)}</Text>
        <Text color={theme.header} bold>{'PnL'.padEnd(12)}</Text>
        <Text color={theme.header} bold>{'Lev'.padEnd(5)}</Text>
      </Box>
      {positions.map((pos) => {
        const pnl = Number(pos.unrealisedPnl);
        return (
          <Box key={pos.symbol} gap={2}>
            <Text>{pos.symbol.padEnd(12)}</Text>
            <Text color={pos.side === 'Buy' ? theme.profit : theme.loss}>{pos.side.padEnd(6)}</Text>
            <Text>{pos.size.padEnd(10)}</Text>
            <Text>{pos.entryPrice.padEnd(12)}</Text>
            <Text>{pos.markPrice.padEnd(12)}</Text>
            <Text color={pnlColor(pnl)}>{pos.unrealisedPnl.padEnd(12)}</Text>
            <Text color={theme.muted}>{`${pos.leverage}x`.padEnd(5)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
