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
  logger,
  inspector,
  pause
} = require('../../src/plugins/lib');

const {
  opcuaClientSessionAsync,
  callbackSubscriptionCreate,
  callbackSubscriptionMonitor,
  callbackSessionEndpoint
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const {
  showInfoForHandler2
} = require('../../src/plugins/opcua/opcua-subscriptions/lib');

const loOmit = require('lodash/omit');
const chalk = require('chalk');

const debug = require('debug')('app:#5-scriptRunSessionOperation');
const isDebug = false;

// Get argv
// e.g. argv.script='#5.1' =>  command -> 'ch_m5CreateSubscription'

const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const scripts = argv.script.split('.');
const script = scripts[0];
const scriptCount = (script === '#all' || scripts.length === 1) ? 3 : 1;
const numberScript = '#4';
const isScript = (script === numberScript || script === '#all');

describe(`<<=== ScriptOperations: (${numberScript}-scriptRunSessionOperation) ===>>`, () => {
  let callback;
  //-----------------------

  if (!isScript) return;

  for (let index = 1; index <= scriptCount; index++) {
    const switchScript = (scripts.length > 1) ? argv.script : `${numberScript}.${index}`;

    // Run opcua command
    it(`${switchScript}: SessionOperations: Run session operation`, async () => {
      let options = {
        app,
        opt: {
          // (Endpoint URL) ports: OpcuaSrv(localhost:26570), KepSrv(localhost:49370) A5KepSrv(10.60.147.29:49370)
          url: 'opc.tcp://localhost:26570',
        },
        userIdentityInfo: {
          type: UserTokenType.UserName, // UserTokenType.Anonymous, 
          userName: process.env.OPCUA_KEP_NAME, // OPCUA_ADMIN_NAME|OPCUA_KEP_NAME|OPCUA_A5_NAME
          password: process.env.OPCUA_KEP_PASS // OPCUA_ADMIN_PASS|OPCUA_KEP_PASS|OPCUA_A5_PASS
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
      switch (switchScript) {
      case '#4.1':
        options.command = 'ch_m5SubscriptionCreate';
        callback = async function (session, params) {
          let result = callbackSubscriptionCreate(session, params);
          await pause(1000);
          return result;
        };
        break;
      case '#4.2':
        options.command = 'ch_m5SubscriptionMonitor';
        options.subscrMonOpts.itemToMonitor = {
          // OpcuaSrv(ns=1;s=CH_M52::ValueFromFile), 
          // KepSrv(ns=2;s=Channel1.Device1.Черкассы 'АЗОТ' цех M5-2.Values from file for CH_M52)
          nodeId: 'ns=1;s=CH_M52::ValueFromFile',
          attributeId: AttributeIds.Value
        };

        callback = async function (session, params) {
          let result = callbackSubscriptionCreate(session, params);
          const subscription = result.subscription;
          if (result.statusCode === 'Good') {
            result = await callbackSubscriptionMonitor(subscription, params);
          }
          await pause(1000);
          return result;
        };
        break;
      case '#4.3':
        options.command = 'ch_m5SessionEndpoint';

        callback = async function (session, params) {
          let result = callbackSessionEndpoint(session, params);
          await pause(1000);
          return result;
        };
        break;
      default:
        break;
      }

      // Run session command
      try {
        if (isDebug && options) inspector(`${switchScript}-scriptRunSessionOperation.options:`, loOmit(options, ['app']));
        const result = await opcuaClientSessionAsync(options.opt.url, options, callback);
        if (result.statusCode === 'Good') {
          console.log(chalk.green(`Run session command "${options.command}" - OK!`), 'result:', chalk.cyan(result.statusCode));
          if (isDebug && result) inspector(`Run session command "${options.command}":`, result);
        } else {
          console.log(chalk.green(`Run session command "${options.command}" - ERROR!`), 'result:', chalk.cyan(result.statusCode));
        }
        assert.ok(result.statusCode === 'Good', `${switchScript}-scriptRunSessionOperation`);
      } catch (error) {
        logger.error(`${chalk.red('Error message:')} "${error.message}"`);
        assert.ok(false, `${switchScript}-scriptRunSessionOperation`);
      }
    });
  }
});
