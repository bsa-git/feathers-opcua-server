#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

const {
  inspector,
  getPathBasename
} = require('../../src/plugins/lib');

const {
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const { AttributeIds, OPCUAClient, DataType, VariantArrayType } = require('node-opcua');
const endpointUrl = 'opc.tcp://localhost:26570'; //  opc.tcp://BSA-HOME:26570

// Get argv
const argv = yargs(hideBin(process.argv))
  .scriptName('createOpcuaAcmYearTemplate')
  .usage('Usage: $0 -p num')
  .example(
    '$0 -p 2',
    'Returns the file name (acmYearTemplate2-2022.xlsx) when creating a template for the reporting period.'
  )
  .option('p', {
    alias: 'point',
    describe: 'Point number for the script.',
    demandOption: 'The params is required.',
    type: 'number',
    nargs: 1,
  })
  .describe('help', 'Show help.') // Override --help usage message.
  .describe('version', 'Show version number.') // Override --version usage message.
  .epilog('copyright 2022')
  .argv;

const isDebug = false;

const sessionWrite = async (session, params) => {
  const nodeToWrite = {
    nodeId: params.nodeId,// ns=1;s=CH_M5_ACM::VariableForWrite
    attributeId: AttributeIds.Value,
    value: {
      value: {
        dataType: DataType.String,
        value: 'Start',
      }
    }
  };

  // Set input argument
  // const inputArgument = {
  //   isTest: true,
  //   pointID: 2,
  //   reportingPeriod: [1, 'months'],
  //   // startYear: 2020,
  // };
  // const inputArguments = [[
  //   {
  //     dataType: DataType.String,
  //     value: JSON.stringify(inputArgument),
  //   }
  // ]];

  const statusCode = await session.write(nodeToWrite);
  // console.log("write statusCode = ", statusCode.toString());
  // console.log(chalk.green('Run script - OK!'), 'statusCode:', chalk.cyan(statusCode.toString()));
  return statusCode.toString();
};

(async function createOpcuaAcmYearTemplate() {

  if (isDebug && argv) inspector('Yargs.argv:', argv);

  // Run script
  const result = await opcuaClientSessionAsync(endpointUrl, {nodeId: 'ns=1;s=CH_M5::RunCommand'}, sessionWrite);
  console.log(chalk.green('Run script - OK!'), 'result:', chalk.cyan(result));

})();