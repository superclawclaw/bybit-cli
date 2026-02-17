import { Command } from 'commander';
import { AccountStore } from '../../lib/db/accounts.js';
import { getConfig } from '../../lib/config.js';
import { createRestClient, createWsClient } from '../../lib/bybit.js';
import { addAccount, interactiveAdd } from './add.js';
import { listAccounts } from './ls.js';
import { removeAccount } from './remove.js';
import { setDefaultAccount } from './set-default.js';
import { fetchAndDisplayBalances } from './balances.js';
import { fetchAndDisplayPositions } from './positions.js';
import { fetchAndDisplayOrders } from './orders.js';
import { fetchAndDisplayPortfolio } from './portfolio.js';
import { transformWalletUpdate, transformPositionUpdate, transformOrderUpdate } from './watch.js';
import { buildWatchConfig } from '../../cli/ink/WatchApp.js';

/**
 * Create the `account` command group with all subcommands.
 * Each subcommand manages the AccountStore lifecycle (open, operate, close).
 */
export function createAccountCommand(): Command {
  const account = new Command('account').description('Manage accounts');

  account
    .command('add')
    .description('Add a new account (interactive if no args)')
    .argument('[name]', 'Account name')
    .argument('[apiKey]', 'Bybit API key')
    .argument('[apiSecret]', 'Bybit API secret')
    .action(async (name?: string, apiKey?: string, apiSecret?: string) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        if (name && apiKey && apiSecret) {
          addAccount(store, name, apiKey, apiSecret);
        } else if (!name && !apiKey && !apiSecret) {
          await interactiveAdd(store, config.testnet);
        } else {
          console.error('Usage: bb account add <name> <apiKey> <apiSecret>');
          console.error('       bb account add  (interactive mode)');
        }
      } finally {
        store.close();
      }
    });

  account
    .command('ls')
    .description('List all accounts')
    .action(() => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        listAccounts(store, config.jsonOutput);
      } finally {
        store.close();
      }
    });

  account
    .command('remove')
    .description('Remove an account')
    .argument('<name>', 'Account name to remove')
    .action((name: string) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        removeAccount(store, name);
      } finally {
        store.close();
      }
    });

  account
    .command('set-default')
    .description('Set the default account')
    .argument('<name>', 'Account name to set as default')
    .action((name: string) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        setDefaultAccount(store, name);
      } finally {
        store.close();
      }
    });

  account
    .command('balances')
    .description('Show wallet balances')
    .option('-w, --watch', 'Watch mode (real-time updates)')
    .action(async (opts: { watch?: boolean }) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        const acct = config.accountId ? store.get(config.accountId) : store.getDefault();
        if (!acct) {
          console.error("No account configured. Run 'bb account add' first.");
          return;
        }
        if (opts.watch) {
          const { renderComponent } = await import('../../cli/ink/render.js');
          const { WatchApp } = await import('../../cli/ink/WatchApp.js');
          const { BalancesTable } = await import('../../cli/ink/components/BalancesTable.js');
          const React = await import('react');
          const wsClient = createWsClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
          const watchConfig = buildWatchConfig({ topicType: 'wallet', isPrivate: true });
          renderComponent(
            React.createElement(WatchApp, {
              wsClient,
              config: watchConfig,
              initialData: [],
              transformUpdate: transformWalletUpdate,
              children: (data) => React.createElement(BalancesTable, { balances: data }),
            }),
          );
          return;
        }
        const client = createRestClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
        await fetchAndDisplayBalances(client, 'UNIFIED', config.jsonOutput);
      } finally {
        if (!opts.watch) store.close();
      }
    });

  account
    .command('positions')
    .description('Show open positions')
    .option('-w, --watch', 'Watch mode (real-time updates)')
    .action(async (opts: { watch?: boolean }) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        const acct = config.accountId ? store.get(config.accountId) : store.getDefault();
        if (!acct) {
          console.error("No account configured. Run 'bb account add' first.");
          return;
        }
        if (opts.watch) {
          const { renderComponent } = await import('../../cli/ink/render.js');
          const { WatchApp } = await import('../../cli/ink/WatchApp.js');
          const { PositionsTable } = await import('../../cli/ink/components/PositionsTable.js');
          const React = await import('react');
          const wsClient = createWsClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
          const watchConfig = buildWatchConfig({ topicType: 'position', isPrivate: true });
          renderComponent(
            React.createElement(WatchApp, {
              wsClient,
              config: watchConfig,
              initialData: [],
              transformUpdate: transformPositionUpdate,
              children: (data) => React.createElement(PositionsTable, { positions: data }),
            }),
          );
          return;
        }
        const client = createRestClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
        await fetchAndDisplayPositions(client, config.category, config.jsonOutput);
      } finally {
        if (!opts.watch) store.close();
      }
    });

  account
    .command('orders')
    .description('Show open orders')
    .option('-w, --watch', 'Watch mode (real-time updates)')
    .action(async (opts: { watch?: boolean }) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        const acct = config.accountId ? store.get(config.accountId) : store.getDefault();
        if (!acct) {
          console.error("No account configured. Run 'bb account add' first.");
          return;
        }
        if (opts.watch) {
          const { renderComponent } = await import('../../cli/ink/render.js');
          const { WatchApp } = await import('../../cli/ink/WatchApp.js');
          const { OrdersTable } = await import('../../cli/ink/components/OrdersTable.js');
          const React = await import('react');
          const wsClient = createWsClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
          const watchConfig = buildWatchConfig({ topicType: 'order', isPrivate: true });
          renderComponent(
            React.createElement(WatchApp, {
              wsClient,
              config: watchConfig,
              initialData: [],
              transformUpdate: transformOrderUpdate,
              children: (data) => React.createElement(OrdersTable, { orders: data }),
            }),
          );
          return;
        }
        const client = createRestClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
        await fetchAndDisplayOrders(client, config.category, config.jsonOutput);
      } finally {
        if (!opts.watch) store.close();
      }
    });

  account
    .command('portfolio')
    .description('Show combined balances and positions')
    .option('-w, --watch', 'Watch mode (real-time updates)')
    .action(async (opts: { watch?: boolean }) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        const acct = config.accountId ? store.get(config.accountId) : store.getDefault();
        if (!acct) {
          console.error("No account configured. Run 'bb account add' first.");
          return;
        }
        if (opts.watch) {
          const { renderComponent } = await import('../../cli/ink/render.js');
          const { PortfolioWatch } = await import('../../cli/ink/components/PortfolioWatch.js');
          const React = await import('react');
          const wsClient = createWsClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
          renderComponent(React.createElement(PortfolioWatch, { wsClient }));
          return;
        }
        const client = createRestClient({ apiKey: acct.apiKey, apiSecret: acct.apiSecret, testnet: config.testnet });
        await fetchAndDisplayPortfolio(client, 'UNIFIED', config.category, config.jsonOutput);
      } finally {
        if (!opts.watch) store.close();
      }
    });

  return account;
}
