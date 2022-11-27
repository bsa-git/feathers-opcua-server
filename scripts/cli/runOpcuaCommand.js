#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');
const loMerge = require('lodash/merge');

const {
  appRoot,
  inspector,
} = require('../../src/plugins/lib');

const {
  checkRunCommand,
  callbackSessionWrite,
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const {
  DataType,
} = require('node-opcua');


let options = require(`${appRoot}/src/api/opcua/config/ClientSessOperOptions`);

const isDebug = false;

// Get argv for 'runOpcuaCommand'
const argv = yargs(hideBin(process.argv))
  .scriptName('runOpcuaCommand')
  .usage('Usage: $0 -c str --opt.points num')
  .example([
    ['$0 -c "ch_m5CreateAcmYearTemplate" --opt.points 2 --opt.test --opt.period 1 "months" --opt.year 2020',
      'Returns the file name (acmYearTemplate2-2020.xlsx) when creating a template for the reporting period.'],
    ['$0 -c "ch_m5SyncStoreAcmValues" --opt.points 2 --opt.pattern "/**/DayHist*.xls"',
      'Returns the file name (acmDayReportsData2-20220223.json) for the reporting period.'],
    ['$0 -c "ch_m5SyncAcmYearReport" --opt.points 2 --opt.test --opt.pattern "/**/DayHist*.xls"',
      'Returns the file name (acmYearReport2-2022.xlsx) for the reporting period.']
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
(async function runOpcuaCommand(cliArgv) {
  options = loMerge({}, options, cliArgv);
  // Session write options
  options.sessWriteOpts.showWriteValues = true;
  options.sessWriteOpts.nodesToWrite.value.value.dataType = DataType.String;
  options.sessWriteOpts.nodesToWrite.value.value.value = '';
  // Check run command
  const checkResult = checkRunCommand(options);
  if (!checkResult) {
    // Command error
    inspector('runOpcuaCommand_ERROR.options:', options);
    throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
  }
  // Set value for write
  checkResult.sessWriteOpts.nodesToWrite.value.value.value = JSON.stringify(checkResult);
  // Run opcuaClientSessionAsync
  const result = await opcuaClientSessionAsync(options.opt.url, checkResult, callbackSessionWrite);
  if (isDebug && result) inspector('runOpcuaCommand.result:', result);
  console.log(chalk.green(`Run session write command "${options.command}" - OK!`), 'result:', chalk.cyan(result.statusCode));
})(argv);