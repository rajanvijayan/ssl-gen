import { handleCertFlow } from './shared.js';

export async function regenerateCommand(domain, options) {
  await handleCertFlow(domain, options, 'regenerate');
}
