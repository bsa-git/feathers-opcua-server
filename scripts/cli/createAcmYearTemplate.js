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
  methodAcmYearTemplateCreate
} = require('../../src/plugins/opcua/opcua-methods');

const isDebug = false;

// Get argv
const argv = yargs(hideBin(process.argv))
  .scriptName('createAcmYearTemplate')
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

if (isDebug && argv) inspector('Yargs.argv:', argv);


(async function createAcmYearTemplate(options) {

  // Run script
  if (Array.isArray(options.point)) {
    for (let index = 0; index < options.point.length; index++) {
      const point = options.point[index];
      const result = await methodAcmYearTemplateCreate([{ value: point }]);
      if (isDebug && result) inspector('createAcmYearTemplate.result:', result);
      console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
    }
  } else {
    const result = await methodAcmYearTemplateCreate([{ value: options.point }]);
    if (isDebug && result) inspector('createAcmYearTemplate.result:', result);
    console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
  }

})(argv);