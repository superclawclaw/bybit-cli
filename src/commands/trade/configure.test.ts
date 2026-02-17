import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  OrderConfig,
  loadOrderConfig,
  saveOrderConfig,
  formatOrderConfig,
  DEFAULT_ORDER_CONFIG,
} from './configure.js';

describe('DEFAULT_ORDER_CONFIG', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_ORDER_CONFIG.slippage).toBe(0.5);
    expect(DEFAULT_ORDER_CONFIG.defaultTimeInForce).toBe('GTC');
    expect(DEFAULT_ORDER_CONFIG.confirmBeforeSubmit).toBe(true);
  });
});

describe('loadOrderConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bb-config-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns default config when file does not exist', () => {
    const config = loadOrderConfig(tempDir);
    expect(config).toEqual(DEFAULT_ORDER_CONFIG);
  });

  it('loads config from existing file', () => {
    const configPath = join(tempDir, 'order-config.json');
    const custom: OrderConfig = {
      slippage: 1.0,
      defaultTimeInForce: 'IOC',
      confirmBeforeSubmit: false,
    };
    const { writeFileSync } = require('node:fs');
    writeFileSync(configPath, JSON.stringify(custom));

    const config = loadOrderConfig(tempDir);
    expect(config.slippage).toBe(1.0);
    expect(config.defaultTimeInForce).toBe('IOC');
    expect(config.confirmBeforeSubmit).toBe(false);
  });

  it('merges partial config with defaults', () => {
    const configPath = join(tempDir, 'order-config.json');
    const { writeFileSync } = require('node:fs');
    writeFileSync(configPath, JSON.stringify({ slippage: 2.5 }));

    const config = loadOrderConfig(tempDir);
    expect(config.slippage).toBe(2.5);
    expect(config.defaultTimeInForce).toBe('GTC');
    expect(config.confirmBeforeSubmit).toBe(true);
  });

  it('returns defaults on corrupt file', () => {
    const configPath = join(tempDir, 'order-config.json');
    const { writeFileSync } = require('node:fs');
    writeFileSync(configPath, 'not json');

    const config = loadOrderConfig(tempDir);
    expect(config).toEqual(DEFAULT_ORDER_CONFIG);
  });
});

describe('saveOrderConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bb-config-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('saves config to file', () => {
    const config: OrderConfig = {
      slippage: 1.5,
      defaultTimeInForce: 'PostOnly',
      confirmBeforeSubmit: false,
    };
    saveOrderConfig(tempDir, config);

    const raw = readFileSync(join(tempDir, 'order-config.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.slippage).toBe(1.5);
    expect(parsed.defaultTimeInForce).toBe('PostOnly');
  });

  it('creates directory if it does not exist', () => {
    const nestedDir = join(tempDir, 'nested', 'dir');
    const config: OrderConfig = { ...DEFAULT_ORDER_CONFIG, slippage: 3.0 };
    saveOrderConfig(nestedDir, config);

    const raw = readFileSync(join(nestedDir, 'order-config.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.slippage).toBe(3.0);
  });

  it('overwrites existing config', () => {
    saveOrderConfig(tempDir, { ...DEFAULT_ORDER_CONFIG, slippage: 1.0 });
    saveOrderConfig(tempDir, { ...DEFAULT_ORDER_CONFIG, slippage: 2.0 });

    const raw = readFileSync(join(tempDir, 'order-config.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.slippage).toBe(2.0);
  });
});

describe('formatOrderConfig', () => {
  it('formats config as key-value pairs', () => {
    const rows = formatOrderConfig(DEFAULT_ORDER_CONFIG);
    expect(rows).toEqual([
      ['slippage', '0.5%'],
      ['defaultTimeInForce', 'GTC'],
      ['confirmBeforeSubmit', 'true'],
    ]);
  });

  it('formats custom config', () => {
    const rows = formatOrderConfig({
      slippage: 2.0,
      defaultTimeInForce: 'IOC',
      confirmBeforeSubmit: false,
    });
    expect(rows).toEqual([
      ['slippage', '2%'],
      ['defaultTimeInForce', 'IOC'],
      ['confirmBeforeSubmit', 'false'],
    ]);
  });
});
