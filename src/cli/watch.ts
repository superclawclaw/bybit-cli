import type { WebsocketClient } from 'bybit-api';

export type WsTopicType = 'orderbook' | 'tickers' | 'position' | 'order' | 'wallet';

export function buildWsTopic(
  type: WsTopicType,
  symbol?: string,
  depth?: number,
): string {
  switch (type) {
    case 'orderbook':
      return `orderbook.${depth ?? 50}.${symbol}`;
    case 'tickers':
      return `tickers.${symbol}`;
    case 'position':
      return 'position';
    case 'order':
      return 'order';
    case 'wallet':
      return 'wallet';
  }
}

export interface WatchOptions {
  readonly wsClient: WebsocketClient;
  readonly topic: string;
  readonly isPrivate: boolean;
  readonly onUpdate: (data: unknown) => void;
  readonly onError?: (error: unknown) => void;
}

export function startWatch(options: WatchOptions): () => void {
  const { wsClient, topic, isPrivate, onUpdate, onError } = options;

  wsClient.on('update', (data: { topic?: string; data?: unknown }) => {
    if (data.topic === topic || !data.topic) {
      onUpdate(data.data ?? data);
    }
  });

  (wsClient as unknown as { on(event: string, cb: (...args: unknown[]) => void): void }).on('error', (...args: unknown[]) => {
    if (onError) {
      onError(args[0]);
    }
  });

  if (isPrivate) {
    wsClient.subscribeV5([topic] as never, 'private' as never);
  } else {
    wsClient.subscribeV5([topic] as never, 'linear' as never);
  }

  return () => {
    wsClient.closeAll();
  };
}

export function setupGracefulShutdown(cleanup: () => void): void {
  const handler = () => {
    cleanup();
    process.exit(0);
  };
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
}
