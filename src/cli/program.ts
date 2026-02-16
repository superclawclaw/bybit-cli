import { Command } from 'commander';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('bb')
    .description('Bybit DEX CLI')
    .version('0.1.0')
    .option('--json', 'Output JSON (for scripting)', false)
    .option('--testnet', 'Use testnet', false)
    .option('--account <id>', 'Use specific account')
    .option('--category <type>', 'Category: linear, spot, inverse, option', 'linear');

  return program;
}
