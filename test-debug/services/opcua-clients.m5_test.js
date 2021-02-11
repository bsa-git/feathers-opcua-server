/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const {
  getServerService,
  getClientService,
  getHistoryResults,
  getHistoryResultsEx,
  Unece_to_Locale
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
  clearDirSync,
  removeFilesFromDirSync,
  removeDirFromDirSync,
  writeFileSync
} = require('../../src/plugins/lib/file-operations');

const chalk = require('chalk');
const moment = require('moment');

const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');

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
    // Remove files and dirs from dir
    clearDirSync([appRoot, 'test/data/tmp']);
    // Make dirs
    makeDirSync([appRoot, 'test/data/tmp', 'ch-m51']);
    makeDirSync([appRoot, 'test/data/tmp', 'ch-m52']);
    // Unece_to_Locale(`${appRoot}/src/api/opcua/UNECE_to_OPCUA.json`, `${appRoot}/test/data/tmp/en.json`);
  });

  after(function (done) {
    if (isDebug) debug('after Start!');
    server.close();
    setTimeout(() => done(), 500);
    // removeDirFromDirSync([appRoot, 'test/data/tmp']);
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
    // inspector('srvCurrentState.variables:', variables);
    // assert.ok(true, 'OPC-UA clients: session history value from file');
    // });

    // service.getItemNodeId
    // readResult = await service.getItemNodeId(id, 'Device2.02F5');
    // if (isLog) inspector('getItemNodeId.readResult:', readResult);

    if (variables.length) {
      // Get start time
      let start = moment();
      debug('OPC-UA clients: session history values for "CH_M51" group.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('OPC-UA clients: session history values for "CH_M51" group.EndTime:', getTime(end, false));

      // variables.forEach(v => {
      // service.sessionReadHistoryValues
      // readResults = await service.sessionReadHistoryValues(id, variables, start, end);
      readResults = await service.sessionReadHistoryValues(id, ['CH_M51::01AMIAK:01F4.PNT', 'CH_M51::01AMIAK:01F21_1.PNT'], start, end);// т/ч

      readResults = getHistoryResultsEx(readResults, ['CH_M51::01AMIAK:01F4.PNT', 'CH_M51::01AMIAK:01F21_1.PNT'], id);
      if (isLog) inspector('OPC-UA clients: session history values for "CH_M51" group.readResults:', readResults);
      inspector('OPC-UA clients: session history values for "CH_M51" group.readResults:', readResults);
      assert.ok(true, 'OPC-UA clients: session history values for "CH_M51" group');

      /*
      const results = OPC-UA clients: session history values for "CH_M51" group.readResults:
      [
        HistoryReadResult {
          statusCode: ConstantStatusCode {
            _value: 0,
            _description: 'No Error',
            _name: 'Good'
          },
          continuationPoint: null,
          historyData: HistoryData {
            dataValues: [
              DataValue {
                value: Variant {
                  dataType: 11,
                  arrayType: 0,
                  value: 3.283,
                  dimensions: null
                },
                statusCode: ConstantStatusCode {
                  _value: 0,
                  _description: 'No Error',
                  _name: 'Good'
                },
                sourceTimestamp: 2021-02-06T11:41:02.639Z {
                  high_low: [ 30866556, -228724083 ],
                  picoseconds: 578900000
                },
                sourcePicoseconds: 578942000,
                serverTimestamp: 2021-02-06T11:41:02.639Z {
                  high_low: [ 30866556, -228724083 ],
                  picoseconds: 578900000
                },
                serverPicoseconds: 578942000
              },
              DataValue {
                value: Variant {
                  dataType: 11,
                  arrayType: 0,
                  value: 3.773,
                  dimensions: null
                },
                statusCode: ConstantStatusCode {
                  _value: 0,
                  _description: 'No Error',
                  _name: 'Good'
                },
                sourceTimestamp: 2021-02-06T11:41:03.147Z {
                  high_low: [ 30866556, -223644776 ],
                  picoseconds: 509600000
                },
                sourcePicoseconds: 509656000,
                serverTimestamp: 2021-02-06T11:41:03.147Z {
                  high_low: [ 30866556, -223644776 ],
                  picoseconds: 509600000
                },
                serverPicoseconds: 509656000
              }
            ]
          }
        },
        HistoryReadResult {
          statusCode: ConstantStatusCode {
            _value: 0,
            _description: 'No Error',
            _name: 'Good'
          },
          continuationPoint: null,
          historyData: HistoryData {
            dataValues: [
              DataValue {
                value: Variant {
                  dataType: 11,
                  arrayType: 0,
                  value: 5.767,
                  dimensions: null
                },
                statusCode: ConstantStatusCode {
                  _value: 0,
                  _description: 'No Error',
                  _name: 'Good'
                },
                sourceTimestamp: 2021-02-06T11:41:02.641Z {
                  high_low: [ 30866556, -228701117 ],
                  picoseconds: 875500000
                },
                sourcePicoseconds: 875504000,
                serverTimestamp: 2021-02-06T11:41:02.641Z {
                  high_low: [ 30866556, -228701117 ],
                  picoseconds: 875500000
                },
                serverPicoseconds: 875504000
              },
              DataValue {
                value: Variant {
                  dataType: 11,
                  arrayType: 0,
                  value: 6.161,
                  dimensions: null
                },
                statusCode: ConstantStatusCode {
                  _value: 0,
                  _description: 'No Error',
                  _name: 'Good'
                },
                sourceTimestamp: 2021-02-06T11:41:03.149Z {
                  high_low: [ 30866556, -223622973 ],
                  picoseconds: 689900000
                },
                sourcePicoseconds: 689901000,
                serverTimestamp: 2021-02-06T11:41:03.149Z {
                  high_low: [ 30866556, -223622973 ],
                  picoseconds: 689900000
                },
                serverPicoseconds: 689901000
              }
            ]
          }
        }
      ];



      

      if (readResults.length && readResults[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              dataItem = dataValue.value.value;
              console.log(chalk.green('OPC-UA clients: session history values for "CH_M51" group:'), chalk.cyan(`${dataItem}; Timestamp=${dataValue.sourceTimestamp}`));
              assert.ok(true, 'OPC-UA clients: session history values for "CH_M51" group');
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
      */
    } else {
      assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
    }
  });
  /*
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
    await pause(1000);
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
