/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  UserTokenType
} = require('node-opcua');

const {
  getServerService,
  getClientService,
} = require('../../src/plugins/opcua/opcua-helper');

const {
  appRoot,
  inspector,
  pause,
  getTime,
  getGroupsFromArray,
  makeDirSync
} = require('../../src/plugins/lib');

const {
  startListenPort,
  stopListenPort,
} = require('../../src/plugins/test-helpers');

const chalk = require('chalk');
const moment = require('moment');

const loForEach = require('lodash/forEach');


const debug = require('debug')('app:test.opcua-clients');
const isDebug = false;
const isLog = false;

// Options
const srvData = {
  params: {
    port: 26580, // default - 26543, 26540 (opcua-class.test), 26550 (opcua-class.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test), 26580 (opcua-clients.m5.test),
    serverInfo: { applicationName: 'ua-cherkassy-azot_test2' },
    locale: 'ru'
  }
};

// Default user identity info
// const userIdentityInfo = { type: UserTokenType.UserName, userName: process.env.OPCUA_ADMIN_NAME, password: process.env.OPCUA_ADMIN_PASS };

const clientData = {
  // userIdentityInfo,
  params: {
    applicationName: 'ua-cherkassy-azot_test2',
    locale: 'ru'
  }
};

const id = srvData.params.serverInfo.applicationName;

describe('<<=== OPC-UA: M5-Test (opcua-clients.m5_test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
    // Make dirs
    makeDirSync([appRoot, 'test/data/tmp/ch-m51']);
    makeDirSync([appRoot, 'test/data/tmp/ch-m52']);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('OPC-UA clients: registered the service', async () => {
    const service = await getClientService(app, id);
    assert.ok(service, 'OPC-UA clients: registered the service');
  });

  it('OPC-UA servers: registered the service', async () => {
    const service = await getServerService(app, id);
    assert.ok(service, 'OPC-UA servers: registered the service');
  });

  //===== SERVER CREATE/CLIENT CREATE =======//
  it('OPC-UA servers: created the service', async () => {
    const service = await getServerService(app, id);
    // service create
    const opcuaServer = await service.create(srvData);
    if (isLog) inspector('created the service.opcuaServer:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('OPC-UA clients: created the service', async () => {
    const service = await getClientService(app, id);
    // service create
    const opcuaClient = await service.create(clientData);
    if (isLog) inspector('created the service.opcuaClient:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });

  //============== SESSION HISTORY VALUES ====================//
  
  it('OPC-UA clients: session history values for "CH_M51"', async () => {
    let dataItems, readResult = null, accumulator = '';
    const service = await getClientService(app, id);

    // service.getItemNodeId
    readResult = await service.getItemNodeId(id, 'CH_M51::ValueFromFile');
    if (isLog) inspector('getItemNodeId.readResult:', readResult);

    if (readResult) {
      // Get start time
      let start = moment();
      debug('SessionHistoryValue_ForCH_M51.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('SessionHistoryValue_ForCH_M51.EndTime:', getTime(end, false));

      // service.sessionReadHistoryValues
      readResult = await service.sessionReadHistoryValues(id, 'CH_M51::ValueFromFile', start, end);

      if (isLog) inspector('SessionHistoryValue_ForCH_M51.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              dataItems = JSON.parse(dataValue.value.value);
              accumulator = '';
              loForEach(dataItems, function (value, key) {
                accumulator = accumulator + `${key}=${value}; `;
              });
              console.log(chalk.green('SessionHistoryValue_ForCH_M51.ValueFromFile:'), chalk.cyan(`${accumulator} Timestamp=${dataValue.sourceTimestamp}`));
              assert.ok(true, 'OPC-UA clients: session history value from file');
            } else {
              assert.ok(false, 'OPC-UA clients: session history value from file');
            }
          });
        } else {
          assert.ok(false, 'OPC-UA clients: session history value from file');
        }
      } else {
        assert.ok(false, 'OPC-UA clients: session history value from file');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history value from file');
    }
  });

  it('OPC-UA clients: session history values for "CH_M51" group', async () => {
    let dataItem, readResults = null;
    const service = await getClientService(app, id);

    const srvCurrentState = await service.getSrvCurrentState(id);
    let variables = srvCurrentState.paramsAddressSpace.variables;
    variables = variables.filter(v => v.ownerGroup === 'CH_M51::ValueFromFile').map(v => v.browseName);
    if (variables.length) {
      // Get start time
      let start = moment();
      debug('OPC-UA clients: session history values for "CH_M51" group.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('OPC-UA clients: session history values for "CH_M51" group.EndTime:', getTime(end, false));
      readResults = await service.sessionReadHistoryValuesEx(id, variables, start, end);
      if (isLog) inspector('OPC-UA clients: session history values for "CH_M51" group.readResults:', readResults);
      if (readResults.length) {
        readResults.forEach(readResult => {
          if (readResult.statusCode === 'Good') {
            if (readResult.dataValues.length) {
              readResult.dataValues.forEach(dataValue => {
                if (dataValue.statusCode === 'Good') {
                  dataItem = dataValue.value;
                  console.log(chalk.green(`historyValue.${readResult.browseName}:`), chalk.cyan(`${dataItem} (${readResult.valueParams.engineeringUnits}); Timestamp=${dataValue.timestamp}`));
                  assert.ok(true, 'OPC-UA clients: session history values for "CH_M51" group');
                } else {
                  assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
                }
              });
            }
          } else {
            assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
          }
        });
      } else {
        assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
    }
  });
  
  //============== START SUBSCRIPTION ====================//

  it('OPC-UA clients: subscription create', async () => {
    const service = await getClientService(app, id);
    // service.subscriptionCreate
    const result = await service.subscriptionCreate(id);
    if (isLog) inspector('OPC-UA clients: subscription create', result);

    assert.ok(true, 'OPC-UA clients: subscription create');
  });

  it('OPC-UA clients: subscription monitor', async () => {

    const service = await getClientService(app, id);
    const srvCurrentState = await service.getSrvCurrentState(id);
    // Start subscriptionMonitor
    let variables = srvCurrentState.paramsAddressSpace.variables;
    variables = variables.filter(v => v.ownerGroup === 'CH_M51::ValueFromFile').map(v => v.browseName);
    const groups = getGroupsFromArray(variables, 10);
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const nodeIds = await service.getNodeIds(id, group);
      for (let index2 = 0; index2 < nodeIds.length; index2++) {
        const nodeId = nodeIds[index2];
        await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
      }
    }
    assert.ok(true, 'OPC-UA client subscription monitor');
  });


  it('OPC-UA clients: subscription terminate', async () => {
    const service = await getClientService(app, id);
    await pause(1000);
    // service.subscriptionTerminate
    const result = await service.subscriptionTerminate(id);
    if (isLog) inspector('OPC-UA clients: subscription terminate', result);

    assert.ok(true, 'OPC-UA clients: subscription terminate');
  });


  //===== SESSION CLOSE/CLIENT DISCONNECT/SERVER SHUTDOWN =====//

  it('OPC-UA clients: session close the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.sessionClose(id);
    if (isLog) inspector('Session close the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: session close the service');
  });

  it('OPC-UA clients: disconnect the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.opcuaClientDisconnect(id);
    if (isLog) inspector('Session close the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: session close the service');
  });

  it('OPC-UA servers: shutdown the service', async () => {
    const service = await getServerService(app, id);
    // const opcuaServer = await service.opcuaServerShutdown(id, 1500);
    const opcuaServer = await service.opcuaServerShutdown(id);
    if (isLog) inspector('Shutdown the server:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: shutdown the service');
  });

});
