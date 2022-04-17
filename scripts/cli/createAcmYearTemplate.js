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
  const argv = yargs(hideBin(process.argv))
    .scriptName('createAcmYearTemplate')
    .usage('Usage: $0 -p num')
    .example(
      '$0 -p 2',
      'Returns the file name (acmM52_YearReport2-2022.xlsx) when creating a template for the reporting period.'
    )
    .option('p', {
      alias: 'params',
      describe: 'Parameter number for the script.',
      demandOption: "The params is required.",
      type: "number",
      nargs: 1,
    })
    .describe("help", "Show help.") // Override --help usage message.
    .describe("version", "Show version number.") // Override --version usage message.
    .epilog("copyright 2022")
    .argv;

  if (true && argv) inspector('Yargs.argv:', argv);

  // Run script
  if (Array.isArray(argv.params)) {
    for (let index = 0; index < argv.params.length; index++) {
      const param = argv.params[index];
      const result = await methodAcmYearTemplateCreate([{ value: param }]);
      console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
    }
  } else {
    const result = await methodAcmYearTemplateCreate([{ value: argv.params }]);
    console.log(chalk.green('Run script - OK!'), 'resultFile:', chalk.cyan(getPathBasename(result.resultPath)));
  }

})()