import chalk from 'chalk';
import { runIssueForRecords, runFinalRenew } from '../lib/acme.js';
import { checkPropagation } from '../lib/dns.js';
import { readCerts } from '../lib/certs.js';
import { displayTxtRecords, displayCerts, displayPropagationStatus, log } from '../utils/output.js';
import { waitForEnter } from '../utils/prompt.js';

export async function handleCertFlow(domain, options, mode) {
  const isRenew = mode === 'regenerate';
  const domains = options.skipWww ? [domain] : [domain, `www.${domain}`];

  console.log('\n' + chalk.bold.white('ssl-gen') + chalk.gray(' — ZeroSSL DNS-01 Certificate Tool'));
  console.log(chalk.gray('─'.repeat(50)));
  log.info(`Mode:      ${chalk.bold(mode)}`);
  log.info(`Domain(s): ${domains.map(d => chalk.cyan(d)).join(', ')}`);

  // Step 1: Get DNS TXT challenge records
  log.step(1, 'Requesting DNS challenge records from ZeroSSL...');
  let txtRecords;
  try {
    txtRecords = await runIssueForRecords(domains, isRenew);
  } catch (err) {
    log.error('Failed to get TXT records from acme.sh:');
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  // Step 2: Display TXT records
  log.step(2, 'Add these DNS TXT records to your DNS provider:');
  displayTxtRecords(txtRecords);

  // Step 3: Wait for user to add records
  await waitForEnter(
    chalk.bold.yellow('Press Enter after adding the TXT records to your DNS...')
  );

  // Step 4: Poll DNS propagation
  log.step(4, 'Checking DNS propagation (checks every 10s, timeout 5 min)...\n');
  try {
    await checkPropagation(txtRecords, (results) => {
      displayPropagationStatus(results);
    });
    log.success('All TXT records verified in DNS!');
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }

  // Step 5: Finalize certificate
  log.step(5, 'Finalizing certificate with acme.sh...\n');
  try {
    await runFinalRenew(domain);
    log.success('Certificate issued successfully!');
  } catch (err) {
    log.error(`Certificate issuance failed: ${err.message}`);
    process.exit(1);
  }

  // Step 6: Display certificate files
  log.step(6, 'Reading certificate files...');
  try {
    const certData = await readCerts(domain);
    log.success(`Files saved at: ${chalk.cyan(certData.certDir)}`);
    displayCerts(certData);
  } catch (err) {
    log.error(`Failed to read certificate files: ${err.message}`);
    process.exit(1);
  }

  console.log('\n' + chalk.bold.green('Done! Paste the CRT, Private Key, and CA Bundle into your hosting control panel.'));
  console.log(chalk.gray(`Certificate expires in ~90 days. Run: ${chalk.white(`ssl-gen regenerate ${domain}${options.skipWww ? ' --skip-www' : ''}`)}\n`));
}
