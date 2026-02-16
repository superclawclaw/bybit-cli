import React from 'react';
import { Box, Text } from 'ink';
import { theme, pnlColor } from '../theme.js';

interface PriceDisplayProps {
  readonly symbol: string;
  readonly lastPrice: string;
  readonly price24hPcnt: string;
  readonly markPrice?: string;
  readonly indexPrice?: string;
}

export function PriceDisplay({ symbol, lastPrice, price24hPcnt, markPrice, indexPrice }: PriceDisplayProps): React.ReactElement {
  const pctNum = Number(price24hPcnt) * 100;
  const sign = pctNum > 0 ? '+' : '';
  const pctStr = `${sign}${pctNum.toFixed(2)}%`;
  const color = pnlColor(pctNum);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box gap={2}>
        <Text color={theme.accent} bold>{symbol}</Text>
        <Text bold>{lastPrice}</Text>
        <Text color={color}>{pctStr}</Text>
      </Box>
      {(markPrice || indexPrice) && (
        <Box gap={2}>
          {markPrice && <Text color={theme.muted}>Mark: {markPrice}</Text>}
          {indexPrice && <Text color={theme.muted}>Index: {indexPrice}</Text>}
        </Box>
      )}
    </Box>
  );
}
