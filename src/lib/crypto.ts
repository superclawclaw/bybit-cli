import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'node:crypto';
import { hostname, userInfo } from 'node:os';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'bybit-cli-v1';
const KEY_LENGTH = 32;

/**
 * Encrypted payload format: base64(iv + authTag + ciphertext)
 * Prefix: "enc:" to distinguish from plaintext secrets.
 */
const ENCRYPTED_PREFIX = 'enc:';

function deriveKey(): Buffer {
  const envKey = process.env['BYBIT_CLI_ENCRYPTION_KEY'];
  if (envKey) {
    return scryptSync(envKey, SALT, KEY_LENGTH);
  }
  const machineId = `${hostname()}:${userInfo().username}`;
  return scryptSync(machineId, SALT, KEY_LENGTH);
}

export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, encrypted]);
  return `${ENCRYPTED_PREFIX}${payload.toString('base64')}`;
}

export function decrypt(ciphertext: string): string {
  if (!isEncrypted(ciphertext)) {
    return ciphertext;
  }

  const key = deriveKey();
  const payload = Buffer.from(ciphertext.slice(ENCRYPTED_PREFIX.length), 'base64');

  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}
