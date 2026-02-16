import { RestClientV5, WebsocketClient } from 'bybit-api';

export interface RestClientOptions {
  readonly apiKey?: string;
  readonly apiSecret?: string;
  readonly testnet: boolean;
}

export interface WsClientOptions {
  readonly apiKey?: string;
  readonly apiSecret?: string;
  readonly testnet: boolean;
}

export function getBaseUrl(testnet: boolean): string {
  return testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';
}

export function createRestClient(options: RestClientOptions): RestClientV5 {
  return new RestClientV5({
    key: options.apiKey,
    secret: options.apiSecret,
    testnet: options.testnet,
  });
}

export function createWsClient(options: WsClientOptions): WebsocketClient {
  return new WebsocketClient({
    key: options.apiKey,
    secret: options.apiSecret,
    testnet: options.testnet,
    market: 'v5',
  });
}
