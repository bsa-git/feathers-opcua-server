/* eslint-disable no-unused-vars */
const assert = require('assert');
const moment = require('moment');
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
  pause,
  getPreviousDateTime
} = require('../../src/plugins/lib');

const {
  opcuaClientSessionAsync,
  callbackSubscriptionCreate,
  callbackSubscriptionMonitor,
  callbackSessionEndpoint,
  callbackSessionRead,
  callbackSessionReadHistory
} = require('../../src/plugins/opcua/opcua-client-scripts/lib');

const {
  showInfoForHandler2
} = require('../../src/plugins/opcua/opcua-subscriptions/lib');

const loOmit = require('lodash/omit');
const chalk = require('chalk');
const { format } = require('path');

const debug = require('debug')('app:#5-scriptRunSessionOperation');
const isDebug = false;

// Get argv
// e.g. argv.script='#all' =>  commands -> 'all'
// e.g. argv.script='#4' =>  commands -> 'all'
// e.g. argv.script='#4.1' =>  command -> 'ch_m5SubscriptionCreate'
// e.g. argv.script='#4.2' =>  command -> 'ch_m5SubscriptionMonitor'
// e.g. argv.script='#4.3' =>  command -> 'ch_m5SessionEndpoint'

const argv = yargs(hideBin(process.argv)).argv;
if (isDebug && argv) inspector('Yargs.argv:', argv);
const scripts = argv.script.split('.');
const script = scripts[0];
let scriptCount = 5;
scriptCount = (script === '#all' || scripts.length === 1) ? scriptCount : 1;
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
          url: 'opc.tcp://10.60.147.29:49370',
        },
        userIdentityInfo: {
          type: UserTokenType.UserName, // UserTokenType.Anonymous, 
          userName: process.env.OPCUA_A5_LOGIN, // OPCUA_ADMIN_LOGIN|OPCUA_KEP_LOGIN|OPCUA_A5_LOGIN
          password: process.env.OPCUA_A5_PASS // OPCUA_ADMIN_PASS|OPCUA_KEP_PASS|OPCUA_A5_PASS
        },
        clientParams: {},
        // Session read options
        sessReadOpts: {
          showReadValues: true,
          nodesToRead: [{
            nodeId: '',
            attributeId: AttributeIds.Value
          }],
          startTime: '', 
          endTime: ''
        },
        // Subscription options
        subscriptionOptions: {},
        // Subscription monitor options
        subscrMonOpts: {
          itemToMonitor: {
            nodeId: '',
            attributeId: AttributeIds.Value
          },
          requestedParameters: {},
          timestampsToReturn: TimestampsToReturn.Neither,
          callBack: showInfoForHandler2
        }
      };

      //--------------------------------------------
      let nodesToRead;

      switch (switchScript) {
      case '#4.1':
        options.command = 'ch_m5-SubscriptionCreate';
        callback = async function (session, params) {
          let result = callbackSubscriptionCreate(session, params);
          await pause(1000);
          return result;
        };
        break;
      case '#4.2':
        options.command = 'ch_a5-SubscriptionMonitor';
        // M5_OpcuaSrv('ns=1;s=CH_M52::ValueFromFile'), 
        // M5_KepSrv('ns=2;s=Channel1.Device1.Черкассы \'АЗОТ\' цех M5-2.Values from file for CH_M52')
        // A5_KepSrv('ns=2;s=A5.Device2.WP301_PV')
        options.subscrMonOpts.itemToMonitor = 'ns=2;s=A5.Device2.WP301_PV';

        callback = async function (session, params) {
          let result = callbackSubscriptionCreate(session, params);
          const subscription = result.subscription;
          if (result.statusCode === 'Good') {
            result = await callbackSubscriptionMonitor(subscription, params);
          }
          await pause(3000);
          return result;
        };
        break;
      case '#4.3':
        options.command = 'ch_a5-SessionRead';

        nodesToRead = [
          'ns=2;s=A5.Device1.F59AM_PV',// Нормализованный природный газ (тыс.м3/ч)
          'ns=2;s=A5.Device1.F46A_PV',// Жидкий NH3 в хранилище (тонн/ч)
          'ns=2;s=A5.Device1.F191AM_PV',// Массовый Г.О. NH3 (тонн/ч)
          'ns=2;s=A5.Device1.F400AM_PV',// Массовый раход Г.О. NH3 (тонн/ч)
          'ns=2;s=A5.Device1.F359AM_PV',// Расход азота (норм) в цех (нм3/ч)
          'ns=2;s=A5.Device1.F501AM_PV',// Норм. расход ПГ из А-5 (нм3/ч)
          'ns=2;s=A5.Device1.F107AM_PV',// Норм. расход ТГ из А-5 (нм3/ч)
          'ns=2;s=A5.Device1.F21AM_PV',// Массовый расход пара-16 (тонн/ч)
          'ns=2;s=A5.Device1.F738AM_PV',// Норм. расход пара-30 (тонн/ч)
          'ns=2;s=A5.Device1.F46AM_PV',// Норм. расход NH3 на склад (тонн/ч)
          'ns=2;s=A5.Device1.F34_PV',// ОтпАр. конден. на сторон (т/н)
          'ns=2;s=A5.Device1.F46AA_PV',// Скоригована витрата (тонн/ч)
          'ns=2;s=A5.Device1.F206AM_PV',// Норм. расход NH3 в М-7 (тонн/ч)
          'ns=2;s=A5.Device1.F352_PV',// NH3 в М-2 (тонн/ч)
          'ns=2;s=A5.Device1.F360_PV',// NH3 в М-6 (тонн/ч)
          'ns=2;s=A5.Device1.F101AM_PV',// Пар-16 в цех А-5
          'ns=2;s=A5.Device1.F379AM_PV',// Масс. Г.О.  из 1001-F  (ton/hr)
          'ns=2;s=A5.Device1.F306_PV',// Вода в поз.6 (м3/ч)
          'ns=2;s=A5.Device1.F308_PV',// А.вода в скл (м3/ч)
          'ns=2;s=A5.Device1.F90_PV',// Расход воды на К.701 (м3/ч)
          'ns=2;s=A5.Device1.F98_PV',// Расход воды на К.701 (м3/ч)
          'ns=2;s=A5.Device1.F93_PV',// Расход воды в цех (м3/ч)
        ];
        options.sessReadOpts.nodesToRead = nodesToRead;
        callback = async function (session, params) {
          let result = await callbackSessionRead(session, params);
          await pause(1000);
          return result;
        };
        break;
        case '#4.4':
          options.command = 'ch_a5-SessionReadHistory';
  
          nodesToRead = [
            'ns=2;s=A5.Device2.WP301_PV',
          ];
          options.sessReadOpts.nodesToRead = nodesToRead;
          options.sessReadOpts.startTime = moment.utc().format();
          options.sessReadOpts.endTime = getPreviousDateTime(moment.utc(), [1, 'hours']);
          callback = async function (session, params) {
            let result = await callbackSessionReadHistory(session, params);
            await pause(1000);
            return result;
          };
          break;  
      case '#4.5':
        options.command = 'ch_m5-SessionEndpoint';

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
        assert.ok(true, `${switchScript}-scriptRunSessionOperation`);
      } catch (error) {
        logger.error(`${chalk.red('Error message:')} "${error.message}"`);
        assert.ok(false, `${switchScript}-scriptRunSessionOperation`);
      }
    });
  }
});
