/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  OPCUAClient,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  Variant,
  UserTokenType
} = require('node-opcua');

const {
  appRoot,
  inspector,
  pause
} = require('../../src/plugins/lib');

const {
  opcuaClientSessionAsync
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const chalk = require('chalk');
const loMerge = require('lodash/merge');

const defaultSubscriptionOptions = require(`${appRoot}/src/api/opcua/config/ClientSubscriptionOptions.json`);

const debug = require('debug')('app:#4-scriptRunOpcuaCommand');
const isDebug = false;

// Get argv
// e.g. argv.script='#1.1' =>  command -> 'ch_m5CreateAcmYearTemplate'
// e.g. argv.script='#1.2' =>  command -> 'ch_m5GetAcmDayReportsData'
// e.g. argv.script='#1.3.1' =>  command -> 'ch_m5SyncAcmYearReport' (Get dataItems from store)
// e.g. argv.script='#1.3.2' =>  command -> 'ch_m5SyncAcmYearReport' (Get dataItems from day reports)
const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const script = argv.script.split('.')[0];
const isScript = (script === '#5');

describe('<<=== ScriptOperations: (#5-scriptRunSessionOperation) ===>>', () => {
  let callback;
  //-----------------------
  if (!isScript) return;
  // Run opcua command
  it('#5: SessionOperations: Run session operation', async () => {
    let options = null;
    //--------------------------------------------
    switch (argv.script) {
    case '#5.1':
      options = {
        command: 'ch_m5CreateSubscription',
        opt: {
          url: 'opc.tcp://localhost:26570',// (Endpoint URL)
          subscriptionOptions: {}
        }
      };
      callback = async function (session, params) {
        let subscriptionId;
        //-------------------------------
        const mergeOptions = loMerge({}, defaultSubscriptionOptions, params.opt.subscriptionOptions);
        const subscription = await Promise.resolve(ClientSubscription.create(session, mergeOptions));

        subscription
          .on('started', () => {
            subscriptionId = subscription.subscriptionId;
            console.log(chalk.yellow('Client subscription started.') + ' SubscriptionId=', subscription.subscriptionId);
          })
          .on('keepalive', () => console.log(chalk.yellow('Client subscription keepalive')))
          .on('terminated', () => console.log(chalk.yellow('Client subscription terminated')));
        
          
        await pause(3000);
        subscription.terminate();
        return { statusCode: 'Good', subscriptionId };
      };
      break;
    default:
      break;
    }

    const result = await opcuaClientSessionAsync(options.opt.url, options, callback);
    if (true && result) inspector('runOpcuaCommand.result:', result);
    console.log(chalk.green(`Run session write command "${options.command}" - OK!`), 'result:', chalk.cyan(result.statusCode));
    assert.ok(result.statusCode === 'Good', 'Run opcua command');
  });
});
