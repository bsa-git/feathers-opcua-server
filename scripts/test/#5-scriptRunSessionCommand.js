/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const app = require('../../src/app');

const {
  UserTokenType,
  TimestampsToReturn,
  AttributeIds
} = require('node-opcua');

const {
  appRoot,
  inspector,
  pause
} = require('../../src/plugins/lib');

const {
  opcuaClientSessionAsync,
  callbackSubscriptionCreate,
  callbackSubscriptionMonitor
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const {
  showInfoForHandler2
} = require('../../src/plugins/opcua/opcua-subscriptions/lib');

const chalk = require('chalk');


const debug = require('debug')('app:#5-scriptRunSessionOperation');
const isDebug = false;

// Get argv
// e.g. argv.script='#5.1' =>  command -> 'ch_m5CreateSubscription'

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
    let options = {
      app,
      userIdentityInfo: {
        type: UserTokenType.UserName, // UserTokenType.Anonymous, 
        userName: process.env.OPCUA_KEP_NAME,
        password: process.env.OPCUA_KEP_PASS
      },
      clientParams: {},
      subscriptionOptions: {},
      // Subscription monitor options
      subscrMonOpts: {
        itemToMonitor: {},
        requestedParameters: {},
        timestampsToReturn: TimestampsToReturn.Neither,
        callBack: showInfoForHandler2
      }
    };

    //--------------------------------------------
    switch (argv.script) {
    case '#5.1':
      options.command = 'ch_m5SubscriptionMonitor';
      options.opt = {
        url: 'opc.tcp://localhost:26570',// (Endpoint URL) ports: 26570, 49370
      };
      options.subscrMonOpts.itemToMonitor = { 
        nodeId: 'ns=1;s=CH_M52::ValueFromFile', 
        attributeId: AttributeIds.Value 
      };

      callback = async function (session, params) {
        let result = callbackSubscriptionCreate(session, params);
        const subscription = result.subscription;
        if(result.statusCode === 'Good'){
          result = await callbackSubscriptionMonitor(subscription, params);
        }
        await pause(1000);
        return result;
      };
      break;
    default:
      break;
    }

    const result = await opcuaClientSessionAsync(options.opt.url, options, callback);
    // if (true && result) inspector('runOpcuaCommand.result:', result);
    console.log(chalk.green(`Run session write command "${options.command}" - OK!`), 'result:', chalk.cyan(result.statusCode));
    assert.ok(result.statusCode === 'Good', 'Run opcua command');
  });
});
