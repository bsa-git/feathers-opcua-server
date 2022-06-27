#!/usr/bin/env node
/* eslint-disable no-unused-vars */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

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

const isDebug = false;

// Get argv
const argv = yargs(hideBin(process.argv))
  .scriptName('getAcmDayReportsData')
  .usage('Usage: $0 -p num')
  .example(
    '$0 -p 2',
    'Returns the file name (acmDayReportsData2-20220622.json) when geting a day reports data for point 2.'
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

if (isDebug && argv) inspector('Yargs.argv:', argv);

const dataTestPath = '/test/data/tmp/excel-helper';

(async function getAcmDayReportsData(options) {

  // Make dirs
  makeDirSync([appRoot, dataTestPath]);
  // Remove files from dir
  removeFilesFromDirSync([appRoot, dataTestPath]);

  // Run script
  if (Array.isArray(options.point)) {
    for (let index = 0; index < options.point.length; index++) {
      const point = options.point[index];
      const result = await methodAcmDayReportsDataGet([{ value: point }]);
      if (isDebug && result) inspector('getAcmDayReportsData.result:', result);
      if (result.resultPath) {
        console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
      } else {
        console.log(chalk.green('Run script - OK!'));
      }
    }
  } else {
    const result = await methodAcmDayReportsDataGet([{ value: options.point }]);
    if (isDebug && result) inspector('getAcmDayReportsData.result:', result);
    if (result.resultPath) {
      console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
    } else {
      console.log(chalk.green('Run script - OK!'));
    }
  }

})(argv);