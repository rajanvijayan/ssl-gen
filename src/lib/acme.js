import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { ACME_PATH } from '../utils/config.js';

const execFileAsync = promisify(execFile);

const CODE_DNS_MANUAL = 3;

/**
 * Step 1: Run acme.sh to obtain DNS TXT challenge records.
 * Expected exit code is 3 (CODE_DNS_MANUAL) — this is normal, not an error.
 */
export async function runIssueForRecords(domains, isRenew) {
  const baseArgs = isRenew
    ? ['--renew', '--force', '--dns', '--ecc']
    : ['--issue', '--dns', '--keylength', 'ec-256'];

  const domainArgs = domains.flatMap(d => ['-d', d]);
  const args = [
    ...baseArgs,
    ...domainArgs,
    '--yes-I-know-dns-manual-mode-enough-go-ahead-please',
  ];

  const env = {
    ...process.env,
    NO_TIMESTAMP: '1',
  };

  let stdout = '';
  let stderr = '';

  try {
    const result = await execFileAsync(ACME_PATH, args, {
      env,
      maxBuffer: 2 * 1024 * 1024,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (err) {
    if (err.code === CODE_DNS_MANUAL || err.code === 1) {
      // Code 3 = DNS manual mode (expected). Code 1 = some acme.sh versions
      // use this when TXT records are printed and user action is needed.
      stdout = err.stdout || '';
      stderr = err.stderr || '';

      // If stderr contains the real error (not the DNS manual notice), re-throw
      if (
        err.code === 1 &&
        stderr &&
        !stderr.includes('dns manual mode') &&
        !stdout.includes('TXT value')
      ) {
        const detail = (stderr || stdout || err.message || '').trim();
        throw new Error(`acme.sh exited with code 1:\n${detail}`);
      }
    } else {
      const detail = (err.stderr || err.stdout || err.message || '').trim();
      throw new Error(`acme.sh exited with code ${err.code}:\n${detail}`);
    }
  }

  const records = parseTxtRecords(stdout);

  if (records.length === 0) {
    throw new Error(
      'acme.sh produced no TXT records.\nstdout:\n' + stdout + '\nstderr:\n' + stderr
    );
  }

  return records;
}

/**
 * Step 2: Finalize certificate after DNS has propagated.
 * Uses spawn with stdio: 'inherit' so the user sees live acme.sh output.
 */
export async function runFinalRenew(domain) {
  return new Promise((resolve, reject) => {
    const args = [
      '--renew',
      '-d', domain,
      '--dns',
      '--yes-I-know-dns-manual-mode-enough-go-ahead-please',
      '--ecc',
    ];

    const child = spawn(ACME_PATH, args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`acme.sh --renew exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn acme.sh: ${err.message}`));
    });
  });
}

/**
 * Parse TXT record name/value pairs from acme.sh stdout.
 * acme.sh outputs lines like:
 *   Domain: '_acme-challenge.example.com'
 *   TXT value: 'someBase64Value'
 */
function parseTxtRecords(output) {
  const records = [];
  const lines = output.split('\n');
  let pendingName = null;

  for (const line of lines) {
    const domainMatch = line.match(/Domain:\s+'([^']+)'/);
    if (domainMatch) {
      pendingName = domainMatch[1];
      continue;
    }

    const valueMatch = line.match(/TXT value:\s+'([^']+)'/);
    if (valueMatch && pendingName !== null) {
      records.push({ name: pendingName, value: valueMatch[1] });
      pendingName = null;
    }
  }

  return records;
}
