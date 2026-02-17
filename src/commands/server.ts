import { Command } from 'commander';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getConfig } from '../lib/config.js';
import { getServerStatus, writePid, removePid, readPid, isProcessRunning } from '../server/server.js';
import { formatJson } from '../cli/output.js';
import chalk from 'chalk';

export function createServerCommand(): Command {
  const server = new Command('server').description('Background WebSocket cache server');

  server
    .command('start')
    .description('Start background cache server')
    .action(async () => {
      const config = getConfig(server.parent?.opts() ?? {});
      const status = getServerStatus(config.dataDir);

      if (status.running) {
        console.log(`Server already running (PID ${status.pid}).`);
        return;
      }

      const serverScript = join(dirname(fileURLToPath(import.meta.url)), '..', 'server', 'daemon.js');

      const child = spawn(process.execPath, [serverScript], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          BB_DATA_DIR: config.dataDir,
          BB_TESTNET: config.testnet ? '1' : '0',
        },
      });

      if (child.pid) {
        writePid(config.dataDir, child.pid);
        child.unref();
        console.log(`Server started (PID ${child.pid}).`);
      } else {
        console.error('Failed to start server.');
      }
    });

  server
    .command('stop')
    .description('Stop background cache server')
    .action(() => {
      const config = getConfig(server.parent?.opts() ?? {});
      const pid = readPid(config.dataDir);

      if (pid === null) {
        console.log('Server is not running.');
        return;
      }

      if (!isProcessRunning(pid)) {
        removePid(config.dataDir);
        console.log('Server was not running (stale PID removed).');
        return;
      }

      try {
        process.kill(pid, 'SIGTERM');
        removePid(config.dataDir);
        console.log(`Server stopped (PID ${pid}).`);
      } catch {
        console.error(`Failed to stop server (PID ${pid}).`);
      }
    });

  server
    .command('status')
    .description('Show server status')
    .action(() => {
      const config = getConfig(server.parent?.opts() ?? {});
      const status = getServerStatus(config.dataDir);

      if (config.jsonOutput) {
        console.log(formatJson(status));
        return;
      }

      if (status.running) {
        console.log(chalk.green(`Server running (PID ${status.pid})`));
      } else {
        console.log(chalk.yellow('Server not running'));
      }
    });

  return server;
}
