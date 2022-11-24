/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const app = require('../../src/app');

const {
  appRoot,
  inspector,
  logger
} = require('../../src/plugins/lib');

const {
  DataType,
} = require('node-opcua');

const {
  checkRunCommand,
  callbackSessionWrite,
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const chalk = require('chalk');
const loPick = require('lodash/pick');

let options = require(`${appRoot}/src/api/opcua/config/ClientSessOperOptions`);

const debug = require('debug')('app:#4-scriptRunOpcuaCommand');
const isDebug = false;

// Get argv
// e.g. argv.script='#all' =>  commands -> 'all'
// e.g. argv.script='#1' =>  commands -> 'all'
// e.g. argv.script='#1.1' =>  command -> 'ch_m5CreateAcmYearTemplate'
// e.g. argv.script='#1.2' =>  command -> 'ch_m5GetAcmDayReportsData'
// e.g. argv.script='#1.3' =>  command -> 'ch_m5SyncAcmYearReport' (Get dataItems from store)
// e.g. argv.script='#1.4' =>  command -> 'ch_m5SyncAcmYearReport' (Get dataItems from day reports)
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const scripts = argv.script.split('.');
const script = scripts[0];
let scriptCount = 4;
scriptCount = (script === '#all' || scripts.length === 1) ? scriptCount : 1;
const numberScript = '#1';
const isScript = (script === numberScript || script === '#all');

describe(`<<=== ScriptOperations: (${numberScript}-scriptRunOpcuaCommand) ===>>`, () => {

  if (!isScript) return;

  // Run opcua commands
  for (let index = 1; index <= scriptCount; index++) {
    const switchScript = (scripts.length > 1) ? argv.script : `${numberScript}.${index}`;

    it(`${switchScript}: ScriptOperations: Run opcua command`, async () => {

      //--- Set options params ---
      options.opt.url = 'opc.tcp://localhost:26570';// (Endpoint URL)
      // Session write options
      options.sessWriteOpts.showWriteValues = true;
      options.sessWriteOpts.nodesToWrite.value.value.dataType = DataType.String;
      options.sessWriteOpts.nodesToWrite.value.value.value = '';

      switch (switchScript) {
      case '#1.1':
        options.command = 'ch_m5CreateAcmYearTemplate';
        options.opt.points = [1, 2, 3];
        options.opt.test = true;
        options.opt.period = [1, 'years'];
        options.opt.year = 2022;
        break;
      case '#1.2':
        options.command = 'ch_m5SyncStoreAcmValues';
        options.opt.points = [1, 2, 3];
        options.opt.pattern = '/**/DayHist*.xls';
        // e.g. '/**/DayHist*.xls'|'/**/2022-01/DayHist*.xls'|'/**/DayHist*2022_*.xls'|'/**/DayHist*_01*2022*.xls'|'/**/DayHist*_01022022*.xls'|'/**/DayHist*_14F120_01022022*.xls'
        // e.g. '/**/DayHist01_14F120_01022022_0000.xls'
        break;
      case '#1.3':// Get dataItems from store
        options.command = 'ch_m5SyncAcmYearReport';
        options.opt.points = [1, 2, 3];
        options.opt.test = true;
        options.opt.pattern = ''; // e.g. '2022'|'2022-01'|'2022-01-12'
        options.opt.syncYearReportFromStore = true;
        break;
      case '#1.4':// Get dataItems from day reports
        options.command = 'ch_m5SyncAcmYearReport';
        options.opt.points = [1, 2, 3];
        options.opt.test = true;
        options.opt.pattern = '/**/DayHist*.xls';
        // e.g. '/**/DayHist*.xls'|'/**/2022-01/DayHist*.xls'|'/**/DayHist*2022_*.xls'|'/**/DayHist*_01*2022*.xls'|'/**/DayHist*_01022022*.xls'|'/**/DayHist*_14F120_01022022*.xls'
        // e.g. '/**/DayHist01_14F120_01022022_0000.xls'
        options.opt.syncYearReportFromStore = false;
        break;
      default:
        break;
      }


      try {
        if (isDebug && options) inspector(`${numberScript}-scriptRunOpcuaCommand.options:`, options);
        const checkResult = checkRunCommand(options);
        if (!checkResult) {
          // Command error
          inspector('runOpcuaCommand_ERROR.options:', options);
          throw new Error(`Command error. This command "${options.command}" does not exist or there are not enough options.`);
        }
        // Set value for write
        checkResult.sessWriteOpts.nodesToWrite.value.value.value = JSON.stringify(loPick(checkResult, ['command', 'opt']));
        // Run opcuaClientSessionAsync
        const result = await opcuaClientSessionAsync(options.opt.url, checkResult, callbackSessionWrite);
        if (isDebug && result) inspector('runOpcuaCommand.result:', result);
        console.log(chalk.green(`${switchScript}: Script run opcua command:" ${options.command}" - OK!`), 'result:', chalk.cyan(result.statusCode));
        assert.ok(result.statusCode === 'Good', `${numberScript}-scriptRunOpcuaCommand`);
      } catch (error) {
        logger.error(`${chalk.red('Error message:')} "${error.message}"`);
        assert.ok(false, `${numberScript}-scriptRunOpcuaCommand`);
      }

    });
  }
});
