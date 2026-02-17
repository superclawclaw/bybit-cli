import chalk from 'chalk';

export class CliError extends Error {
  readonly code: string;
  readonly suggestion: string;

  constructor(message: string, code: string, suggestion: string) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.suggestion = suggestion;
  }
}

export class ApiKeyNotFoundError extends CliError {
  constructor() {
    super(
      "No account configured. Run 'bb account add' first.",
      'API_KEY_NOT_FOUND',
      "Run 'bb account add' to set up an account.",
    );
  }
}

export class InsufficientBalanceError extends CliError {
  constructor(message?: string) {
    super(
      message ?? 'Insufficient balance for this operation.',
      'INSUFFICIENT_BALANCE',
      'Check your balance with: bb account balances',
    );
  }
}

export class InvalidSymbolError extends CliError {
  constructor(symbol: string) {
    super(
      `Invalid or unsupported symbol: ${symbol}`,
      'INVALID_SYMBOL',
      'View available symbols with: bb markets ls',
    );
  }
}

export class RateLimitError extends CliError {
  constructor() {
    super(
      'API rate limit exceeded.',
      'RATE_LIMIT',
      'Please wait a moment and try again.',
    );
  }
}

export class NetworkError extends CliError {
  constructor(message?: string) {
    super(
      message ?? 'Network error: unable to reach Bybit API.',
      'NETWORK_ERROR',
      'Check your internet connection and try again.',
    );
  }
}

export class AuthenticationError extends CliError {
  constructor(message?: string) {
    super(
      message ?? 'Authentication failed: invalid API key or secret.',
      'AUTH_ERROR',
      "Verify your API key and secret with 'bb account ls', or re-add with 'bb account add'.",
    );
  }
}

export function mapBybitError(retCode: number, retMsg: string): CliError {
  // Network-level errors (retCode 0 with error message)
  if (retCode === 0 && (retMsg.includes('ECONNREFUSED') || retMsg.includes('ETIMEDOUT') || retMsg.includes('ENOTFOUND'))) {
    return new NetworkError(retMsg);
  }

  switch (retCode) {
    case 10003:
    case 10004:
    case 10005:
      return new AuthenticationError(retMsg);
    case 10006:
      return new RateLimitError();
    case 110001:
      return new InvalidSymbolError(retMsg);
    case 110007:
      return new InsufficientBalanceError(retMsg);
    default:
      return new CliError(
        `API error (${retCode}): ${retMsg}`,
        'API_ERROR',
        'Check the Bybit API documentation or try again.',
      );
  }
}

function toCliError(err: unknown): CliError {
  if (err instanceof CliError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new CliError(message, 'UNKNOWN', 'An unexpected error occurred.');
}

export function formatError(err: unknown): string {
  const cliErr = toCliError(err);
  const lines = [
    chalk.red(`Error [${cliErr.code}]: ${cliErr.message}`),
    chalk.yellow(`Suggestion: ${cliErr.suggestion}`),
  ];
  return lines.join('\n');
}

export function formatErrorJson(err: unknown): string {
  const cliErr = toCliError(err);
  return JSON.stringify({
    error: cliErr.message,
    code: cliErr.code,
    suggestion: cliErr.suggestion,
  }, null, 2);
}

export function handleError(err: unknown, jsonOutput: boolean): void {
  if (jsonOutput) {
    console.error(formatErrorJson(err));
  } else {
    console.error(formatError(err));
  }
}
