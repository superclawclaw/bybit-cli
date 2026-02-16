import type { AccountStore } from '../../lib/db/accounts.js';

/**
 * Remove an account from the store by name.
 * Outputs success message to stdout, error to stderr.
 */
export function removeAccount(store: AccountStore, name: string): void {
  try {
    store.remove(name);
    console.log(`Account "${name}" removed.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
  }
}
