export const theme = {
  profit: '#00ff87',
  loss: '#ff5f5f',
  neutral: '#808080',
  accent: '#ffd700',
  muted: '#6c757d',
  header: '#87ceeb',
  border: '#4a4a4a',
} as const;

export type ThemeColor = (typeof theme)[keyof typeof theme];

export function pnlColor(value: number): string {
  if (value > 0) return theme.profit;
  if (value < 0) return theme.loss;
  return theme.neutral;
}
