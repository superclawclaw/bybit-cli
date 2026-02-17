import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  getPidFilePath,
  readPid,
  writePid,
  removePid,
  isProcessRunning,
  getServerStatus,
  type ServerStatus,
} from './server.js';

describe('getPidFilePath', () => {
  it('returns path to server.pid in data dir', () => {
    const result = getPidFilePath('/home/user/.bybit-cli');
    expect(result).toBe('/home/user/.bybit-cli/server.pid');
  });
});

describe('PID file operations', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bb-server-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('writePid', () => {
    it('writes PID to file', () => {
      writePid(tempDir, 12345);
      const content = readFileSync(join(tempDir, 'server.pid'), 'utf-8');
      expect(content.trim()).toBe('12345');
    });

    it('creates directory if needed', () => {
      const nested = join(tempDir, 'nested');
      writePid(nested, 99999);
      expect(existsSync(join(nested, 'server.pid'))).toBe(true);
    });
  });

  describe('readPid', () => {
    it('returns PID from file', () => {
      writeFileSync(join(tempDir, 'server.pid'), '12345');
      expect(readPid(tempDir)).toBe(12345);
    });

    it('returns null when file does not exist', () => {
      expect(readPid(tempDir)).toBeNull();
    });

    it('returns null for corrupt file', () => {
      writeFileSync(join(tempDir, 'server.pid'), 'notanumber');
      expect(readPid(tempDir)).toBeNull();
    });
  });

  describe('removePid', () => {
    it('removes PID file', () => {
      writeFileSync(join(tempDir, 'server.pid'), '12345');
      removePid(tempDir);
      expect(existsSync(join(tempDir, 'server.pid'))).toBe(false);
    });

    it('does nothing if file does not exist', () => {
      expect(() => removePid(tempDir)).not.toThrow();
    });
  });
});

describe('isProcessRunning', () => {
  it('returns true for current process', () => {
    expect(isProcessRunning(process.pid)).toBe(true);
  });

  it('returns false for non-existent PID', () => {
    expect(isProcessRunning(9999999)).toBe(false);
  });
});

describe('getServerStatus', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bb-server-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns stopped when no PID file', () => {
    const status = getServerStatus(tempDir);
    expect(status.running).toBe(false);
    expect(status.pid).toBeNull();
  });

  it('returns stopped and cleans stale PID', () => {
    writeFileSync(join(tempDir, 'server.pid'), '9999999');
    const status = getServerStatus(tempDir);
    expect(status.running).toBe(false);
    expect(status.pid).toBeNull();
    expect(existsSync(join(tempDir, 'server.pid'))).toBe(false);
  });

  it('returns running for active process', () => {
    writeFileSync(join(tempDir, 'server.pid'), String(process.pid));
    const status = getServerStatus(tempDir);
    expect(status.running).toBe(true);
    expect(status.pid).toBe(process.pid);
  });
});
