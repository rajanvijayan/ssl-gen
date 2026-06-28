import { readFile, access } from 'fs/promises';
import path from 'path';
import { ACME_HOME } from '../utils/config.js';

/**
 * Read certificate files from ~/.acme.sh/<domain>_ecc/ (ECC) or <domain>/ (RSA fallback).
 */
export async function readCerts(domain) {
  const certDir = await resolveCertDir(domain);

  const [cert, key, ca] = await Promise.all([
    readFile(path.join(certDir, `${domain}.cer`), 'utf8'),
    readFile(path.join(certDir, `${domain}.key`), 'utf8'),
    readFile(path.join(certDir, 'ca.cer'), 'utf8'),
  ]);

  return { cert, key, ca, certDir };
}

async function resolveCertDir(domain) {
  const eccDir = path.join(ACME_HOME, `${domain}_ecc`);
  try {
    await access(eccDir);
    return eccDir;
  } catch {
    return path.join(ACME_HOME, domain);
  }
}
