import chalk from 'chalk';

const RULE = '═'.repeat(64);
const DIVIDER = '─'.repeat(64);

export function displayTxtRecords(records) {
  console.log('\n' + chalk.bold.yellow('  DNS TXT Records to Add'));
  console.log(chalk.yellow('  ' + DIVIDER));
  for (const { name, value } of records) {
    console.log(chalk.cyan('  Name:  ') + chalk.white.bold(name));
    console.log(chalk.cyan('  Value: ') + chalk.green(value));
    console.log(chalk.yellow('  ' + DIVIDER));
  }
  console.log();
}

export function displayPropagationStatus(results) {
  process.stdout.write('\r\x1b[K');
  for (const { name, propagated } of results) {
    const icon = propagated ? chalk.green('✓') : chalk.yellow('⏳');
    const status = propagated ? chalk.green('propagated') : chalk.yellow('pending...');
    console.log(`  ${icon}  ${chalk.gray(name)}: ${status}`);
  }
}

export function displayCerts({ cert, key, ca }) {
  printBox('Certificate (CRT)', cert, chalk.green);
  printBox('Private Key', key, chalk.yellow);
  printBox('CA Bundle', ca, chalk.cyan);
}

function printBox(label, content, colorFn) {
  console.log('\n' + colorFn(`╔${RULE}╗`));
  console.log(colorFn(`║  ${label.padEnd(62)}║`));
  console.log(colorFn(`╠${RULE}╣`));
  console.log(content.trim());
  console.log(colorFn(`╚${RULE}╝`));
}

export const log = {
  info:    (msg) => console.log(chalk.blue('ℹ  ') + msg),
  success: (msg) => console.log(chalk.green('✓  ') + msg),
  warn:    (msg) => console.log(chalk.yellow('⚠  ') + msg),
  error:   (msg) => console.error(chalk.red('✗  ') + msg),
  step:    (n, msg) => console.log('\n' + chalk.bold.white(`[${n}]`) + ' ' + chalk.bold(msg)),
};
