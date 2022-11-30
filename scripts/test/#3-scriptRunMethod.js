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
// e.g. argv.script='#all' =>  commands -> 'all'
// e.g. argv.script='#3' =>  commands -> 'all'
// e.g. argv.script='#3.1' =>  method -> 'methodAcmYearTemplateCreate'
// e.g. argv.script='#3.2' =>  method -> 'methodAcmDayReportsDataGet'
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const scripts = argv.script.split('.');
const script = scripts[0];
let scriptCount = 2;
scriptCount = (script === '#all' || scripts.length === 1) ? scriptCount : 1;
const numberScript = '#3';
const isScript = (script === numberScript || script === '#all');

describe(`<<=== ScriptOperations: (${numberScript}-scriptRunMethod) ===>>`, () => {

  if (!isScript) return;

  before(() => {
    // Make dir
    makeDirSync([appRoot, dataTestPath]);
    // Remove files from dir
    removeFilesFromDirSync([appRoot, dataTestPath]);
  });

  for (let index = 1; index <= scriptCount; index++) {
    const switchScript = (scripts.length > 1) ? argv.script : `${numberScript}.${index}`;
    
    switch (switchScript) {
    case '#3.1':
      // Create acm year template
      it(`${switchScript}: ScriptOperations: Create acm year template`, async () => {
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
              if (isDebug && result) inspector('methodAcmYearTemplateCreate.result:', result);
              console.log(chalk.green(`Run script for (pointID = ${point}) - OK!`), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
            }
          } else {
            result = await methodAcmYearTemplateCreate([{ value: options.point }]);
            if (isDebug && result) inspector('methodAcmYearTemplateCreate.result:', result);
            console.log(chalk.green(`Run script (pointID = ${options.point}) - OK!`), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
          }
          console.log(chalk.green(`${switchScript}: Script create an acm year template - OK!`), 'result:', chalk.cyan(result.statusCode));
          assert.ok(result.statusCode === 'Good', `${switchScript}: ScriptOperations: Create acm year template`);
        } catch (error) {
          assert.ok(false, `${switchScript}: ScriptOperations: Create acm year template`);
        }
      });
      break;
    case '#3.2':
      // Get acm day reports data
      it(`${switchScript}: ScriptOperations: Get acm day reports data`, async () => {
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
          console.log(chalk.green(`${switchScript}: Script get an acm day reports data - OK!`), 'result:', chalk.cyan(result.statusCode));
          assert.ok(result.statusCode === 'Good', `${switchScript}: ScriptOperations: Get acm day reports data`);
        } catch (error) {
          assert.ok(false, `${switchScript}: ScriptOperations: Get acm day reports data`);
        }
      });
      break;
    default:
      break;
    }
  }
});
