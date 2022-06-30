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
// e.g. argv.script='#1.1' =>  command -> 'ch_m5CreateAcmYearTemplate'
// e.g. argv.script='#1.2' =>  command -> 'ch_m5GetAcmDayReportsData'
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const script = argv.script.split('.')[0];
const isScript = (script === '#1');

describe('<<=== ScriptOperations: (#1-scriptRunOpcuaCommand) ===>>', () => {

  if (!isScript) return;
  // Run opcua command
  it('#1: ScriptOperations: Run opcua command', async () => {
    let options = null;
    //--------------------------------------------
    switch (argv.script) {
    case '#1.1':
      options = {
        command: 'ch_m5CreateAcmYearTemplate',
        opt: {
          url: 'opc.tcp://localhost:26570',// (Endpoint URL)
          points: [1, 2, 3],
          test: true,
          period: [1, 'months'],
          year: 2020
        }
      };
      break;
    case '#1.2':
      options = {
        command: 'ch_m5GetAcmDayReportsData',
        opt: {
          url: 'opc.tcp://localhost:26570',// (Endpoint URL)
          points: [1, 2, 3],
          pattern: '/**/*.xls'
        }
      };
      break;
    default:
      break;
    }


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
