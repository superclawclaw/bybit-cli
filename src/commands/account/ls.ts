import type { AccountStore } from '../../lib/db/accounts.js';
import { formatJson, formatTable } from '../../cli/output.js';

/**
 * Mask an API key: show first 4 characters followed by "****".
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) {
    return '****';
  }
  return `${apiKey.slice(0, 4)}****`;
}

/**
 * Public account info shape for JSON output.
 * NEVER includes apiSecret.
 */
interface AccountListItem {
  readonly name: string;
  readonly apiKey: string;
  readonly isDefault: boolean;
}

/**
 * List all configured accounts.
 * - JSON mode: outputs array of { name, apiKey (full), isDefault } -- no apiSecret
 * - Table mode: shows Name, API Key (masked), Default columns
 * - Empty: prints a helpful message
 */
export function listAccounts(store: AccountStore, jsonOutput: boolean): void {
  const accounts = store.list();

  if (accounts.length === 0) {
    console.log("No accounts configured. Run 'bb account add' to add one.");
    return;
  }

  const items: readonly AccountListItem[] = accounts.map((a) => ({
    name: a.name,
    apiKey: a.apiKey,
    isDefault: a.isDefault,
  }));

  if (jsonOutput) {
    console.log(formatJson(items));
    return;
  }

  const headers = ['Name', 'API Key', 'Default'] as const;
  const rows = items.map((item) => [
    item.name,
    maskApiKey(item.apiKey),
    item.isDefault ? '*' : '',
  ] as const);

  console.log(formatTable(headers, rows));
}
