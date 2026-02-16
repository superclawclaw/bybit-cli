import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import type { BookLevel } from '../../../commands/asset/book.js';

interface BookViewProps {
  readonly symbol: string;
  readonly bids: readonly BookLevel[];
  readonly asks: readonly BookLevel[];
}

export function BookView({ symbol, bids, asks }: BookViewProps): React.ReactElement {
  const displayAsks = [...asks].reverse().slice(0, 10);
  const displayBids = bids.slice(0, 10);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color={theme.accent} bold>{symbol} Order Book</Text>
      <Box gap={2} marginTop={1}>
        <Text color={theme.header} bold>{'Price'.padEnd(14)}</Text>
        <Text color={theme.header} bold>{'Size'.padEnd(14)}</Text>
        <Text color={theme.header} bold>{'Side'.padEnd(6)}</Text>
      </Box>
      {displayAsks.map((level, i) => (
        <Box key={`ask-${i}`} gap={2}>
          <Text color={theme.loss}>{level.price.padEnd(14)}</Text>
          <Text>{level.size.padEnd(14)}</Text>
          <Text color={theme.loss}>ASK</Text>
        </Box>
      ))}
      <Box marginY={0}>
        <Text color={theme.border}>{'---'.padEnd(38)}</Text>
      </Box>
      {displayBids.map((level, i) => (
        <Box key={`bid-${i}`} gap={2}>
          <Text color={theme.profit}>{level.price.padEnd(14)}</Text>
          <Text>{level.size.padEnd(14)}</Text>
          <Text color={theme.profit}>BID</Text>
        </Box>
      ))}
    </Box>
  );
}
