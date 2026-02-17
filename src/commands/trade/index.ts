import { Command } from 'commander';
import { AccountStore } from '../../lib/db/accounts.js';
import { getConfig } from '../../lib/config.js';
import { createRestClient } from '../../lib/bybit.js';
import { validateSymbol, validatePositiveNumber } from '../../lib/validation.js';
import { submitLimitOrder } from './order-limit.js';
import { submitMarketOrder } from './order-market.js';
import { submitStopLossOrder } from './order-stop-loss.js';
import { submitTakeProfitOrder } from './order-take-profit.js';
import { cancelOrder } from './cancel.js';
import { cancelAllOrders } from './cancel-all.js';
import { setLeverage } from './set-leverage.js';
import { amendOrder } from './amend.js';
import { ApiKeyNotFoundError, handleError } from '../../lib/errors.js';

function resolveAccount(config: ReturnType<typeof getConfig>) {
  const store = new AccountStore(config.dataDir);
  const acct = config.accountId ? store.get(config.accountId) : store.getDefault();
  if (!acct) {
    store.close();
    throw new ApiKeyNotFoundError();
  }
  const client = createRestClient({
    apiKey: acct.apiKey,
    apiSecret: acct.apiSecret,
    testnet: config.testnet,
  });
  return { store, acct, client };
}

