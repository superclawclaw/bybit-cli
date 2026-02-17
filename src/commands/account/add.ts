import { input, password, confirm } from '@inquirer/prompts';
import type { AccountStore } from '../../lib/db/accounts.js';
import { createRestClient } from '../../lib/bybit.js';

export async function testConnectivity(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
): Promise<{ readonly success: boolean; readonly error?: string }> {
  try {
    const client = createRestClient({ apiKey, apiSecret, testnet });
    const response = await client.getWalletBalance({ accountType: 'UNIFIED' });
    if (response.retCode !== 0) {
      return { success: false, error: response.retMsg };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function interactiveAdd(
  store: AccountStore,
  testnet: boolean,
): Promise<void> {
  const name = await input({
    message: 'Account name:',
    validate: (v) => (v.trim().length > 0 ? true : 'Name is required'),
  });

  const apiKey = await input({
    message: 'API Key:',
    validate: (v) => (v.trim().length > 0 ? true : 'API Key is required'),
  });

  const apiSecret = await password({
    message: 'API Secret:',
    validate: (v) => (v.trim().length > 0 ? true : 'API Secret is required'),
  });

  console.log('Testing connectivity...');
  const result = await testConnectivity(apiKey, apiSecret, testnet);

  if (!result.success) {
    console.error(`Connection failed: ${result.error}`);
    console.error('Account was NOT saved. Check your API credentials and try again.');
    return;
  }

  console.log('Connection successful.');

  const setAsDefault = await confirm({
    message: 'Set as default account?',
    default: true,
  });

  try {
    store.add({ name: name.trim(), apiKey: apiKey.trim(), apiSecret });
    if (setAsDefault) {
      store.setDefault(name.trim());
    }
    console.log(`Account "${name.trim()}" added successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
  }
}

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
