import { Command } from 'commander';
import { getConfig } from '../../lib/config.js';
import { createRestClient, createWsClient } from '../../lib/bybit.js';
import { validateSymbol } from '../../lib/validation.js';
import { fetchAndDisplayPrice } from './price.js';
import { fetchAndDisplayBook } from './book.js';
import { fetchAndDisplayFunding } from './funding.js';
import { transformTickerUpdate, transformOrderbookUpdate } from './watch.js';
import { buildWatchConfig } from '../../cli/ink/WatchApp.js';

/** Normalize symbol: BTC → BTCUSDT, BTCUSDT → BTCUSDT (no double suffix) */
function normalizeSymbol(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper.endsWith('USDT') || upper.endsWith('USD') || upper.endsWith('PERP')) {
    return upper;
  }
  return `${upper}USDT`;
}

export function createAssetCommand(): Command {
  const asset = new Command('asset').description('Asset price data and order book');

  asset
    .command('price')
    .description('Show price for a symbol')
    .argument('<symbol>', 'Coin symbol (e.g. BTC)')
    .option('-w, --watch', 'Watch mode (real-time updates)')
    .action(async (rawSymbol: string, opts: { watch?: boolean }) => {
      const config = getConfig(asset.parent?.opts() ?? {});
      const symbol = validateSymbol(rawSymbol);
      const fullSymbol = normalizeSymbol(symbol);
      if (opts.watch) {
        const { renderComponent } = await import('../../cli/ink/render.js');
        const { WatchApp } = await import('../../cli/ink/WatchApp.js');
        const { PriceDisplay } = await import('../../cli/ink/components/PriceDisplay.js');
        const React = await import('react');
        const wsClient = createWsClient({ testnet: config.testnet });
        const watchConfig = buildWatchConfig({ topicType: 'tickers', symbol: fullSymbol, isPrivate: false });
        const initialData = { symbol: fullSymbol, lastPrice: '-', indexPrice: '-', markPrice: '-', price24hPcnt: '0' };
        renderComponent(
          React.createElement(WatchApp, {
            wsClient,
            config: watchConfig,
            initialData,
            transformUpdate: transformTickerUpdate,
            children: (data) => React.createElement(PriceDisplay, {
              symbol: data.symbol,
              lastPrice: data.lastPrice,
              price24hPcnt: data.price24hPcnt,
              markPrice: data.markPrice,
              indexPrice: data.indexPrice,
            }),
          }),
        );
        return;
      }
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayPrice(client, fullSymbol, config.category, config.jsonOutput);
    });

  asset
    .command('book')
    .description('Show order book for a symbol')
    .argument('<symbol>', 'Coin symbol (e.g. BTC)')
    .option('--limit <n>', 'Number of levels', '25')
    .option('-w, --watch', 'Watch mode (real-time updates)')
    .action(async (rawSymbol: string, opts: { limit: string; watch?: boolean }) => {
      const config = getConfig(asset.parent?.opts() ?? {});
      const symbol = validateSymbol(rawSymbol);
      const fullSymbol = normalizeSymbol(symbol);
      const limit = Number(opts.limit) || 25;
      if (opts.watch) {
        const { renderComponent } = await import('../../cli/ink/render.js');
        const { WatchApp } = await import('../../cli/ink/WatchApp.js');
        const { BookView } = await import('../../cli/ink/components/BookView.js');
        const React = await import('react');
        const wsClient = createWsClient({ testnet: config.testnet });
        const depth = limit <= 1 ? 1 : limit <= 50 ? 50 : 200;
        const watchConfig = buildWatchConfig({ topicType: 'orderbook', symbol: fullSymbol, depth, isPrivate: false });
        const initialData = { bids: [], asks: [] };
        renderComponent(
          React.createElement(WatchApp, {
            wsClient,
            config: watchConfig,
            initialData,
            transformUpdate: transformOrderbookUpdate,
            children: (data) => React.createElement(BookView, {
              symbol: fullSymbol,
              bids: data.bids,
              asks: data.asks,
            }),
          }),
        );
        return;
      }
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayBook(client, fullSymbol, config.category, config.jsonOutput, limit);
    });

  asset
    .command('funding')
    .description('Show funding rate history for a symbol')
    .argument('<symbol>', 'Coin symbol (e.g. BTC)')
    .action(async (rawSymbol: string) => {
      const config = getConfig(asset.parent?.opts() ?? {});
      const symbol = validateSymbol(rawSymbol);
      const client = createRestClient({ testnet: config.testnet });
      await fetchAndDisplayFunding(client, normalizeSymbol(symbol), config.category, config.jsonOutput);
    });

  return asset;
}
