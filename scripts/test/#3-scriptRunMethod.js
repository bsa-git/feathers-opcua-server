/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  appRoot,
  inspector,
  logger,
  getPathBasename,
  makeDirSync,
  removeFilesFromDirSync
} = require('../../src/plugins/lib');

const {
  methodAcmYearTemplateCreate,
  methodAcmDayReportsDataGet
} = require('../../src/plugins/opcua/opcua-methods');

const chalk = require('chalk');

const debug = require('debug')('app:#6-scriptCreateAcmYearTemplated');
const isDebug = false;

const dataTestPath = '/test/data/tmp/excel-helper';

// Get argv
// e.g. argv.script='#3.1' =>  method -> 'methodAcmYearTemplateCreate'
// e.g. argv.script='#3.2' =>  method -> 'methodAcmDayReportsDataGet'
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
// const isScript = (argv.script === '#3');

const script = argv.script.split('.')[0];
const isScript = (script === '#3');

describe('<<=== ScriptOperations: (#3-scriptRunMethod) ===>>', () => {

  if (!isScript) return;

  before(() => {
    // Make dir
    makeDirSync([appRoot, dataTestPath]);
    // Remove files from dir
    removeFilesFromDirSync([appRoot, dataTestPath]);
  });

  switch (argv.script) {
  case '#3.1':
    // Create acm year template
    it('#3: ScriptOperations: Create acm year template', async () => {
      let result;
      //-----------------
      let options = {
        point: [1, 2, 3]
      };
      try {
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
        assert.ok(result.statusCode === 'Good', '#3-scriptCreateAcmYearTemplate');
      } catch (error) {
        assert.ok(false, '#3-scriptCreateAcmYearTemplate');
      }
    });
    break;
  case '#3.2':
    // Get acm day reports data
    it('#3.2: ScriptOperations: Get acm day reports data', async () => {
      let result;
      //-----------------
      let options = {
        // point: [1, 2, 3]
        point: 2
      };

      try {
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
        assert.ok(result.statusCode === 'Good', '#3.2-scriptGetAcmDayReportsData');
      } catch (error) {
        assert.ok(false, '#3.2-scriptGetAcmDayReportsData');
      }
    });
    break;
  default:
    break;
  }


});
