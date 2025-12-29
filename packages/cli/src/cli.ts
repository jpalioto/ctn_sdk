#!/usr/bin/env node

import { Command } from 'commander';
import { sendCommand } from './commands/send.js';

const program = new Command();

program
  .name('ctn')
  .description('CTN SDK Command Line Interface')
  .version('1.0.0');

program
  .command('send')
  .description('Send a prompt with optional CTN constraints')
  .argument('<prompt>', 'The prompt to send (may include @constraints)')
  .option('-p, --provider <provider>', 'Provider to use', 'anthropic')
  .option('-m, --model <model>', 'Model name or alias', 'sonnet')
  .option('-S, --strategy <name>', 'Strategy to use (operational, ctn)', 'operational')
  .option('-s, --stream', 'Stream the response')
  .option('--trace', 'Show composition and projection traces')
  .option('--dry-run', 'Show projected config without sending')
  .action(sendCommand);

program.parse();
