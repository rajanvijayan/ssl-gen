import { execFile } from 'child_process';
import { promisify } from 'util';
import { DNS_POLL_INTERVAL_MS, DNS_TIMEOUT_MS, DNS_RESOLVER } from '../utils/config.js';

const execFileAsync = promisify(execFile);

/**
 * Poll DNS propagation for all TXT records.
 * Retries every DNS_POLL_INTERVAL_MS until all records are found or timeout.
 */
export async function checkPropagation(records, onProgress) {
  const deadline = Date.now() + DNS_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const results = await Promise.all(records.map(checkSingleRecord));

    onProgress(results);

    if (results.every(r => r.propagated)) return;

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(DNS_POLL_INTERVAL_MS, remaining));
  }

  throw new Error(
    'DNS propagation timed out after 5 minutes.\n' +
    'Verify the TXT records were saved correctly in your DNS provider and try again.'
  );
}

async function checkSingleRecord({ name, value }) {
  try {
    const { stdout } = await execFileAsync('dig', [
      'TXT', name, '+short', `@${DNS_RESOLVER}`,
    ], { timeout: 5000 });

    const propagated = stdout.includes(`"${value}"`);
    return { name, value, propagated };
  } catch {
    return { name, value, propagated: false };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
