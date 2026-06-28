import { handleCertFlow } from './shared.js';

export async function generateCommand(domain, options) {
  await handleCertFlow(domain, options, 'generate');
}
