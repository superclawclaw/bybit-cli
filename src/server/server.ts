import { readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PID_FILE = 'server.pid';

export interface ServerStatus {
  readonly running: boolean;
  readonly pid: number | null;
}

export function getPidFilePath(dataDir: string): string {
  return join(dataDir, PID_FILE);
}

export function writePid(dataDir: string, pid: number): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  writeFileSync(getPidFilePath(dataDir), String(pid));
}

export function readPid(dataDir: string): number | null {
  try {
    const content = readFileSync(getPidFilePath(dataDir), 'utf-8').trim();
    const pid = Number(content);
    if (Number.isNaN(pid) || pid <= 0) return null;
    return pid;
  } catch {
    return null;
  }
}

export function removePid(dataDir: string): void {
  try {
    unlinkSync(getPidFilePath(dataDir));
  } catch {
    // file doesn't exist, nothing to do
  }
}

export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function getServerStatus(dataDir: string): ServerStatus {
  const pid = readPid(dataDir);
  if (pid === null) {
    return { running: false, pid: null };
  }
  if (isProcessRunning(pid)) {
    return { running: true, pid };
  }
  // Stale PID file — process no longer running
  removePid(dataDir);
  return { running: false, pid: null };
}
