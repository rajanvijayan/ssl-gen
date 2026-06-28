#!/usr/bin/env node
import { existsSync } from 'fs';
import { program } from 'commander';
import { generateCommand } from '../src/commands/generate.js';
import { regenerateCommand } from '../src/commands/regenerate.js';
import { ACME_PATH } from '../src/utils/config.js';

if (!existsSync(ACME_PATH)) {
  console.error(`Error: acme.sh not found at ${ACME_PATH}`);
  console.error('Install it: curl https://get.acme.sh | sh -s email=you@example.com');
  process.exit(1);
}

program
  .name('ssl-gen')
  .description('Generate trusted SSL certificates via ZeroSSL DNS-01 challenge')
  .version('1.0.0');

program
  .command('generate <domain>')
  .description('Issue a new SSL certificate for a domain')
  .option('--skip-www', 'Only certify <domain>, skip www.<domain>')
  .action(generateCommand);

program
  .command('regenerate <domain>')
  .description('Force-renew an existing SSL certificate')
  .option('--skip-www', 'Only certify <domain>, skip www.<domain>')
  .action(regenerateCommand);

program.parse();
