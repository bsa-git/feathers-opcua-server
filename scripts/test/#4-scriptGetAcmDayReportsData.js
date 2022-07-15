/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  appRoot,
  inspector,
  getPathBasename,
  makeDirSync,
  removeFilesFromDirSync
} = require('../../src/plugins/lib');

const {
  methodAcmDayReportsDataGet
} = require('../../src/plugins/opcua/opcua-methods');

const chalk = require('chalk');

const debug = require('debug')('app:#6-scriptCreateAcmYearTemplated');
const isDebug = false;

const dataTestPath = '/test/data/tmp/excel-helper';

// Get argv
// e.g. argv.script='#4' =>  method -> 'methodAcmDayReportsDataGet'
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#4');

describe('<<=== ScriptOperations: (#4-scriptGetAcmDayReportsData) ===>>', () => {

  if (!isScript) return;

  before(() => {
    // Make dir
    makeDirSync([appRoot, dataTestPath]);
    // Remove files from dir
    removeFilesFromDirSync([appRoot, dataTestPath]);
  });

  // Run opcua command
  it('#4: ScriptOperations: Get acm day reports data', async () => {
    let result;
    //-----------------
    let options = {
      point: [1, 2, 3]
    };
    // Run script
    if (Array.isArray(options.point)) {
      for (let index = 0; index < options.point.length; index++) {
        const point = options.point[index];
        result = await methodAcmDayReportsDataGet([{ value: point }]);
        if (isDebug && result) inspector('getAcmDayReportsData.result:', result);
        if (result.resultPath) {
          console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
        } else {
          console.log(chalk.green('Run script - OK!'));
        }
      }
    } else {
      result = await methodAcmDayReportsDataGet([{ value: options.point }]);
      if (isDebug && result) inspector('getAcmDayReportsData.result:', result);
      if (result.resultPath) {
        console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
      } else {
        console.log(chalk.green('Run script - OK!'));
      }
    }
    assert.ok(result.statusCode === 'Good', 'Get acm day reports data');
  });
});
