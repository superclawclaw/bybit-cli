import { Command } from 'commander';
import { getConfig } from '../../lib/config.js';
import { createRestClient } from '../../lib/bybit.js';
import { validateSymbol } from '../../lib/validation.js';
import { fetchAndDisplayInstruments } from './ls.js';
import { fetchAndDisplayPrices } from './prices.js';
import { fetchAndDisplayTicker } from './tickers.js';

export function createMarketsCommand(): Command {
  const markets = new Command('markets').description('Market data and instruments');

  markets
    .command('ls')
    .description('List available instruments')
    .action(async () => {
      const config = getConfig(markets.parent?.opts() ?? {});
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayInstruments(client, config.category, config.jsonOutput);
    });

  markets
    .command('prices')
    .description('Show market prices')
    .action(async () => {
      const config = getConfig(markets.parent?.opts() ?? {});
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayPrices(client, config.category, config.jsonOutput);
    });

  markets
    .command('tickers')
    .description('Show detailed ticker for a symbol')
    .argument('<symbol>', 'Trading pair symbol (e.g. BTCUSDT)')
    .action(async (rawSymbol: string) => {
      const config = getConfig(markets.parent?.opts() ?? {});
      const symbol = validateSymbol(rawSymbol);
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayTicker(client, `${symbol}USDT`, config.category, config.jsonOutput);
    });

  return markets;
}
