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

let options = require(`${appRoot}/src/api/opcua/config/ClientSessOperOptions`);

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
let scriptCount = 6;
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

      //--- Set options params ---
      options.app = app;
      // (Endpoint URL) ports: OpcuaSrv(opc.tcp://localhost:26570, opc.tcp://10.60.5.128:26570), 
      // KepSrv(opc.tcp://localhost:49370, opc.tcp://10.60.5.128:49370) 
      // A5-KepSrv(opc.tcp://10.60.147.29:49370)
      options.opt.url = 'opc.tcp://10.60.147.29:49370';
      // options.opt.url = 'opc.tcp://localhost:49370';

      // UserTokenType.Anonymous|UserTokenType.UserName
      options.userIdentityInfo.type = UserTokenType.UserName;
      // OPCUA_ADMIN_LOGIN|OPCUA_KEP_LOGIN|OPCUA_A5_LOGIN
      options.userIdentityInfo.userName = process.env.OPCUA_A5_LOGIN;
      // options.userIdentityInfo.userName = process.env.OPCUA_KEP_LOGIN;
      // OPCUA_ADMIN_PASS|OPCUA_KEP_PASS|OPCUA_A5_PASS
      options.userIdentityInfo.password = process.env.OPCUA_A5_PASS;
      // options.userIdentityInfo.password = process.env.OPCUA_KEP_PASS;
      
      options.subscrMonOpts.callBack = showInfoForHandler2;
      //--------------------------------------------
      let nodesToWrite, nodesToRead, startTime, endTime;

      switch (switchScript) {
      case '#4.1':
        options.command = 'subscriptionCreate';
        callback = async function (session, params) {
          let result = callbackSubscriptionCreate(session, params);
          await pause(1000);
          return result;
        };
        break;
      case '#4.2':
        options.command = 'subscriptionMonitor';
        // M5_OpcuaSrv('ns=1;s=CH_M52::ValueFromFile'), 
        // KEPServer-ogmt-0088846('ns=2;s=OGMT-0088846.Device1.M5-2.02PGAZ_F5')
        // KEPServer-ogmt-0088846('ns=2;s=A5-GW00.Device1.A5.Device1.F501AM_PV', ns=2;s=A5-GW00.Device1.A5.Device1.F359AM_PV)
        // KEPServer-CH-A5-GW00('ns=2;s=A5.Device2.WP301_PV', 'ns=2;s=A5.Device1.F501AM_PV')
        options.subscrMonOpts.itemToMonitor = 'ns=2;s=A5.Device1.F59AM_PV';

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
        options.command = 'sessionRead';

        nodesToRead = [
          /**--- KEPServer_ogmt-0088846 ---*/
          // 'ns=2;s=OGMT-0088846.Device1.M5-2.02PGAZ_F5',
          // 'ns=2;s=A5-GW00.Device1.A5.Device1.F501AM_PV',
          // 'ns=2;s=A5-GW00.Device1.A5.Device1.F359AM_PV'
          
          /**--- KEPServer_ogmt-osd (XozUchet.SUM) ---*/
          // 'ns=2;s=A5-Channel.Device1.A5.Device1.1002JAR_PV',

          /**--- KEPServer_CH-A5-GW00 (XozUchet.SUM) ---*/
          'ns=2;s=A5.Device1.F59AM_SUM_PV',
          'ns=2;s=A5.Device1.F46A_SUM_PV',
          // 'ns=2;s=A5.Device1.F191AM__SUM_PV',
          
          /**--- KEPServer_CH-A5-GW00 (XozUchet) ---*/
          'ns=2;s=A5.Device1.F191_PV',
          'ns=2;s=A5.Device1.P190_PV',
          'ns=2;s=A5.Device2.T190_PV',
          'ns=2;s=A5.Device1.F21_2_PV',
          'ns=2;s=A5.Device1.P21_1_PV',
          'ns=2;s=A5.Device2.T2A_PV',
          'ns=2;s=A5.Device1.F400_PV',
          'ns=2;s=A5.Device2.P400_PV',
          'ns=2;s=A5.Device2.T400_PV',
          'ns=2;s=A5.Device1.F101_PV',
          'ns=2;s=A5.Device1.P101Q_PV',
          'ns=2;s=A5.Device2.T101_PV',
          'ns=2;s=A5.Device2.PBAR_PV',
          'ns=2;s=A5.Device1.F359_PV',
          'ns=2;s=A5.Device2.P359_PV',
          'ns=2;s=A5.Device2.T359_PV',
          'ns=2;s=A5.Device1.F206_PV',
          'ns=2;s=A5.Device1.P206_PV',
          'ns=2;s=A5.Device2.T206_PV',
          'ns=2;s=A5.Device1.F738_PV',
          'ns=2;s=A5.Device2.P738_PV',
          'ns=2;s=A5.Device2.T738_PV',
          'ns=2;s=A5.Device1.F207_PV',
          'ns=2;s=A5.Device1.P207_PV',
          'ns=2;s=A5.Device2.T207_PV',
          'ns=2;s=A5.Device1.F352AM_PV',
          'ns=2;s=A5.Device2.TC214_1_PV',
          'ns=2;s=A5.Device1.F59_PV',
          'ns=2;s=A5.Device2.P9_PV',
          'ns=2;s=A5.Device2.T28_21_PV',
          'ns=2;s=A5.Device1.GNG_PV',
          'ns=2;s=A5.Device1.N2_NG_PV',
          'ns=2;s=A5.Device1.CO2_NG_PV',
          'ns=2;s=A5.Device1.F107_PV',
          'ns=2;s=A5.Device2.T107A_PV',

          // 'ns=2;s=A5.Device1.F207AM_PV',

          'ns=2;s=A5.Device1.F59AM_PV',// Нормализованный природный газ (тыс.м3/ч)
          'ns=2;s=A5.Device1.F46A_PV',// Жидкий NH3 в хранилище (тонн/ч)
          'ns=2;s=A5.Device1.F191AM_PV',// Массовый Г.О. NH3 (тонн/ч)
          'ns=2;s=A5.Device1.F400AM_PV',// Массовый раход Г.О. NH3 (тонн/ч)
          'ns=2;s=A5.Device1.F359AM_PV',// Расход азота (норм) в цех (нм3/ч)
          'ns=2;s=A5.Device1.F501AM_PV',// Норм. расход ПГ из А-5 (нм3/ч)
          'ns=2;s=A5.Device1.F107AM_PV',// Норм. расход ТГ из А-5 (нм3/ч)
          // 'ns=2;s=A5.Device1.F21AM_PV',// Массовый расход пара-16 (тонн/ч)
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
        options.command = 'sessionReadHistory';

        nodesToRead = [
          // 'ns=2;s=A5.Device2.WP301_PV',
          // 'ns=2;s=OGMT-0088846.Device1.M5-2.02PGAZ_F5',
          'ns=1;s=CH_M52::02AMIAK:02T4',
          'ns=1;s=CH_M52::02AMIAK:02P4_1',
          'ns=1;s=CH_M52::02AMIAK:02F4',
        ];
        options.sessReadOpts.nodesToRead = nodesToRead;
        // 'minutes', 'seconds'
        endTime = moment().format();
        startTime = getPreviousDateTime(moment(), [60, 'seconds'], false);
        options.sessReadOpts.startTime = startTime;
        options.sessReadOpts.endTime = endTime;
        callback = async function (session, params) {
          let result = await callbackSessionReadHistory(session, params);
          await pause(1000);
          return result;
        };
        break;
      case '#4.5':
        options.command = 'sessionWrite';

        nodesToWrite = [
          // 'ns=2;s=OGMT-0088846.Device1.M5-2.02PGAZ_F5',
          // 'ns=2;s=A5-GW00.Device1.A5.Device1.F501AM_PV',
          // 'ns=2;s=A5-GW00.Device1.A5.Device1.F359AM_PV'
        ];
        options.sessReadOpts.nodesToWrite[0]['nodeId'] = 'ns=1;s=CH_A5.Device2::Mnemo1:WP301_PV';
        callback = async function (session, params) {
          let result = await callbackSessionRead(session, params);
          await pause(1000);
          return result;
        };
        break;
      case '#4.6':
        options.command = 'sessionEndpoint';

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
