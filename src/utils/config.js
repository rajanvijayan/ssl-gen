import os from 'os';
import path from 'path';

export const ACME_PATH = path.join(os.homedir(), '.acme.sh', 'acme.sh');
export const ACME_HOME = path.join(os.homedir(), '.acme.sh');
export const DNS_POLL_INTERVAL_MS = 10_000;
export const DNS_TIMEOUT_MS = 5 * 60 * 1000;
export const DNS_RESOLVER = '8.8.8.8';
