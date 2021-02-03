/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const {
  getServerService,
  getClientService,
  getSrvCurrentState,
  getOpcuaDataType
} = require('../../src/plugins/opcua/opcua-helper');

const {
  appRoot,
  inspector,
  isObject,
  pause,
  getTime,
  dtToObject
} = require('../../src/plugins/lib');

const {
  getFileName,
  makeDirSync,
  writeFileSync
} = require('../../src/plugins/lib/file-operations');

const chalk = require('chalk');
const moment = require('moment');

const loRound = require('lodash/round');
// const loForEach = require('lodash/forEach');

const {
  StatusCodes,
  DataType,
  AttributeIds,
} = require('node-opcua');

const debug = require('debug')('app:test.opcua-clients');
const isDebug = false;
const isLog = false;

// Options
const srvData = {
  params: {
    port: 26580, // default - 26543, 26540 (opcua.test), 26550 (opcua.test2), 26570 (opcua-servers.test), 26560 (opcua-clients.test), 26580 (opcua-clients.m5.test),
    serverInfo: { applicationName: 'ua-cherkassy-azot-m5_test' },
  }
};

const clientData = {
  params: {
    applicationName: 'ua-cherkassy-azot-m5_test',
  }
};

const id = srvData.params.serverInfo.applicationName;

