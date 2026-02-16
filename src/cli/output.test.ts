import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatJson, formatTable, outputResult } from './output.js';
import type { OutputOptions } from './output.js';

describe('formatJson', () => {
  it('returns pretty-printed JSON string for an object', () => {
    const data = { name: 'BTC', price: 85000 };
    const result = formatJson(data);

    expect(result).toBe(JSON.stringify(data, null, 2));
    expect(JSON.parse(result)).toEqual(data);
  });

  it('handles arrays', () => {
    const data = [
      { symbol: 'BTC', price: 85000 },
      { symbol: 'ETH', price: 3200 },
    ];
    const result = formatJson(data);

    expect(result).toBe(JSON.stringify(data, null, 2));
    expect(JSON.parse(result)).toEqual(data);
  });

  it('handles null and primitive values', () => {
    expect(formatJson(null)).toBe('null');
    expect(formatJson(42)).toBe('42');
    expect(formatJson('hello')).toBe('"hello"');
    expect(formatJson(true)).toBe('true');
  });

  it('handles nested objects', () => {
    const data = { account: { id: '1', balances: { BTC: 0.5, ETH: 10 } } };
    const result = formatJson(data);

    expect(JSON.parse(result)).toEqual(data);
  });

  it('handles empty array', () => {
    const result = formatJson([]);
    expect(result).toBe('[]');
  });

  it('handles empty object', () => {
    const result = formatJson({});
    expect(result).toBe('{}');
  });
});

describe('formatTable', () => {
  it('formats data as a table string containing the header and row values', () => {
    const headers = ['Symbol', 'Price', 'Change'] as const;
    const rows = [
      ['BTC', '85000', '+2.5%'],
      ['ETH', '3200', '-1.2%'],
    ] as const;

    const result = formatTable(headers, rows);

    expect(result).toContain('Symbol');
    expect(result).toContain('Price');
    expect(result).toContain('Change');
    expect(result).toContain('BTC');
    expect(result).toContain('85000');
    expect(result).toContain('+2.5%');
    expect(result).toContain('ETH');
    expect(result).toContain('3200');
    expect(result).toContain('-1.2%');
  });

  it('handles empty rows', () => {
    const headers = ['Symbol', 'Price'] as const;
    const rows: readonly (readonly string[])[] = [];

    const result = formatTable(headers, rows);

    expect(result).toContain('Symbol');
    expect(result).toContain('Price');
  });

  it('handles single row', () => {
    const headers = ['Name'] as const;
    const rows = [['Alice']] as const;

    const result = formatTable(headers, rows);

    expect(result).toContain('Name');
    expect(result).toContain('Alice');
  });

  it('returns a string (not undefined)', () => {
    const result = formatTable(['H'], [['V']]);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('outputResult', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('outputs JSON when jsonOutput is true', () => {
    const data = { symbol: 'BTC', price: 85000 };

    outputResult({
      data,
      jsonOutput: true,
      headers: ['Symbol', 'Price'],
      toRow: (item) => [item.symbol, String(item.price)],
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(JSON.parse(output)).toEqual(data);
  });

  it('outputs table when jsonOutput is false', () => {
    const data = { symbol: 'BTC', price: 85000 };

    outputResult({
      data,
      jsonOutput: false,
      headers: ['Symbol', 'Price'],
      toRow: (item) => [item.symbol, String(item.price)],
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('Symbol');
    expect(output).toContain('BTC');
    expect(output).toContain('85000');
  });

  it('handles array data for JSON output', () => {
    const data = [
      { symbol: 'BTC', price: 85000 },
      { symbol: 'ETH', price: 3200 },
    ];

    outputResult({
      data,
      jsonOutput: true,
      headers: ['Symbol', 'Price'],
      toRow: (item) => [item.symbol, String(item.price)],
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(JSON.parse(output)).toEqual(data);
  });

  it('handles array data for table output', () => {
    const data = [
      { symbol: 'BTC', price: 85000 },
      { symbol: 'ETH', price: 3200 },
    ];

    outputResult({
      data,
      jsonOutput: false,
      headers: ['Symbol', 'Price'],
      toRow: (item) => [item.symbol, String(item.price)],
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('BTC');
    expect(output).toContain('85000');
    expect(output).toContain('ETH');
    expect(output).toContain('3200');
  });

  it('wraps single item in array for table output', () => {
    const data = { symbol: 'SOL', price: 150 };

    outputResult({
      data,
      jsonOutput: false,
      headers: ['Symbol', 'Price'],
      toRow: (item) => [item.symbol, String(item.price)],
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('SOL');
    expect(output).toContain('150');
  });

  it('outputs empty table for empty array', () => {
    const data: readonly { symbol: string; price: number }[] = [];

    outputResult({
      data,
      jsonOutput: false,
      headers: ['Symbol', 'Price'],
      toRow: (item) => [item.symbol, String(item.price)],
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('Symbol');
    expect(output).toContain('Price');
  });
});
