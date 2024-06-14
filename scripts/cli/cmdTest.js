#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

const {
  inspector,
} = require('../../src/plugins/lib');

const isDebug = false;

// Get argv for 'runOpcuaCommand'
const argv = yargs(hideBin(process.argv))
  .scriptName('cmdTest')
  .usage('Usage: $0 -c str')
  .example([['$0 -c "commandName"', 'Returns the commandName']])
  .option('command', {
    alias: 'c',
    describe: 'Command string for the script.',
    demandOption: 'The params is required.',
    type: 'string',
    nargs: 1,
  })
  .describe('help', 'Show command.') // Override --help usage message.
  .describe('version', 'Show version number.') // Override --version usage message.
  .epilog('copyright 2024')
  .argv;

  if (true && argv) inspector('Yargs.argv:', argv);

  // Run script
(function cmdTest(cliArgv) {
    console.log(chalk.green(`Run cmdTest command "${cliArgv.command}"`), 'result:', chalk.cyan('OK'));
})(argv);