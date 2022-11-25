/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  appRoot,
  inspector,
  logger
} = require('../../src/plugins/lib');

const {
  checkCallMethod,
  callbackSessionCallMethod,
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const chalk = require('chalk');

let options = require(`${appRoot}/src/api/opcua/config/ClientSessOperOptions`);

const debug = require('debug')('app:#5-scriptCallOpcuaMetod');
const isDebug = false;

// Get argv
// e.g. argv.script='#all' =>  commands -> 'all'
// e.g. argv.script='#2' =>  commands -> 'all'
// e.g. argv.script='#2.1' =>  method -> 'ch_m5CreateAcmYearTemplate'
// e.g. argv.script='#2.2' =>  method -> 'ch_m5GetAcmDayReportsData'
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const scripts = argv.script.split('.');
const script = scripts[0];
const scriptCount = (script === '#all' || scripts.length === 1) ? 2 : 1;
const numberScript = '#2';
const isScript = (script === numberScript || script === '#all');

describe(`<<=== ScriptOperations: (${numberScript}-scriptCallOpcuaMetod) ===>>`, () => {

  if (!isScript) return;

  for (let index = 1; index <= scriptCount; index++) {
    const switchScript = (scripts.length > 1) ? argv.script : `${numberScript}.${index}`;
    
    // Call opcua method
    it(`${switchScript}: ScriptOperations: Call opcua metod`, async () => {
      let options = null;
      //-------------------------------------
      switch (switchScript) {
      case '#2.1':
        options = {
          method: 'ch_m5CreateAcmYearTemplate',
          opt: {
            url: 'opc.tcp://localhost:26570',// (Endpoint URL)
            point: 2,
            test: true,
            period: [1, 'months'],
            year: 2022
          }
        };
        break;
      case '#2.2':
        options = {
          method: 'ch_m5GetAcmDayReportsData',
          opt: {
            url: 'opc.tcp://localhost:26570',// (Endpoint URL)
            point: 2,
            pattern: '/**/DayHist*.xls'
            // e.g. '/**/DayHist*.xls'|'/**/2022-01/DayHist*.xls'|'/**/DayHist*2022_*.xls'|'/**/DayHist*_01*2022*.xls'|'/**/DayHist*_01022022*.xls'|'/**/DayHist*_14F120_01022022*.xls'
            // e.g. '/**/DayHist01_14F120_01022022_0000.xls'
          }
        };
        break;
      default:
        break;
      }

      try {
        if (isDebug && options) inspector(`${numberScript}-scriptCallOpcuaMetod.options:`, options);
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
        console.log(chalk.green(`${switchScript}: Script call opcua metod:" ${options.method}" - OK!`), 'result:', chalk.cyan(result));
        assert.ok(result === 'Good', `${numberScript}-scriptCallOpcuaMetod`);
      } catch (error) {
        logger.error(`${chalk.red('Error message:')} "${error.message}"`);
        assert.ok(false, `${numberScript}-scriptCallOpcuaMetod`);
      }
    });
  }
});
