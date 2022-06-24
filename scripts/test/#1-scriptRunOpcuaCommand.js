/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  inspector,
} = require('../../src/plugins/lib');

const {
  checkRunCommand,
  callbackSessionWrite,
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const chalk = require('chalk');

const debug = require('debug')('app:#4-scriptRunOpcuaCommand');
const isDebug = false;

// Get argv
// e.g. argv.script='#1' =>  Update AddressSpaceOptions.json
// e.g. argv.script='#2' =>  Converter from `Fox` excel data `.csv` file to KEPServer
// e.g. argv.script='#3' =>  Converter from `Fox` hist data `.inp` file to KEPServer
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#1');

describe('<<=== ScriptOperations: (#1-scriptRunOpcuaCommand) ===>>', () => {
  
  if (!isScript) return;
  // Run opcua command
  it('#1: ScriptOperations: Run opcua command', async () => {
    let options = {
      command: 'ch_m5CreateAcmYearTemplate',
      opt: {
        url: 'opc.tcp://localhost:26570',// (Endpoint URL)
        points: [1, 2, 3],
        test: true,
        period: [1, 'months'],
        year: 2020
      }
    };
    const checkResult = checkRunCommand(options);
    if (!checkResult) {
      // Command error
      inspector('runOpcuaCommand_ERROR.options:', options);
      throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
    }
    const result = await opcuaClientSessionAsync(options.opt.url, checkResult, callbackSessionWrite);
    if (isDebug && result) inspector('runOpcuaCommand.result:', result);
    console.log(chalk.green(`Run session write command "${options.command}" - OK!`), 'result:', chalk.cyan(result));
    assert.ok(result === 'Good', 'Run opcua command');
  });
});
