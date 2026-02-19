#!/usr/bin/env node
import { createProgram } from './cli/program.js';
import chalk from 'chalk';

const program = createProgram();

program.parseAsync().catch((err: unknown) => {
  // bybit-api throws plain objects with {code, message, body}, not Error instances
  const errObj = err as Record<string, unknown> | null;
  const message = err instanceof Error
    ? err.message
    : (typeof errObj?.message === 'string' ? errObj.message : JSON.stringify(err));
  const code = typeof errObj?.code === 'number' ? errObj.code : 0;

  // Detect common network errors
  if (code === 403 || message.includes('Forbidden') || message.includes('403')) {
    console.error(chalk.red('✖ Network error: Bybit API returned 403 Forbidden'));
    console.error(chalk.yellow('  Possible causes:'));
    console.error(chalk.yellow('  • Your IP/region may be blocked by Bybit'));
    console.error(chalk.yellow('  • Try using a VPN or set HTTPS_PROXY env var'));
    console.error(chalk.yellow('  • Try --testnet for testing'));
  } else if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('ENOTFOUND')) {
    console.error(chalk.red('✖ Network error: Cannot reach Bybit API'));
    console.error(chalk.yellow('  Check your internet connection or proxy settings'));
  } else {
    console.error(chalk.red(`✖ Error: ${message}`));
  }

  process.exit(1);
});
