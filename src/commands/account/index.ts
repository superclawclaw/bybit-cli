import { Command } from 'commander';
import { AccountStore } from '../../lib/db/accounts.js';
import { getConfig } from '../../lib/config.js';
import { addAccount } from './add.js';
import { listAccounts } from './ls.js';
import { removeAccount } from './remove.js';
import { setDefaultAccount } from './set-default.js';

/**
 * Create the `account` command group with all subcommands.
 * Each subcommand manages the AccountStore lifecycle (open, operate, close).
 */
export function createAccountCommand(): Command {
  const account = new Command('account').description('Manage accounts');

  account
    .command('add')
    .description('Add a new account')
    .argument('<name>', 'Account name')
    .argument('<apiKey>', 'Bybit API key')
    .argument('<apiSecret>', 'Bybit API secret')
    .action((name: string, apiKey: string, apiSecret: string) => {
      const config = getConfig(account.parent?.opts() ?? {});
      const store = new AccountStore(config.dataDir);
      try {
        addAccount(store, name, apiKey, apiSecret);
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

  return account;
}
