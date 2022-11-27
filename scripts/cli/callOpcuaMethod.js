#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');
const loMerge = require('lodash/merge');

const {
  appRoot,
  inspector,
  strReplace
} = require('../../src/plugins/lib');

const {
  checkCallMethod,
  callbackSessionCallMethod,
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

let options = require(`${appRoot}/src/api/opcua/config/ClientSessOperOptions`);

const isDebug = false;

// Get argv for 'callOpcuaMethod'
const argv = yargs(hideBin(process.argv))
  .scriptName('callOpcuaMethod')
  .usage('Usage: $0 -m str --opt.point num')
  .example([
    ['$0 -m "ch_m5CreateAcmYearTemplate" --opt.point 2 --opt.test --opt.period 1 "months"  --opt.year 2020',
      'Returns the file name (acmYearTemplate2-2020.xlsx) when creating a template for the reporting period.'],
    ['$0 -m "ch_m5GetAcmDayReportsData" --opt.point 2 --opt.pattern "/**/DayHist*.xls"',
      'Returns the file name (acmDayReportsData2-20220223.json) for the reporting period.']
  ])
  .option('method', {
    alias: 'm',
    describe: 'Method name for the script.',
    demandOption: 'The params is required.',
    type: 'string',
    nargs: 1,
  })
  .option('opt')
  .default('opt.url', 'opc.tcp://localhost:26570', '(Endpoint URL)')
  .array('opt.period')
  // .array('opt.points')
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
(async function callOpcuaMethod(cliArgv) {
  options = loMerge({}, options, cliArgv);
  // Session call method options
  options.sessCallMethodOpts.showCallMethod = false;
  options.sessCallMethodOpts.nodesToCallMethod.objectId = '';
  options.sessCallMethodOpts.nodesToCallMethod.methodId = '';
  // Check call method options
  const checkResult = checkCallMethod(options);
  if (!checkResult) {
    // Method error
    inspector('callOpcuaMethod_ERROR.options:', options);
    throw new Error(`Method error. This method "${options.method}" does not exist or there are not enough options.`);
  }
  const result = await opcuaClientSessionAsync(options.opt.url, checkResult, callbackSessionCallMethod);
  if (isDebug && result) inspector('callOpcuaMethod.result:', result);
  console.log(chalk.green(`Run session call method "${options.method}" - OK!`), 'result:', chalk.cyan(result.statusCode));
})(argv);