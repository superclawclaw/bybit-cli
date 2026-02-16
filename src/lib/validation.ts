import type { Category } from './config.js';

const VALID_CATEGORIES: readonly Category[] = ['linear', 'spot', 'inverse', 'option'] as const;
const ALPHANUMERIC_PATTERN = /^[A-Z0-9]+$/;

export function validateSymbol(input: string): string {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    throw new Error('Symbol cannot be empty');
  }

  const uppercased = trimmed.toUpperCase();

  if (!ALPHANUMERIC_PATTERN.test(uppercased)) {
    throw new Error('Symbol must contain only alphanumeric characters');
  }

  return uppercased;
}

export function validateCategory(input: string): Category {
  if (!VALID_CATEGORIES.includes(input as Category) || input === '') {
    throw new Error(
      `Invalid category "${input}". Must be one of: ${VALID_CATEGORIES.join(', ')}`
    );
  }

  return input as Category;
}

export function validatePositiveNumber(input: string, name: string): number {
  const parsed = Number(input);

  if (input.trim() === '' || Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    throw new Error(`${name} must be a valid number`);
  }

  if (parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }

  return parsed;
}
