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
// e.g. argv.script='#1' =>  Update AddressSpaceOptions.json
// e.g. argv.script='#2' =>  Converter from `Fox` excel data `.csv` file to KEPServer
// e.g. argv.script='#3' =>  Converter from `Fox` hist data `.inp` file to KEPServer
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const isScript = (argv.script === '#5');

describe('<<=== ScriptOperations: (#5-scriptCallOpcuaMetod) ===>>', () => {

  if (!isScript) return;
  // Run opcua command
  it('#5: ScriptOperations: Call opcua metod', async () => {
    let options = {
      method: 'ch_m5CreateAcmYearTemplate',
      opt: {
        url: 'opc.tcp://localhost:26570',// (Endpoint URL)
        point: 2,
        test: true,
        period: [1, 'months'],
        year: 2020
      }
    };
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
