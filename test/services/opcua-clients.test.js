/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const {
  getServerService,
  getClientService,
  getSrvCurrentState,
  inspector,
  isObject,
  getDateTimeSeparately,
  pause } = require('../../src/plugins');

const chalk = require('chalk');
const moment = require('moment');

const loRound = require('lodash/round');

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
  action: 'create',
  params: {
    port: 26560, // default - 26543, 26540 (opcua.test), 26550 (opcua.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test),
    serverInfo: { applicationName: 'UA-CHERKASSY-AZOT-M5.TEST1' },
  }
};

const clientData = {
  action: 'create',
  endpointUrl: 'opc.tcp://localhost:26546',
  params: {
    applicationName: 'UA-CHERKASSY-AZOT-M5.TEST1',
  }
};

const id = srvData.params.serverInfo.applicationName;

const userInfo = {
  email: 'opcua-clients@example.com',
  password: 'supersecret'
};

let opcuaUser = null;

describe('<<=== OPC-UA: Test (opcua-clients.test) ===>>', () => {
  let server;

  before(function (done) {
    if (isDebug) debug('before Start!');
    server = app.listen(port);
    server.once('listening', () => {
      setTimeout(() => done(), 500);
    });
  });

  after(function (done) {
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

  it('New user: created the service', async () => {
    const service = app.service('users');
    assert.ok(service, 'Users: registered the service');
    // service create
    const newUser = await service.create(userInfo);
    if (isLog) inspector('Created User service:', newUser);
    opcuaUser = newUser;
    assert.ok(newUser, 'newUser: created the service');
  });

  it('OPC-UA clients: created the service', async () => {
    const service = await getClientService(app, id);
    // service create
    const params = { user: opcuaUser, provider: 'rest', authenticated: true };
    const opcuaClient = await service.create(clientData, params);
    // debug('Service mixin.getNodeIds:', await service.getNodeIds(id, ['Device1.Temperature']));
    if (isLog) inspector('created the service.opcuaClient:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });

  it('OPC-UA clients: Error in creating an existing service', async () => {
    try {
      const service = await getClientService(app, id);
      // service create
      await service.create(clientData);
      assert.ok(false, 'OPC-UA clients: Error in creating an existing service');
    } catch (error) {
      assert.ok(true, 'OPC-UA clients: Error in creating an existing service');
    }
  });

  it('OPC-UA clients: get the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.get(id);
    if (isLog) inspector('get the service.currentState:', opcuaClient.client.getCurrentState());
    assert.ok(opcuaClient, 'OPC-UA servers: get the service');
  });

  it('OPC-UA clients: find services', async () => {
    const service = await getClientService(app, id);
    const opcuaClients = await service.find();
    if (isLog) inspector('find services.ids:', opcuaClients.map(cln => cln.id));
    assert.ok(opcuaClients.length, 'OPC-UA clients: find services');
  });

  it('OPC-UA clients: remove the service', async () => {
    try {
      // service remove
      const service = await getClientService(app, id);
      const opcuaClient = await service.remove(id);
      if (isLog) inspector('Remove the service:', opcuaClient);
      assert.ok(opcuaClient, 'OPC-UA clients: remove the service');
      await service.get(id);
      assert.ok(false, 'OPC-UA clients: remove the service');
    } catch (error) {
      assert.ok(true, 'OPC-UA clients: remove the service');
    }
  });

  it('OPC-UA clients: created the service', async () => {
    let opcuaClient;
    // service create
    const service = await getClientService(app, id);
    opcuaClient = await service.create(clientData);
    const currentState = opcuaClient.client.getCurrentState();
    if (isLog) inspector('created the service:', currentState);

    // Get opcuaClient
    opcuaClient = await service.get(currentState.id);
    if (isDebug) debug('get the service.id:', currentState.id);
    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });

  it('OPC-UA clients: update the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.update(id, clientData);
    if (isLog) inspector('Update the clients:', opcuaClient.client.getCurrentState());
    assert.ok(opcuaClient, 'OPC-UA clients: update the service');
  });

  it('OPC-UA clients: patch the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.patch(id, clientData);
    if (isLog) inspector('Patch the clients:', opcuaClient.client.getCurrentState());
    assert.ok(opcuaClient, 'OPC-UA clients: patch the service');
  });

  //============== CLIENT SESSION-CLOSE / SESSION-CREATE ====================//

  it('OPC-UA clients: session close the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.sessionClose(id);
    if (isLog) inspector('Session close the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: session close the service');
  });

  it('OPC-UA clients: session create the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.sessionCreate(id);
    if (isLog) inspector('Session create the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: session create the service');
  });

  //============== CLIENT-DISCONNECT / CLIENT-CONNECT ====================//

  it('OPC-UA clients: disconnect the service', async () => {
    const service = await getClientService(app, id);
    let opcuaClient = await service.sessionClose(id);
    opcuaClient = await service.opcuaClientDisconnect(id);
    if (isLog) inspector('Session close the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: session close the service');
  });

  it('OPC-UA clients: connect the service', async () => {
    const srvCurrentState = await getSrvCurrentState(app, id);
    // inspector('srvCurrentState:', srvCurrentState);
    const service = await getClientService(app, id);
    let opcuaClient = await service.opcuaClientConnect(id, srvCurrentState);
    opcuaClient = await service.sessionCreate(id);
    if (isLog) inspector('Connect the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: connect the service');
  });

  //============== CLIENT SESSION READ NAMESPACE ARRAY ====================//

  it('OPC-UA clients: session read namespace array', async () => {
    const service = await getClientService(app, id);
    const result = await service.sessionReadNamespaceArray(id);
    console.log(chalk.green('sessionReadNamespaceArray:'), chalk.cyan(`[ ${result} ]`));
    assert.ok(result, 'OPC-UA client session read namespace array');
  });

  //============== SESSION BROWSE ====================//

  it('OPC-UA clients: session browse', async () => {
    let browseResult = null, browseNames = '', nodeIds = '';
    const service = await getClientService(app, id);
    // service.sessionBrowse
    const path = 'RootFolder';// RootFolder|ObjectsFolder
    browseResult = await service.sessionBrowse(id, path);

    if (isLog) inspector('OPC-UA client session browse.browseResult:', browseResult);
    const statusCode = browseResult[0].statusCode.name;
    console.log(chalk.green(`sessionBrowse.${path}.statusCode:`), chalk.cyan(statusCode));
    browseNames = browseResult[0].references.map((r) => r.browseName.name).join(',');
    nodeIds = browseResult[0].references.map((r) => r.nodeId.toString()).join(',');
    console.log(chalk.green(`sessionBrowse.${path}.browseNames:`), chalk.cyan(browseNames));
    console.log(chalk.green(`sessionBrowse.${path}.nodeIds:`), chalk.cyan(nodeIds));

    assert.ok(browseResult, 'OPC-UA client session browse');
  });

  it('OPC-UA clients: session translate browse path', async () => {
    const service = await getClientService(app, id);
    // service.sessionTranslateBrowsePath
    const folder = 'RootFolder';
    const path = '/Objects/Server.ServerStatus.BuildInfo.ProductName';
    const browseResult = await service.sessionTranslateBrowsePath(id, folder, path);

    if (isLog) inspector('sessionTranslateBrowsePath.browseResult:', browseResult);
    console.log(chalk.green('sessionTranslateBrowsePath.data.folder:'), chalk.cyan(folder));
    console.log(chalk.green('sessionTranslateBrowsePath.data.path:'), chalk.cyan(path));
    console.log(chalk.green('sessionTranslateBrowsePath.browseResult.nodeId:'), chalk.cyan(browseResult[0].targets[0].targetId.toString()));

    assert.ok(browseResult, 'OPC-UA client session translate browse path');
  });

  //============== SESSION READ VALUES ====================//

  it('OPC-UA clients: session read', async () => {
    let nameNodeIds, attributeIds, readResult = null, value = null;
    const service = await getClientService(app, id);
    // service.sessionRead
    nameNodeIds = 'Device2.PressureVesselDevice';
    attributeIds = AttributeIds.BrowseName;
    readResult = await service.sessionRead(id, nameNodeIds, attributeIds);

    value = readResult[0].value.value;
    console.log(chalk.green('pressureVesselDevice.BrowseName:'), chalk.cyan(isObject(value) ? value.name : loRound(value, 3)));

    // service.sessionRead
    nameNodeIds = { nodeId: 'ns=1;s=Device2.PressureVesselDevice', attributeId: AttributeIds.Value };
    readResult = await service.sessionRead(id, nameNodeIds);

    value = readResult[0].value.value;
    console.log(chalk.green('pressureVesselDevice.value:'), chalk.cyan(isObject(value) ? value.name : loRound(value, 3)));

    // service.sessionRead
    nameNodeIds = ['Device1.Temperature', 'Device2.PressureVesselDevice'];
    attributeIds = [AttributeIds.Value, AttributeIds.BrowseName];
    readResult = await service.sessionRead(id, nameNodeIds, attributeIds);

    readResult.forEach((item, index) => {
      if (item.statusCode.name === 'Good') {
        value = item.value.value;
        value = item.value.dataType === DataType.QualifiedName ? value.name : loRound(value, 3);
        console.log(chalk.green(`${nameNodeIds[index]}.value:`), chalk.cyan(value));
      }
    });

    assert.ok(readResult, 'OPC-UA client session read');
  });

  it('OPC-UA clients: session read variable value', async () => {
    let value = null, readResult = null;
    const service = await getClientService(app, id);
    // service.sessionReadVariableValue
    const nameNodeIds = ['Device1.Temperature', 'Device2.PressureVesselDevice'];
    readResult = await service.sessionReadVariableValue(id, nameNodeIds);

    readResult.forEach((item, index) => {
      if (item.statusCode.name === 'Good') {
        value = item.value.value;
        value = loRound(value, 3);
        console.log(chalk.green(`${nameNodeIds[index]}.value:`), chalk.cyan(value));
      }
    });

    assert.ok(readResult, 'OPC-UA client session read');
  });

  it('OPC-UA client session read all attributes', async () => {
    let value = null, readResult = null;
    const service = await getClientService(app, id);
    // service.sessionReadAllAttributes
    readResult = await service.sessionReadAllAttributes(id, 'Device1.Temperature');

    if (isLog) inspector('sessionReadAllAttributes.readResult:', readResult);
    // inspector('sessionReadAllAttributes.readResult:', readResult);
    if (readResult && readResult.length) {
      value = readResult[0];
      if (value.statusCode === StatusCodes.Good) {
        console.log(chalk.green('sessionReadAllAttributes.nodeId:'), chalk.cyan(value.nodeId.toString()));
        console.log(chalk.green('sessionReadAllAttributes.browseName:'), chalk.cyan(value.browseName.name));
        console.log(chalk.green('sessionReadAllAttributes.displayName:'), chalk.cyan(value.displayName.text));
        console.log(chalk.green('sessionReadAllAttributes.value:'), chalk.cyan(loRound(value.value, 3)));
        assert.ok(readResult, 'OPC-UA client session read all attributes');
      } else {
        assert.ok(false, 'OPC-UA client session read all attributes');
      }
    } else {
      assert.ok(false, 'OPC-UA client session read all attributes');
    }
  });

  //============== SESSION HISTORY VALUES ====================//

  it('OPC-UA clients: session history value', async () => {
    let data, readResult = null;
    const service = await getClientService(app, id);

    const start = moment.utc().format();
    const dt = getDateTimeSeparately();
    dt.minutes = dt.minutes + 1;
    const end = moment.utc(Object.values(dt)).format();

    // service.getItemNodeId
    readResult = await service.getItemNodeId(id, 'Device2.PressureVesselDevice');

    if (isLog) inspector('getItemNodeId.readResult:', readResult);

    if (readResult) {
      // service.sessionReadHistoryValues
      readResult = await service.sessionReadHistoryValues(id, 'Device2.PressureVesselDevice', start, end);

      if (isLog) inspector('sessionReadHistoryValues.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              console.log(chalk.green('sessionReadHistoryValues.PressureVesselDevice:'), chalk.cyan(`${loRound(dataValue.value.value, 3)}; Timestamp=${dataValue.sourceTimestamp}`));
              assert.ok(true, 'OPC-UA clients: session history value');
            } else {
              assert.ok(false, 'OPC-UA clients: session history value');
            }
          });
        } else {
          assert.ok(false, 'OPC-UA clients: session history value');
        }
      } else {
        assert.ok(false, 'OPC-UA clients: session history value');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history value');
    }


  });

  //============== SESSION WRITE VALUE ====================//

  it('OPC-UA clients: session write single node value', async () => {
    let readResult, statusCode = null;
    const service = await getClientService(app, id);
    // service.sessionWriteSingleNode
    const dataForWrite = {
      dataType: DataType.String,
      value: 'Stored value',
    };
    statusCode = await service.sessionWriteSingleNode(id, 'Device1.VariableForWrite', dataForWrite);
    console.log(chalk.green('Device1.variableForWrite.statusCode:'), chalk.cyan(statusCode.name));

    // service.sessionRead
    readResult = await service.sessionRead(id, 'Device1.VariableForWrite');
    console.log(chalk.green('Device1.variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

    assert.ok(readResult[0].value.value === dataForWrite.value, 'OPC-UA clients: session write single node value');
  });

  it('OPC-UA clients: session write node value', async () => {
    let statusCodes = [], readResult = null;
    const service = await getClientService(app, id);
    // service.sessionWrite
    const dataForWrite = [
      {
        attributeId: AttributeIds.Value,
        value: {
          statusCode: StatusCodes.Good,
          value: {
            dataType: DataType.String,
            value: 'Stored value2'
          }
        }
      }
    ];
    statusCodes = await service.sessionWrite(id, 'Device1.VariableForWrite', dataForWrite);
    console.log(chalk.green('Device1.variableForWrite.statusCode:'), chalk.cyan(statusCodes[0].name));

    // service.sessionRead
    readResult = await service.sessionRead(id, 'Device1.VariableForWrite');
    console.log(chalk.green('Device1.variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

    assert.ok(readResult[0].value.value === dataForWrite[0].value.value.value, 'OPC-UA clients: session write node value');
  });

  //============== SESSION CALL METHOD ====================//

  it('OPC-UA clients: session call method', async () => {
    let callResults = [];
    const service = await getClientService(app, id);
    // service.sessionCallMethod
    const inputArguments = [[
      {
        dataType: DataType.UInt32,
        value: 2,
      },
      {
        dataType: DataType.UInt32,
        value: 3,
      }
    ]];
    callResults = await service.sessionCallMethod(id, 'Device1.SumMethod', inputArguments);
    console.log(chalk.green('Device1.SumMethod.statusCode:'), chalk.cyan(callResults[0].statusCode.name));
    console.log(chalk.green('Device1.SumMethod.callResult:'), chalk.cyan(callResults[0].outputArguments[0].value));

    assert.ok(callResults, 'OPC-UA clientS: session call method');
  });

  it('OPC-UA clients: session get method argument definition', async () => {
    let argumentsDefinition = [];
    const service = await getClientService(app, id);
    // service.sessionGetArgumentDefinition
    argumentsDefinition = await service.sessionGetArgumentDefinition(id, 'Device1.SumMethod');
    argumentsDefinition.inputArguments.forEach(argument => {
      console.log(chalk.green('Device1.SumMethod.inputArgument.name:'), chalk.cyan(argument.name));
      console.log(chalk.green('Device1.SumMethod.inputArgument.description:'), chalk.cyan(argument.description.text));
    });
    argumentsDefinition.outputArguments.forEach(argument => {
      console.log(chalk.green('Device1.SumMethod.outputArgument.name:'), chalk.cyan(argument.name));
      console.log(chalk.green('Device1.SumMethod.outputArgument.description:'), chalk.cyan(argument.description.text));
    });

    assert.ok(argumentsDefinition, 'OPC-UA clients: session get method argument definition');
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

  it('OPC-UA clients: subscription get monitored items', async () => {
    const service = await getClientService(app, id);
    // service.sessionGetMonitoredItems
    const monitoredItems = await service.sessionGetMonitoredItems(id);
    console.log(chalk.green('getMonitoredItems.clientHandles:'), chalk.cyan(monitoredItems.clientHandles));
    console.log(chalk.green('getMonitoredItems.serverHandles:'), chalk.cyan(monitoredItems.serverHandles));

    assert.ok(true, 'OPC-UA client subscription monitor');
  });

  it('OPC-UA clients: properties of service', async () => {
    const service = await getClientService(app, id);

    let result = await service.sessionSubscriptionCount(id);
    console.log(chalk.greenBright('client.sessionSubscriptionCount:'), chalk.cyan(result));
    result = await service.sessionIsReconnecting(id);
    console.log(chalk.greenBright('client.sessionIsReconnecting:'), chalk.cyan(result));
    result = await service.getCurrentState(id);
    inspector('client.getCurrentState:', result);
    result = await service.sessionToString(id);
    inspector('client.sessionToString:', result);
    result = await service.sessionEndpoint(id);
    if (isLog) inspector('client.sessionEndpoint:', result);
    result = await service.sessionGetPublishEngine(id);
    if (isLog) inspector('client.sessionGetPublishEngine:', result);
    result = await service.getSrvCurrentState(id);
    if (isLog) inspector('client.getSrvCurrentState:', result);
    result = await service.getClientInfo(id);
    if (isLog) inspector('client.getClientInfo:', result);

    assert.ok(true, 'OPC-UA clients: properties of client');
  });

  it('OPC-UA servers: properties of service', async () => {
    const service = await getServerService(app, id);

    let result = await service.getBytesWritten(id);
    console.log(chalk.greenBright('server.getBytesWritten:'), chalk.cyan(result));
    result = await service.getBytesRead(id);
    console.log(chalk.greenBright('server.getBytesRead:'), chalk.cyan(result));
    result = await service.getTransactionsCount(id);
    console.log(chalk.greenBright('server.getTransactionsCount:'), chalk.cyan(result));
    result = await service.getCurrentChannelCount(id);
    console.log(chalk.greenBright('server.getCurrentChannelCount:'), chalk.cyan(result));
    result = await service.getCurrentSubscriptionCount(id);
    console.log(chalk.greenBright('server.getCurrentSubscriptionCount:'), chalk.cyan(result));
    result = await service.getRejectedSessionCount(id);
    console.log(chalk.greenBright('server.getRejectedSessionCount:'), chalk.cyan(result));
    result = await service.getRejectedRequestsCount(id);
    console.log(chalk.greenBright('server.getRejectedRequestsCount:'), chalk.cyan(result));
    result = await service.getSessionAbortCount(id);
    console.log(chalk.greenBright('server.getSessionAbortCount:'), chalk.cyan(result));
    result = await service.getPublishingIntervalCount(id);
    console.log(chalk.greenBright('server.getPublishingIntervalCount:'), chalk.cyan(result));
    result = await service.getCurrentSessionCount(id);
    console.log(chalk.greenBright('server.getCurrentSessionCount:'), chalk.cyan(result));
    result = await service.isInitialized(id);
    console.log(chalk.greenBright('server.isInitialized:'), chalk.cyan(result));
    result = await service.isAuditing(id);
    console.log(chalk.greenBright('server.isAuditing:'), chalk.cyan(result));
    result = await service.getServerInfo(id);
    inspector('server.getServerInfo:', result);
    result = await service.getBuildInfo(id);
    inspector('server.getBuildInfo:', result);
    result = await service.getCurrentState(id);
    if (isLog) inspector('server.getCurrentState:', result);

    assert.ok(true, 'OPC-UA servers: properties of server');
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
    const opcuaServer = await service.opcuaServerShutdown(id, 1500);
    if (isLog) inspector('Shutdown the server:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: shutdown the service');
  });

});
