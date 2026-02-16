import { Command } from 'commander';
import { createAccountCommand } from '../commands/account/index.js';
import { createMarketsCommand } from '../commands/markets/index.js';
import { createAssetCommand } from '../commands/asset/index.js';

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

  program.addCommand(createAccountCommand());
  program.addCommand(createMarketsCommand());
  program.addCommand(createAssetCommand());

  return program;
}
