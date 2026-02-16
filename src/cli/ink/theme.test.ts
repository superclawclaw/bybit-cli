import { describe, it, expect } from 'vitest';
import { theme, pnlColor } from './theme.js';

describe('theme', () => {
  it('has required color keys', () => {
    expect(theme.profit).toBeDefined();
    expect(theme.loss).toBeDefined();
    expect(theme.neutral).toBeDefined();
    expect(theme.accent).toBeDefined();
    expect(theme.muted).toBeDefined();
    expect(theme.header).toBeDefined();
    expect(theme.border).toBeDefined();
  });

  it('has hex color values', () => {
    const hexRegex = /^#[0-9a-f]{6}$/i;
    expect(theme.profit).toMatch(hexRegex);
    expect(theme.loss).toMatch(hexRegex);
    expect(theme.neutral).toMatch(hexRegex);
    expect(theme.accent).toMatch(hexRegex);
    expect(theme.muted).toMatch(hexRegex);
    expect(theme.header).toMatch(hexRegex);
    expect(theme.border).toMatch(hexRegex);
  });
});

describe('pnlColor', () => {
  it('returns profit color for positive values', () => {
    expect(pnlColor(100)).toBe(theme.profit);
  });

  it('returns profit color for small positive values', () => {
    expect(pnlColor(0.01)).toBe(theme.profit);
  });

  it('returns loss color for negative values', () => {
    expect(pnlColor(-50)).toBe(theme.loss);
  });

  it('returns loss color for small negative values', () => {
    expect(pnlColor(-0.01)).toBe(theme.loss);
  });

  it('returns neutral color for zero', () => {
    expect(pnlColor(0)).toBe(theme.neutral);
  });
});
