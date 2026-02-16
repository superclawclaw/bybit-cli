import { homedir } from 'node:os';
import { join } from 'node:path';

export type Category = 'linear' | 'spot' | 'inverse' | 'option';

export interface CliConfig {
  readonly testnet: boolean;
  readonly category: Category;
  readonly dataDir: string;
  readonly accountId: string | undefined;
  readonly jsonOutput: boolean;
}

export interface ConfigOptions {
  readonly testnet?: boolean;
  readonly category?: Category;
  readonly account?: string;
  readonly json?: boolean;
}

const DEFAULT_DATA_DIR_NAME = '.bybit-cli';

export function getConfig(options: ConfigOptions): CliConfig {
  const config: CliConfig = {
    testnet: options.testnet ?? false,
    category: options.category ?? 'linear',
    dataDir: join(homedir(), DEFAULT_DATA_DIR_NAME),
    accountId: options.account,
    jsonOutput: options.json ?? false,
  };

  return Object.freeze(config);
}
