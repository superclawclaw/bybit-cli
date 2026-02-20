import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ApiKeyNotFoundError,
  InsufficientBalanceError,
  InvalidSymbolError,
  RateLimitError,
  NetworkError,
  AuthenticationError,
  CliError,
  mapBybitError,
  formatError,
  formatErrorJson,
} from './errors.js';

describe('CliError base class', () => {
  it('has code, message, and suggestion', () => {
    const err = new CliError('Something failed', 'UNKNOWN', 'Try again');
    expect(err.message).toBe('Something failed');
    expect(err.code).toBe('UNKNOWN');
    expect(err.suggestion).toBe('Try again');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('typed error classes', () => {
  it('ApiKeyNotFoundError has correct defaults', () => {
    const err = new ApiKeyNotFoundError();
    expect(err.code).toBe('API_KEY_NOT_FOUND');
    expect(err.message).toContain('No account configured');
    expect(err.suggestion).toContain('bb account add');
  });

  it('InsufficientBalanceError has correct defaults', () => {
    const err = new InsufficientBalanceError();
    expect(err.code).toBe('INSUFFICIENT_BALANCE');
    expect(err.suggestion).toContain('balance');
  });

  it('InvalidSymbolError includes the symbol', () => {
    const err = new InvalidSymbolError('FAKECOIN');
    expect(err.code).toBe('INVALID_SYMBOL');
    expect(err.message).toContain('FAKECOIN');
    expect(err.suggestion).toContain('bb markets ls');
  });

  it('RateLimitError has correct defaults', () => {
    const err = new RateLimitError();
    expect(err.code).toBe('RATE_LIMIT');
    expect(err.suggestion).toContain('wait');
  });

  it('NetworkError has correct defaults', () => {
    const err = new NetworkError();
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.suggestion).toContain('connection');
  });

  it('NetworkError accepts custom message', () => {
    const err = new NetworkError('DNS lookup failed');
    expect(err.message).toBe('DNS lookup failed');
  });

  it('AuthenticationError has correct defaults', () => {
    const err = new AuthenticationError();
    expect(err.code).toBe('AUTH_ERROR');
    expect(err.suggestion).toContain('API key');
  });
});

describe('mapBybitError', () => {
  it('maps retCode 10003 to AuthenticationError', () => {
    const err = mapBybitError(10003, 'Invalid API key');
    expect(err).toBeInstanceOf(AuthenticationError);
  });

  it('maps retCode 10004 to AuthenticationError', () => {
    const err = mapBybitError(10004, 'Invalid sign');
    expect(err).toBeInstanceOf(AuthenticationError);
  });

  it('maps retCode 10005 to AuthenticationError', () => {
    const err = mapBybitError(10005, 'Permission denied');
    expect(err).toBeInstanceOf(AuthenticationError);
  });

  it('maps retCode 10006 to RateLimitError', () => {
    const err = mapBybitError(10006, 'Too many requests');
    expect(err).toBeInstanceOf(RateLimitError);
  });

  it('maps retCode 110007 to InsufficientBalanceError', () => {
    const err = mapBybitError(110007, 'Insufficient balance');
    expect(err).toBeInstanceOf(InsufficientBalanceError);
  });

  it('maps retCode 110001 to InvalidSymbolError', () => {
    const err = mapBybitError(110001, 'Order not found');
    expect(err).toBeInstanceOf(InvalidSymbolError);
  });

  it('returns generic CliError for unknown retCode', () => {
    const err = mapBybitError(99999, 'Unknown error');
    expect(err).toBeInstanceOf(CliError);
    expect(err.code).toBe('API_ERROR');
    expect(err.message).toContain('99999');
  });

  it('maps network-like errors from exceptions', () => {
    const err = mapBybitError(0, 'ECONNREFUSED');
    expect(err).toBeInstanceOf(NetworkError);
  });

  it('maps timeout errors', () => {
    const err = mapBybitError(0, 'ETIMEDOUT something');
    expect(err).toBeInstanceOf(NetworkError);
  });
});

describe('formatError', () => {
  it('formats error with red color codes for terminal', () => {
    const err = new InvalidSymbolError('XYZ');
    const output = formatError(err);
    expect(output).toContain('XYZ');
    expect(output).toContain('INVALID_SYMBOL');
    expect(output).toContain('bb markets ls');
  });

  it('formats generic Error as CliError', () => {
    const err = new Error('something broke');
    const output = formatError(err);
    expect(output).toContain('something broke');
  });
});

describe('secret redaction (security)', () => {
  it('never leaks API secret from bybit-api error objects', () => {
    // bybit-api throws plain objects like this on HTTP errors
    const bybitError = {
      code: 403,
      message: 'Forbidden',
      body: '<html>blocked</html>',
      headers: { server: 'CloudFront' },
      requestOptions: {
        key: 'KKB5kZQ61lY6gU3tAs',
        secret: 'fuohvnPnrGUTkcXi46PXDvM0oJV6LOXKv3SW',
        testnet: false,
      },
    };
    const jsonOut = formatErrorJson(bybitError);
    const textOut = formatError(bybitError);

    // Must not contain the secret value anywhere
    expect(jsonOut).not.toContain('fuohvnPnrGUTkcXi46PXDvM0oJV6LOXKv3SW');
    expect(textOut).not.toContain('fuohvnPnrGUTkcXi46PXDvM0oJV6LOXKv3SW');
    // Must not contain the key value either
    expect(jsonOut).not.toContain('KKB5kZQ61lY6gU3tAs');
    expect(textOut).not.toContain('KKB5kZQ61lY6gU3tAs');
  });

  it('maps 403 to GEO_BLOCKED with helpful suggestion', () => {
    const bybitError = { code: 403, message: 'Forbidden' };
    const json = formatErrorJson(bybitError);
    const parsed = JSON.parse(json);
    expect(parsed.code).toBe('GEO_BLOCKED');
    expect(parsed.suggestion).toContain('VPN');
  });

  it('maps 429 to RATE_LIMIT', () => {
    const bybitError = { code: 429, message: 'Too Many Requests' };
    const json = formatErrorJson(bybitError);
    const parsed = JSON.parse(json);
    expect(parsed.code).toBe('RATE_LIMIT');
  });

  it('sanitizes nested secrets in unknown error objects', () => {
    const weirdError = {
      info: 'something',
      nested: { apiSecret: 'supersecret123', data: 'safe' },
    };
    const json = formatErrorJson(weirdError);
    expect(json).not.toContain('supersecret123');
    expect(json).toContain('[REDACTED]');
  });
});

describe('formatErrorJson', () => {
  it('returns structured JSON error', () => {
    const err = new ApiKeyNotFoundError();
    const json = formatErrorJson(err);
    const parsed = JSON.parse(json);
    expect(parsed.error).toContain('No account configured');
    expect(parsed.code).toBe('API_KEY_NOT_FOUND');
    expect(parsed.suggestion).toContain('bb account add');
  });

  it('formats generic Error as JSON', () => {
    const err = new Error('generic failure');
    const json = formatErrorJson(err);
    const parsed = JSON.parse(json);
    expect(parsed.error).toBe('generic failure');
    expect(parsed.code).toBe('UNKNOWN');
  });
});
