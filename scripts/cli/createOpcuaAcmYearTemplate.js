#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

const {
  inspector,
  getPathBasename
} = require('../../src/plugins/lib');

const {
  methodAcmYearTemplateCreate
} = require('../../src/plugins/opcua/opcua-methods');

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

(async function createOpcuaAcmYearTemplate() {

  if (isDebug && argv) inspector('Yargs.argv:', argv);

  // Run script
  if (Array.isArray(argv.point)) {
    for (let index = 0; index < argv.point.length; index++) {
      const point = argv.point[index];
      const result = await methodAcmYearTemplateCreate([{ value: point }]);
      console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
    }
  } else {
    // const result = await methodAcmYearTemplateCreate([{ value: argv.point }]);
    const client = OPCUAClient.create({ endpointMustExist: false });

    await client.withSessionAsync(endpointUrl, async (session) => {

      const arrayOfvalues = new Uint16Array([2, 23, 23, 12, 24, 3, 25, 3, 26, 3, 27, 3, 28, 1, 43690, 1, 1261, 0, 0, 0, 0, 0, 0, 0]);
      const nodeToWrite = {
        nodeId: 'ns=1;s=CH_M5_ACM::VariableForWrite',// ns=1;s=CH_M5_ACM::VariableForWrite
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType: DataType.UInt16,
            arrayType: VariantArrayType.Array,
            value: arrayOfvalues,
          }
        }
      };
      const statusCode = await session.write(nodeToWrite);
      // console.log("write statusCode = ", statusCode.toString());
      console.log(chalk.green('Run script - OK!'), 'statusCode:', chalk.cyan(statusCode.toString()));
    });

    
  }

})();