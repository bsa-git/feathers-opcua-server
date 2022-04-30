#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

const {
  inspector,
  strReplace
} = require('../../src/plugins/lib');

const {
  checkRunCommand,
  callbackSessionWrite,
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const isDebug = false;

// Get argv
const argv = yargs(hideBin(process.argv))
  .scriptName('runOpcuaCommand')
  .usage('Usage: $0 -c str --opt.point num')
  .example([
    ['$0 -c "ch_m5CreateAcmYearTemplate" --opt.points 2 --opt.test --opt.period 1 "months"',
      'Returns the file name (acmYearTemplate2-2022.xlsx) when creating a template for the reporting period.']
  ])
  .option('command', {
    alias: 'c',
    describe: 'Command string for the script.',
    demandOption: 'The params is required.',
    type: 'string',
    nargs: 1,
  })
  .option('opt')
  .default('opt.url', 'opc.tcp://localhost:26570', '(Endpoint URL)')
  .array('opt.period')
  .array('opt.points')
  .boolean('opt.test')
  .coerce('opt', o => {
    // o.name = opt.name.toLowerCase()
    // o.password = '[SECRET]'
    return o;
  })
  .describe('help', 'Show help.') // Override --help usage message.
  .describe('version', 'Show version number.') // Override --version usage message.
  .epilog('copyright 2022')
  .argv;


if (isDebug && argv) inspector('Yargs.argv:', argv);

// Run script
(async function runOpcuaCommand(options) {
  const checkResult = checkRunCommand(options);
  if(checkResult){
    options.opt.nodeId = checkResult.nodeId;
    options.opt.browseName = checkResult.browseName;
  } else {
    // Command error
    inspector('runOpcuaCommand_ERROR.options:', options);
    throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
  }
  const result = await opcuaClientSessionAsync(options.opt.url, options, callbackSessionWrite);
  console.log(chalk.green(`Run session write command "${options.command}" - OK!`), 'result:', chalk.cyan(result));
})(argv);