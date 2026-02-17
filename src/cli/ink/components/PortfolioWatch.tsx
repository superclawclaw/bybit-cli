import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { WebsocketClient } from 'bybit-api';
import { startWatch, setupGracefulShutdown } from '../../watch.js';
import { theme } from '../theme.js';
import { BalancesTable } from './BalancesTable.js';
import { PositionsTable } from './PositionsTable.js';
import { transformWalletUpdate, transformPositionUpdate, type WalletWatchData, type PositionWatchData } from '../../../commands/account/watch.js';

interface PortfolioWatchProps {
  readonly wsClient: WebsocketClient;
}

export function PortfolioWatch({ wsClient }: PortfolioWatchProps): React.ReactElement {
  const [balances, setBalances] = useState<WalletWatchData>([]);
  const [positions, setPositions] = useState<PositionWatchData>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    };

    const cleanup1 = startWatch({
      wsClient,
      topic: 'wallet',
      isPrivate: true,
      onUpdate: (raw: unknown) => {
        setConnected(true);
        setBalances((prev) => transformWalletUpdate(raw, prev));
      },
      onError,
    });

    const cleanup2 = startWatch({
      wsClient,
      topic: 'position',
      isPrivate: true,
      onUpdate: (raw: unknown) => {
        setConnected(true);
        setPositions((prev) => transformPositionUpdate(raw, prev));
      },
      onError,
    });

    setupGracefulShutdown(() => {
      cleanup1();
      cleanup2();
    });

    return () => {
      cleanup1();
      cleanup2();
    };
  }, [wsClient]);

  if (error) {
    return (
      <Box paddingX={1}>
        <Text color={theme.loss}>WS Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text color={theme.muted}>
          {connected ? 'Live: wallet + position' : 'Connecting: wallet + position...'}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.header} bold>  Balances</Text>
      </Box>
      <BalancesTable balances={balances} />
      <Box marginTop={1}>
        <Text color={theme.header} bold>  Positions</Text>
      </Box>
      <PositionsTable positions={positions} />
    </Box>
  );
}
