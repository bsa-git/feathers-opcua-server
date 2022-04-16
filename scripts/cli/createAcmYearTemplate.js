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

const isDebug = false;

(async function createAcmYearTemplate() {
  // Get argv
  const argv = yargs(hideBin(process.argv)).argv;
  if (isDebug && argv) inspector('Yargs.argv:', argv);
  // Run script
  const result = await methodAcmYearTemplateCreate([{ value: argv.params }]);

  if (result) {

    const resultPath = result.resultPath;
    const params = result.params;

    console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(resultPath)));
    
    if (isDebug && resultPath) console.log('createAcmYearTemplate.resultPath:', resultPath);
    if (isDebug && params) inspector('createAcmYearTemplate.params:', params);
  } else {
    console.log(chalk.green('Run script - ERROR'));
  }
})()