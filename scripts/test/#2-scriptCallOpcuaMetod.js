/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  inspector,
} = require('../../src/plugins/lib');

const {
  checkCallMethod,
  callbackSessionCallMethod,
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const chalk = require('chalk');

const debug = require('debug')('app:#5-scriptCallOpcuaMetod');
const isDebug = false;

// Get argv
// e.g. argv.script='#2.1' =>  method -> 'ch_m5CreateAcmYearTemplate'
// e.g. argv.script='#2.2' =>  method -> 'ch_m5GetAcmDayReportsData'
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const script = argv.script.split('.')[0];
const isScript = (script === '#2');

describe('<<=== ScriptOperations: (#2-scriptCallOpcuaMetod) ===>>', () => {

  if (!isScript) return;
  // Run opcua command
  it('#2: ScriptOperations: Call opcua metod', async () => {
    let options = null;
    //-------------------------------------
    switch (argv.script) {
    case '#2.1':
      options = {
        method: 'ch_m5CreateAcmYearTemplate',
        opt: {
          url: 'opc.tcp://localhost:26570',// (Endpoint URL)
          point: 2,
          test: true,
          period: [1, 'months'],
          year: 2020
        }
      };
      break;
    case '#2.2':
      options = {
        method: 'ch_m5GetAcmDayReportsData',
        opt: {
          url: 'opc.tcp://localhost:26570',// (Endpoint URL)
          point: 2,
          test: true,
          pattern: '/**/*.xls'
        }
      };
      break;
    default:
      break;
    }

    // Check call method options
    const checkResult = checkCallMethod(options);
    if (!checkResult) {
      // Method error
      inspector('callOpcuaMethod_ERROR.options:', options);
      throw new Error(`Method error. This method "${options.method}" does not exist or there are not enough options.`);
    }
    let result = await opcuaClientSessionAsync(options.opt.url, checkResult, callbackSessionCallMethod);
    // Check call method result
    result = checkCallMethod(options, result);
    assert.ok(result === 'Good', 'Run opcua command');
  });
});
