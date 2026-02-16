import type { AccountStore } from '../../lib/db/accounts.js';

/**
 * Set an account as the default by name.
 * Outputs success message to stdout, error to stderr.
 */
export function setDefaultAccount(store: AccountStore, name: string): void {
  try {
    store.setDefault(name);
    console.log(`Account "${name}" set as default.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
  }
}
