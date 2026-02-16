import { Command } from 'commander';
import { getConfig } from '../../lib/config.js';
import { createRestClient } from '../../lib/bybit.js';
import { validateSymbol } from '../../lib/validation.js';
import { fetchAndDisplayPrice } from './price.js';
import { fetchAndDisplayBook } from './book.js';
import { fetchAndDisplayFunding } from './funding.js';

export function createAssetCommand(): Command {
  const asset = new Command('asset').description('Asset price data and order book');

  asset
    .command('price')
    .description('Show price for a symbol')
    .argument('<symbol>', 'Coin symbol (e.g. BTC)')
    .action(async (rawSymbol: string) => {
      const config = getConfig(asset.parent?.opts() ?? {});
      const symbol = validateSymbol(rawSymbol);
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayPrice(client, `${symbol}USDT`, config.category, config.jsonOutput);
    });

  asset
    .command('book')
    .description('Show order book for a symbol')
    .argument('<symbol>', 'Coin symbol (e.g. BTC)')
    .option('--limit <n>', 'Number of levels', '25')
    .action(async (rawSymbol: string, opts: { limit: string }) => {
      const config = getConfig(asset.parent?.opts() ?? {});
      const symbol = validateSymbol(rawSymbol);
      const client = createRestClient({ testnet: config.testnet });
      const limit = Number(opts.limit) || 25;
      await fetchAndDisplayBook(client, `${symbol}USDT`, config.category, config.jsonOutput, limit);
    });

  asset
    .command('funding')
    .description('Show funding rate history for a symbol')
    .argument('<symbol>', 'Coin symbol (e.g. BTC)')
    .action(async (rawSymbol: string) => {
      const config = getConfig(asset.parent?.opts() ?? {});
      const symbol = validateSymbol(rawSymbol);
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayFunding(client, `${symbol}USDT`, config.category, config.jsonOutput);
    });

  return asset;
}
