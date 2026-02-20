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

/**
 * Sensitive fields that must NEVER appear in logs or error output.
 */
const SENSITIVE_KEYS = new Set(['secret', 'apiSecret', 'key', 'apiKey', 'password', 'token']);

/**
 * Recursively strip sensitive fields from an object for safe logging.
 */
function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj == null) return obj;
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map((v) => sanitize(v, depth + 1));
  if (typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) {
        clean[k] = '[REDACTED]';
      } else {
        clean[k] = sanitize(v, depth + 1);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Extract a human-readable message from a bybit-api error object or any thrown value.
 * The bybit-api library throws plain objects with { code, message, body, requestOptions }.
 * requestOptions contains the API secret — it must never be surfaced.
 */
function toCliError(err: unknown): CliError {
  if (err instanceof CliError) return err;

  // Standard Error instances
  if (err instanceof Error) {
    return new CliError(err.message, 'UNKNOWN', 'An unexpected error occurred.');
  }

  // bybit-api throws plain objects: { code, message, body, headers, requestOptions }
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;

    // HTTP-level errors (403 geo-block, 429 rate-limit, etc.)
    if (typeof obj['code'] === 'number' && typeof obj['message'] === 'string') {
      const code = obj['code'] as number;
      const msg = obj['message'] as string;

      if (code === 403) {
        return new CliError(
          `HTTP 403 Forbidden — API access blocked (possible geo-restriction).`,
          'GEO_BLOCKED',
          'Check if a VPN/proxy is required for your region, or use --testnet.',
        );
      }

      if (code === 429) {
        return new RateLimitError();
      }

      return new CliError(
        `HTTP ${code}: ${msg}`,
        'HTTP_ERROR',
        'Check your network connection and Bybit API status.',
      );
    }

    // Fallback: stringify safely (strip secrets)
    const safeStr = JSON.stringify(sanitize(obj));
    return new CliError(safeStr, 'UNKNOWN', 'An unexpected error occurred.');
  }

  return new CliError(String(err), 'UNKNOWN', 'An unexpected error occurred.');
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
