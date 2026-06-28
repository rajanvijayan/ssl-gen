import readline from 'readline';

export function waitForEnter(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(message + ' ', () => {
      rl.close();
      resolve();
    });
  });
}
