import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { formatJson, formatTable } from '../../cli/output.js';

export interface OrderConfig {
  readonly slippage: number;
  readonly defaultTimeInForce: string;
  readonly confirmBeforeSubmit: boolean;
}

export const DEFAULT_ORDER_CONFIG: OrderConfig = Object.freeze({
  slippage: 0.5,
  defaultTimeInForce: 'GTC',
  confirmBeforeSubmit: true,
});

const CONFIG_FILE = 'order-config.json';

export function loadOrderConfig(dataDir: string): OrderConfig {
  const filePath = join(dataDir, CONFIG_FILE);
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<OrderConfig>;
    return {
      slippage: typeof parsed.slippage === 'number' ? parsed.slippage : DEFAULT_ORDER_CONFIG.slippage,
      defaultTimeInForce: typeof parsed.defaultTimeInForce === 'string' ? parsed.defaultTimeInForce : DEFAULT_ORDER_CONFIG.defaultTimeInForce,
      confirmBeforeSubmit: typeof parsed.confirmBeforeSubmit === 'boolean' ? parsed.confirmBeforeSubmit : DEFAULT_ORDER_CONFIG.confirmBeforeSubmit,
    };
  } catch {
    return DEFAULT_ORDER_CONFIG;
  }
}

export function saveOrderConfig(dataDir: string, config: OrderConfig): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  const filePath = join(dataDir, CONFIG_FILE);
  writeFileSync(filePath, JSON.stringify(config, null, 2));
}

const HEADERS = ['Setting', 'Value'] as const;

export function formatOrderConfig(config: OrderConfig): readonly (readonly string[])[] {
  return [
    ['slippage', `${config.slippage}%`],
    ['defaultTimeInForce', config.defaultTimeInForce],
    ['confirmBeforeSubmit', String(config.confirmBeforeSubmit)],
  ];
}

export function displayOrderConfig(config: OrderConfig, jsonOutput: boolean): void {
  if (jsonOutput) {
    console.log(formatJson(config));
    return;
  }
  console.log(formatTable(HEADERS, formatOrderConfig(config)));
}
