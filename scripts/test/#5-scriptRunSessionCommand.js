/* eslint-disable no-unused-vars */
const assert = require('assert');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const app = require('../../src/app');

const {
  UserTokenType
} = require('node-opcua');

const {
  appRoot,
  inspector,
  pause
} = require('../../src/plugins/lib');

const {
  opcuaClientSessionAsync,
  callbackSubscriptionCreate
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

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
      userIdentityInfo: { 
        type: UserTokenType.UserName, // UserTokenType.Anonymous, 
        userName: process.env.OPCUA_ADMIN_NAME, 
        password: process.env.OPCUA_ADMIN_PASS 
      },
      clientParams: {},
      subscriptionOptions: {}
    };

    //--------------------------------------------
    switch (argv.script) {
    case '#5.1':
      options.command = 'ch_m5CreateSubscription';
      options.opt = {
        url: 'opc.tcp://localhost:26570',// (Endpoint URL)
      };

      callback = async function (session, params) {
        const result = callbackSubscriptionCreate(session, params);
        await pause(3000);
        result.subscription.terminate();
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
