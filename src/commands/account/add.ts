import type { AccountStore } from '../../lib/db/accounts.js';

/**
 * Add a new account to the store.
 * Outputs success message to stdout, error to stderr.
 * Never includes apiSecret in output.
 */
export function addAccount(
  store: AccountStore,
  name: string,
  apiKey: string,
  apiSecret: string,
): void {
  try {
    store.add({ name, apiKey, apiSecret });
    console.log(`Account "${name}" added successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
  }
}