describe('<<=== OPC-UA: M5-Test (opcua-clients.m5_test) ===>>', () => {
  let server;

  before(function (done) {
    if (isDebug) debug('before Start!');
    server = app.listen(port);
    server.once('listening', () => {
      setTimeout(() => done(), 500);
    });
    // Write file
    const path = makeDirSync([appRoot, 'test/data/tmp']);
    // const fileName = getFileName('data-', 'json', true);
    // writeFileSync([path, fileName], {value: '12345'}, true);
  });

  after( function (done) {
    if (isDebug) debug('after Start!');
    server.close();
    setTimeout(() => done(), 500);
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
    // const params = { user: opcuaUser, provider: 'rest', authenticated: true };
    // const opcuaClient = await service.create(clientData, params);
    const opcuaClient = await service.create(clientData);
    // debug('Service mixin.getNodeIds:', await service.getNodeIds(id, ['Device1.Temperature']));
    if (isLog) inspector('created the service.opcuaClient:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });

  //============== CLIENT SESSION-CREATE ====================//

  // it('OPC-UA clients: session create the service', async () => {
  //   const service = await getClientService(app, id);
  //   const opcuaClient = await service.sessionCreate(id);
  //   if (isLog) inspector('Session create the clients:', opcuaClient);
  //   assert.ok(opcuaClient, 'OPC-UA clients: session create the service');
  // });

  //============== CLIENT CLIENT-CONNECT/SESSION-CREATE ====================//

  // it('OPC-UA clients: connect the service', async () => {
  //   const srvCurrentState = await getSrvCurrentState(app, id);
  //   const service = await getClientService(app, id);
  //   let opcuaClient = await service.opcuaClientConnect(id, srvCurrentState);
  //   opcuaClient = await service.sessionCreate(id);
  //   if (isLog) inspector('Connect the clients:', opcuaClient);
  //   assert.ok(opcuaClient, 'OPC-UA clients: connect the service');
  // });

    
  //============== SESSION HISTORY VALUES ====================//

  /*
  it('OPC-UA clients: session history value from file for "CH_M51" object', async () => {
    let dataItems, readResult = null, accumulator = '';
    const service = await getClientService(app, id);

    // service.getItemNodeId
    readResult = await service.getItemNodeId(id, 'CH_M51::ValueFromFile');
    if (isLog) inspector('getItemNodeId.readResult:', readResult);

    if (readResult) {
      // Get start time
      let start = moment();
      debug('SessionHistoryValue_FromFile.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('SessionHistoryValue_FromFile.EndTime:', getTime(end, false));

      // service.sessionReadHistoryValues
      readResult = await service.sessionReadHistoryValues(id, 'CH_M51::ValueFromFile', start, end);

      if (isLog) inspector('SessionHistoryValue_FromFile.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              dataItems = JSON.parse(dataValue.value.value);
              accumulator = '';
              dataItems.forEach(item => accumulator = accumulator + `${item.name}=${item.value}; `);
              console.log(chalk.green('SessionHistoryValue_FromFile.ValueFromFile:'), chalk.cyan(`${accumulator}; Timestamp=${dataValue.sourceTimestamp}`));
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

  it('OPC-UA clients: session history value from Device2.02F5', async () => {
    let dataItem, readResult = null;
    const service = await getClientService(app, id);

    // service.getItemNodeId
    readResult = await service.getItemNodeId(id, 'Device2.02F5');
    if (isLog) inspector('getItemNodeId.readResult:', readResult);

    if (readResult) {
      // Get start time
      let start = moment();
      debug('SessionHistoryValue_From_Device2.02F5.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('SessionHistoryValue_From_Device2.02F5.EndTime:', getTime(end, false));

      // service.sessionReadHistoryValues
      readResult = await service.sessionReadHistoryValues(id, 'Device2.02F5', start, end);

      if (isLog) inspector('SessionHistoryValue_From_Device2.02F5.readResult:', readResult);
      // inspector('SessionHistoryValue_FromFile.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              dataItem = dataValue.value.value;
              console.log(chalk.green('SessionHistoryValue_From_Device2.02F5:'), chalk.cyan(`${dataItem}; Timestamp=${dataValue.sourceTimestamp}`));
              assert.ok(true, 'OPC-UA clients: session history value from Device2.02F5');
            } else {
              assert.ok(false, 'OPC-UA clients: session history value from Device2.02F5');
            }
          });
        } else {
          assert.ok(false, 'OPC-UA clients: session history value from Device2.02F5');
        }
      } else {
        assert.ok(false, 'OPC-UA clients: session history value from Device2.02F5');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history value from Device2.02F5');
    }
  });

  it('OPC-UA clients: session history value from Device2.02P5', async () => {
    let dataItem, readResult = null;
    const service = await getClientService(app, id);

    // service.getItemNodeId
    readResult = await service.getItemNodeId(id, 'Device2.02P5');
    if (isLog) inspector('getItemNodeId.readResult:', readResult);

    if (readResult) {
      // Get start time
      let start = moment();
      debug('SessionHistoryValue_From_Device2.02P5.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('SessionHistoryValue_From_Device2.02P5.EndTime:', getTime(end, false));

      // service.sessionReadHistoryValues
      readResult = await service.sessionReadHistoryValues(id, 'Device2.02P5', start, end);

      if (isLog) inspector('SessionHistoryValue_From_Device2.02P5.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              dataItem = dataValue.value.value;
              console.log(chalk.green('SessionHistoryValue_From_Device2.02P5:'), chalk.cyan(`${dataItem}; Timestamp=${dataValue.sourceTimestamp}`));
              assert.ok(true, 'OPC-UA clients: session history value from Device2.02P5');
            } else {
              assert.ok(false, 'OPC-UA clients: session history value from Device2.02P5');
            }
          });
        } else {
          assert.ok(false, 'OPC-UA clients: session history value from Device2.02P5');
        }
      } else {
        assert.ok(false, 'OPC-UA clients: session history value from Device2.02P5');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history value from Device2.02P5');
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
    // service.getNodeIds
    const nodeIds = await service.getNodeIds(id, ['Device1.Temperature']);
    if (nodeIds.length) {
      nodeIds.forEach(async nodeId => {
        // service.subscriptionMonitor
        await service.subscriptionMonitor(id, 'onChangedCommonHandler', { nodeId });

      });

      assert.ok(true, 'OPC-UA client subscription monitor');
    }
  });

  
  it('OPC-UA clients: subscription terminate', async () => {
    const service = await getClientService(app, id);
    await pause(1000);
    // service.subscriptionTerminate
    const result = await service.subscriptionTerminate(id);
    if (isLog) inspector('OPC-UA clients: subscription terminate', result);

    assert.ok(true, 'OPC-UA clients: subscription terminate');
  });

  */
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
