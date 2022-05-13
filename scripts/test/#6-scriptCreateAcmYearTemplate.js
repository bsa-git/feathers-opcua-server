/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  inspector,
  getPathBasename
} = require('../../src/plugins/lib');

const {
  methodAcmYearTemplateCreate
} = require('../../src/plugins/opcua/opcua-methods');

const chalk = require('chalk');

const debug = require('debug')('app:#6-scriptCreateAcmYearTemplated');
const isDebug = false;

// Get argv
// e.g. argv.script='#1' =>  Update AddressSpaceOptions.json
// e.g. argv.script='#2' =>  Converter from `Fox` excel data `.csv` file to KEPServer
// e.g. argv.script='#3' =>  Converter from `Fox` hist data `.inp` file to KEPServer
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#6');

describe('<<=== ScriptOperations: (#6-scriptCreateAcmYearTemplate) ===>>', () => {

  if (!isScript) return;

  // Run opcua command
  it('#6: ScriptOperations: Create acm year template', async () => {
    let result;
    //-----------------
    let options = {
      point: [1, 2, 3]
    };
    // Run script
    if (Array.isArray(options.point)) {
      for (let index = 0; index < options.point.length; index++) {
        const point = options.point[index];
        result = await methodAcmYearTemplateCreate([{ value: point }]);
        if (isDebug && result) inspector('createAcmYearTemplate.result:', result);
        console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
      }
    } else {
      result = await methodAcmYearTemplateCreate([{ value: options.point }]);
      if (isDebug && result) inspector('createAcmYearTemplate.result:', result);
      console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
    }
    assert.ok(result.statusCode === 'Good', 'Create acm year template');
  });
});