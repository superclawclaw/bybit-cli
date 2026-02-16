import { describe, it, expect } from 'vitest';
import { validateSymbol, validateCategory, validatePositiveNumber } from './validation.js';

describe('validateSymbol', () => {
  it('accepts uppercase symbols unchanged', () => {
    expect(validateSymbol('BTC')).toBe('BTC');
    expect(validateSymbol('ETHUSDT')).toBe('ETHUSDT');
  });

  it('uppercases lowercase input', () => {
    expect(validateSymbol('btc')).toBe('BTC');
    expect(validateSymbol('ethUsdt')).toBe('ETHUSDT');
  });

  it('rejects empty string', () => {
    expect(() => validateSymbol('')).toThrow('Symbol cannot be empty');
  });

  it('rejects whitespace-only string', () => {
    expect(() => validateSymbol('   ')).toThrow('Symbol cannot be empty');
  });

  it('rejects special characters', () => {
    expect(() => validateSymbol('BTC!')).toThrow('Symbol must contain only alphanumeric characters');
    expect(() => validateSymbol('BTC-USD')).toThrow('Symbol must contain only alphanumeric characters');
    expect(() => validateSymbol('BTC/USDT')).toThrow('Symbol must contain only alphanumeric characters');
    expect(() => validateSymbol('BTC USDT')).toThrow('Symbol must contain only alphanumeric characters');
  });

  it('accepts numeric characters in symbol', () => {
    expect(validateSymbol('1000PEPE')).toBe('1000PEPE');
  });
});

describe('validateCategory', () => {
  it('accepts all 4 valid categories', () => {
    expect(validateCategory('linear')).toBe('linear');
    expect(validateCategory('spot')).toBe('spot');
    expect(validateCategory('inverse')).toBe('inverse');
    expect(validateCategory('option')).toBe('option');
  });

  it('rejects invalid category', () => {
    expect(() => validateCategory('futures')).toThrow(
      'Invalid category "futures". Must be one of: linear, spot, inverse, option'
    );
  });

  it('rejects empty string', () => {
    expect(() => validateCategory('')).toThrow(
      'Invalid category "". Must be one of: linear, spot, inverse, option'
    );
  });
});

describe('validatePositiveNumber', () => {
  it('accepts positive integers', () => {
    expect(validatePositiveNumber('10', 'quantity')).toBe(10);
    expect(validatePositiveNumber('1', 'quantity')).toBe(1);
  });

  it('accepts positive decimals', () => {
    expect(validatePositiveNumber('0.001', 'quantity')).toBe(0.001);
    expect(validatePositiveNumber('99.99', 'price')).toBe(99.99);
  });

  it('rejects zero', () => {
    expect(() => validatePositiveNumber('0', 'quantity')).toThrow(
      'quantity must be a positive number'
    );
  });

  it('rejects negative numbers', () => {
    expect(() => validatePositiveNumber('-5', 'price')).toThrow(
      'price must be a positive number'
    );
    expect(() => validatePositiveNumber('-0.01', 'quantity')).toThrow(
      'quantity must be a positive number'
    );
  });

  it('rejects non-numeric strings', () => {
    expect(() => validatePositiveNumber('abc', 'quantity')).toThrow(
      'quantity must be a valid number'
    );
    expect(() => validatePositiveNumber('', 'quantity')).toThrow(
      'quantity must be a valid number'
    );
  });

  it('rejects NaN-producing inputs', () => {
    expect(() => validatePositiveNumber('NaN', 'quantity')).toThrow(
      'quantity must be a valid number'
    );
    expect(() => validatePositiveNumber('Infinity', 'quantity')).toThrow(
      'quantity must be a valid number'
    );
  });
});
