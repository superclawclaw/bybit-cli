import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, isEncrypted } from './crypto.js';

describe('crypto', () => {
  const originalEnv = process.env['BYBIT_CLI_ENCRYPTION_KEY'];

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['BYBIT_CLI_ENCRYPTION_KEY'] = originalEnv;
    } else {
      delete process.env['BYBIT_CLI_ENCRYPTION_KEY'];
    }
  });

  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts a secret round-trip', () => {
      const secret = 'my-super-secret-api-key-12345';
      const encrypted = encrypt(secret);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(secret);
    });

    it('produces different ciphertexts for the same input (random IV)', () => {
      const secret = 'same-secret';
      const enc1 = encrypt(secret);
      const enc2 = encrypt(secret);

      expect(enc1).not.toBe(enc2);
    });

    it('encrypted output starts with enc: prefix', () => {
      const encrypted = encrypt('test');
      expect(encrypted.startsWith('enc:')).toBe(true);
    });

    it('handles empty string', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('handles unicode characters', () => {
      const secret = 'secret-with-unicode-\u00e9\u00e8\u00ea';
      const encrypted = encrypt(secret);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(secret);
    });

    it('handles long secrets', () => {
      const secret = 'a'.repeat(1000);
      const encrypted = encrypt(secret);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(secret);
    });
  });

  describe('isEncrypted', () => {
    it('returns true for encrypted values', () => {
      const encrypted = encrypt('test');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('returns false for plaintext values', () => {
      expect(isEncrypted('plain-api-secret')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });
  });

  describe('decrypt passthrough', () => {
    it('returns plaintext unchanged when not encrypted', () => {
      const plaintext = 'not-encrypted-secret';
      expect(decrypt(plaintext)).toBe(plaintext);
    });
  });

  describe('custom encryption key via env', () => {
    it('encrypts/decrypts with custom key', () => {
      process.env['BYBIT_CLI_ENCRYPTION_KEY'] = 'my-custom-key';
      const secret = 'secret-with-custom-key';
      const encrypted = encrypt(secret);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(secret);
    });

    it('fails to decrypt with wrong key', () => {
      process.env['BYBIT_CLI_ENCRYPTION_KEY'] = 'key-one';
      const encrypted = encrypt('my-secret');

      process.env['BYBIT_CLI_ENCRYPTION_KEY'] = 'key-two';
      expect(() => decrypt(encrypted)).toThrow();
    });
  });
});
