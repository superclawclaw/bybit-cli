import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { WebsocketClient } from 'bybit-api';
import { buildWsTopic, startWatch, setupGracefulShutdown, type WsTopicType } from '../watch.js';
import { theme } from './theme.js';

export interface WatchConfig {
  readonly topic: string;
  readonly isPrivate: boolean;
}

export interface BuildWatchConfigOptions {
  readonly topicType: WsTopicType;
  readonly symbol?: string;
  readonly depth?: number;
  readonly isPrivate: boolean;
}

export function buildWatchConfig(options: BuildWatchConfigOptions): WatchConfig {
  const topic = buildWsTopic(options.topicType, options.symbol, options.depth);
  return {
    topic,
    isPrivate: options.isPrivate,
  };
}

export interface WatchAppProps {
  readonly wsClient: WebsocketClient;
  readonly config: WatchConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly initialData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly transformUpdate: (raw: unknown, prev: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly children: (data: any) => React.ReactElement;
}

export function WatchApp({
  wsClient,
  config,
  initialData,
  transformUpdate,
  children,
}: WatchAppProps): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const cleanup = startWatch({
      wsClient,
      topic: config.topic,
      isPrivate: config.isPrivate,
      onUpdate: (raw: unknown) => {
        setConnected(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData((prev: any) => transformUpdate(raw, prev));
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      },
    });

    setupGracefulShutdown(cleanup);

    return cleanup;
  }, [wsClient, config.topic, config.isPrivate, transformUpdate]);

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
          {connected ? `Live: ${config.topic}` : `Connecting: ${config.topic}...`}
        </Text>
      </Box>
      {children(data)}
    </Box>
  );
}
