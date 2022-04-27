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
  .usage('Usage: $0 -c str -p 2 -o str')
  .example([
    ['$0 -c "ch-m5CreateAcmYearTemplate" -p 2 -o "{ \'url\': \'opc.tcp://localhost:26575\' }"',
    'Returns the file name (acmYearTemplate2-2022.xlsx) when creating a template for the reporting period.']
  ])
  .option('command', {
    alias: 'c',
    describe: 'Command string for the script.',
    demandOption: 'The params is required.',
    type: 'string',
    nargs: 1,
  })
  .option('point', {
    alias: 'p',
    describe: 'Point number for the script.',
    demandOption: false,
    type: 'number',
    nargs: 1,
  })
  .option('options', {
    alias: 'o',
    describe: 'Options string for the script.',
    demandOption: false,
    default: '{ "url": "opc.tcp://localhost:26570" }',
    type: 'string',
    nargs: 1,
  })
  .describe('help', 'Show help.') // Override --help usage message.
  .describe('version', 'Show version number.') // Override --version usage message.
  .epilog('copyright 2022')
  .argv;


if (isDebug && argv) inspector('Yargs.argv:', argv);
// Convert argv.options to json format
let argvOptions = strReplace(argv.options, '\'', '"');
argvOptions = JSON.parse(argvOptions);
// Add propertys for argvOptions
argvOptions.command = argv.command;
if(argv.point) argvOptions.point = argv.point;  

// Run script
(async function runOpcuaCommand(options) {
  const nodeId = checkRunCommand(options);
  if(nodeId){
    options.nodeId = nodeId;
  } else {
    // Command error
    inspector('runOpcuaCommand.options:', options);
    throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
  }
  const result = await opcuaClientSessionAsync(options.url, options, callbackSessionWrite);
  console.log(chalk.green(`Run session write command "${options.command}" - OK!`), 'result:', chalk.cyan(result));
})(argvOptions);