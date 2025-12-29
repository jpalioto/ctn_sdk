#!/usr/bin/env node

import { Command } from 'commander';
import { sendCommand } from './commands/send.js';
import { serveAction } from './commands/serve.js';

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
  .option('-m, --model <model>', 'Model name or alias')
  .option('-S, --strategy <name>', 'Strategy to use (operational, ctn)', 'operational')
  .option('-g, --ground <uri>', 'Ground prompt with content from URI (http/https)')
  .option('-s, --stream', 'Stream the response')
  .option('--trace', 'Show composition and projection traces')
  .option('--dry-run', 'Show projected config without sending')
  .action(sendCommand);

program
  .command('serve')
  .description('Start the CTN HTTP server')
  .option('--port <port>', 'Port to listen on', '14380')
  .action(serveAction);

program.parse();
