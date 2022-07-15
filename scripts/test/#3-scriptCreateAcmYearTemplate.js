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
// e.g. argv.script='#3' =>  method -> 'methodAcmYearTemplateCreate'
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#3');

describe('<<=== ScriptOperations: (#3-scriptCreateAcmYearTemplate) ===>>', () => {

  if (!isScript) return;

  // Run opcua command
  it('#3: ScriptOperations: Create acm year template', async () => {
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
