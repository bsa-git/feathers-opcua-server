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
  formatSimpleDataValue,
} = require('../../src/plugins/opcua/opcua-helper');

const {
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const {
  AttributeIds,
  DataType,
  VariantArrayType
} = require('node-opcua');

const isDebug = false;

// Get argv
const argv = yargs(hideBin(process.argv))
  .scriptName('runOpcuaCommand')
  .usage('Usage: $0 -c str -p 2 -o str')
  .example(
    '$0 -c ""createAcmYearTemplate"" -p 2 -o "{ \'url\': \'opc.tcp://localhost:26570\' }"',
    'Returns the file name (acmYearTemplate2-2022.xlsx) when creating a template for the reporting period.'
  )
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
let options = strReplace(argv.options, '\'', '"');
options = JSON.parse(options);

/**
 * @async
 * @name sessionWrite
 * @param {Object} session 
 * @param {Object} params 
 * @returns {String}
 */
const sessionWrite = async (session, params) => {

  const nodeToWrite = {
    nodeId: params.nodeId,
    attributeId: AttributeIds.Value,
    value: {
      value: {
        dataType: DataType.String,
        value: argv.command,
      }
    }
  };

  const nodeToRead = {
    nodeId: params.nodeId,
    attributeId: AttributeIds.Value,
  };
  // Session write data
  const statusCode = await session.write(nodeToWrite);
  // Session read data
  let readValue = await session.read(nodeToRead);
  // Format simple DataValue
  readValue = formatSimpleDataValue(readValue);
  if (isDebug && readValue) inspector('sessionWrite.readValue:', readValue);

  return statusCode.name;
};

(async function runOpcuaCommand() {
  // Run script
  const result = await opcuaClientSessionAsync(options.url, { nodeId: 'ns=1;s=CH_M5::RunCommand' }, sessionWrite);
  console.log(chalk.green('Run script - OK!'), 'result:', chalk.cyan(result));

})();