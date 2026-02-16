import { RestClientV5 } from 'bybit-api';
import { createRestClient } from '../lib/bybit.js';
import { getConfig, type CliConfig, type ConfigOptions } from '../lib/config.js';

export interface CliContext {
  readonly config: CliConfig;
  readonly restClient: RestClientV5;
}

export interface ContextOptions extends ConfigOptions {
  readonly apiKey?: string;
  readonly apiSecret?: string;
}

export function createCliContext(options: ContextOptions): CliContext {
  const config = getConfig(options);
  const restClient = createRestClient({
    apiKey: options.apiKey,
    apiSecret: options.apiSecret,
    testnet: config.testnet,
  });

  return { config, restClient };
}