export function createTradeCommand(): Command {
  const trade = new Command('trade').description('Trading commands');

  // --- order subgroup ---
  const order = new Command('order').description('Place orders');

  order
    .command('limit')
    .description('Place a limit order')
    .argument('<side>', 'Buy or Sell')
    .argument('<size>', 'Order quantity')
    .argument('<coin>', 'Coin symbol (e.g. BTC)')
    .argument('<price>', 'Limit price')
    .option('--tif <tif>', 'Time in force: GTC, IOC, PostOnly', 'GTC')
    .option('--reduce-only', 'Reduce-only order', false)
    .action(async (side: string, size: string, coin: string, price: string, opts: { tif: string; reduceOnly: boolean }) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        const validSide = side.charAt(0).toUpperCase() + side.slice(1).toLowerCase();
        if (validSide !== 'Buy' && validSide !== 'Sell') {
          console.error('Side must be "buy" or "sell".');
          return;
        }
        validatePositiveNumber(size, 'size');
        validatePositiveNumber(price, 'price');
        await submitLimitOrder(client, {
          side: validSide as 'Buy' | 'Sell',
          qty: size,
          coin: validateSymbol(coin),
          price,
          category: config.category,
          timeInForce: opts.tif,
          reduceOnly: opts.reduceOnly,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  order
    .command('market')
    .description('Place a market order')
    .argument('<side>', 'Buy or Sell')
    .argument('<size>', 'Order quantity')
    .argument('<coin>', 'Coin symbol (e.g. BTC)')
    .option('--reduce-only', 'Reduce-only order', false)
    .action(async (side: string, size: string, coin: string, opts: { reduceOnly: boolean }) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        const validSide = side.charAt(0).toUpperCase() + side.slice(1).toLowerCase();
        if (validSide !== 'Buy' && validSide !== 'Sell') {
          console.error('Side must be "buy" or "sell".');
          return;
        }
        validatePositiveNumber(size, 'size');
        await submitMarketOrder(client, {
          side: validSide as 'Buy' | 'Sell',
          qty: size,
          coin: validateSymbol(coin),
          category: config.category,
          reduceOnly: opts.reduceOnly,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  order
    .command('stop-loss')
    .description('Place a stop-loss order')
    .argument('<side>', 'Buy or Sell')
    .argument('<size>', 'Order quantity')
    .argument('<coin>', 'Coin symbol (e.g. BTC)')
    .argument('<price>', 'Limit price')
    .argument('<trigger>', 'Trigger price')
    .option('--reduce-only', 'Reduce-only order', false)
    .action(async (side: string, size: string, coin: string, price: string, trigger: string, opts: { reduceOnly: boolean }) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        const validSide = side.charAt(0).toUpperCase() + side.slice(1).toLowerCase();
        if (validSide !== 'Buy' && validSide !== 'Sell') {
          console.error('Side must be "buy" or "sell".');
          return;
        }
        validatePositiveNumber(size, 'size');
        validatePositiveNumber(price, 'price');
        validatePositiveNumber(trigger, 'trigger price');
        await submitStopLossOrder(client, {
          side: validSide as 'Buy' | 'Sell',
          qty: size,
          coin: validateSymbol(coin),
          price,
          triggerPrice: trigger,
          category: config.category,
          reduceOnly: opts.reduceOnly,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  order
    .command('take-profit')
    .description('Place a take-profit order')
    .argument('<side>', 'Buy or Sell')
    .argument('<size>', 'Order quantity')
    .argument('<coin>', 'Coin symbol (e.g. BTC)')
    .argument('<price>', 'Limit price')
    .argument('<trigger>', 'Trigger price')
    .option('--reduce-only', 'Reduce-only order', false)
    .action(async (side: string, size: string, coin: string, price: string, trigger: string, opts: { reduceOnly: boolean }) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        const validSide = side.charAt(0).toUpperCase() + side.slice(1).toLowerCase();
        if (validSide !== 'Buy' && validSide !== 'Sell') {
          console.error('Side must be "buy" or "sell".');
          return;
        }
        validatePositiveNumber(size, 'size');
        validatePositiveNumber(price, 'price');
        validatePositiveNumber(trigger, 'trigger price');
        await submitTakeProfitOrder(client, {
          side: validSide as 'Buy' | 'Sell',
          qty: size,
          coin: validateSymbol(coin),
          price,
          triggerPrice: trigger,
          category: config.category,
          reduceOnly: opts.reduceOnly,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  trade.addCommand(order);

  // --- cancel ---
  trade
    .command('cancel')
    .description('Cancel an order')
    .argument('<orderId>', 'Order ID to cancel')
    .requiredOption('--coin <symbol>', 'Coin symbol (e.g. BTC)')
    .action(async (orderId: string, opts: { coin: string }) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        await cancelOrder(client, {
          orderId,
          coin: validateSymbol(opts.coin),
          category: config.category,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  // --- cancel-all ---
  trade
    .command('cancel-all')
    .description('Cancel all orders')
    .option('--coin <symbol>', 'Filter by coin symbol')
    .option('-y, --yes', 'Skip confirmation', false)
    .action(async (opts: { coin?: string; yes: boolean }) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        const coin = opts.coin ? validateSymbol(opts.coin) : undefined;
        await cancelAllOrders(client, {
          coin,
          category: config.category,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  // --- set-leverage ---
  trade
    .command('set-leverage')
    .description('Set leverage for a symbol')
    .argument('<coin>', 'Coin symbol (e.g. BTC)')
    .argument('<leverage>', 'Leverage multiplier (e.g. 10)')
    .action(async (coin: string, leverage: string) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        validatePositiveNumber(leverage, 'leverage');
        await setLeverage(client, {
          coin: validateSymbol(coin),
          leverage,
          category: config.category,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  // --- amend ---
  trade
    .command('amend')
    .description('Amend an existing order')
    .argument('<orderId>', 'Order ID to amend')
    .requiredOption('--coin <symbol>', 'Coin symbol (e.g. BTC)')
    .option('--price <price>', 'New price')
    .option('--qty <qty>', 'New quantity')
    .action(async (orderId: string, opts: { coin: string; price?: string; qty?: string }) => {
      const config = getConfig(trade.parent?.opts() ?? {});
      let store;
      try {
        const resolved = resolveAccount(config);
        store = resolved.store;
        const { client } = resolved;
        await amendOrder(client, {
          orderId,
          coin: validateSymbol(opts.coin),
          category: config.category,
          price: opts.price,
          qty: opts.qty,
          jsonOutput: config.jsonOutput,
        });
      } catch (err) {
        handleError(err, config.jsonOutput);
      } finally {
        store?.close();
      }
    });

  return trade;
}
