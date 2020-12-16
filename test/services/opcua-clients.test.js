/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const { getValueFromNodeId, inspector, isObject, getDateTimeSeparately, pause } = require('../../src/plugins');
const chalk = require('chalk');
const moment = require('moment');

const loMerge = require('lodash/merge');
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
    port: 26546, // default - 26543, 26544 (opcua.test), 26545 (opcua.test2), 26546 (opcua-clients.test), 26547 (opcua-servers.test),
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

const userInfo = {
  email: 'opcua-clients@example.com',
  password: 'supersecret'
};

let opcuaUser = null;

/**
 * Call back function for subscription monitor
 * @param {Object} params 
 * @param {Object} DataValue 
 */
const cbSubscriptionMonitor = async (params, dataValue) => {
  if (isDebug) debug('cbSubscriptionMonitor.nodeId:', params.nodeId);
  const browseName = getValueFromNodeId(params.nodeId);
  const value = loRound(dataValue.value.value, 3);
  console.log(chalk.green(`subscription::${browseName}:`), chalk.cyan(value));
};

describe('<<=== OPC-UA: \'opcua-clients\' service ===>>', () => {
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

  it('OPC-UA clients: registered the service', () => {
    const service = app.service('opcua-clients');
    assert.ok(service, 'OPC-UA clients: registered the service');
  });

  it('OPC-UA servers: registered the service', () => {
    const service = app.service('opcua-servers');
    assert.ok(service, 'OPC-UA servers: registered the service');
  });

  //===== SERVER CREATE/CLIENT CREATE =======//
  it('OPC-UA servers: created the service', async () => {
    const service = app.service('opcua-servers');
    // service create
    const opcuaServer = await service.create(srvData);
    if (isLog) inspector('created the service.opcuaServer:', opcuaServer.server.getCurrentState());
    // inspector('created the service.opcuaServer:', opcuaServer.server.getCurrentState());

    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('New user: created the service', async () => {
    try {
      const service = app.service('users');
      assert.ok(service, 'Users: registered the service');
      // service create
      const newUser = await service.create(userInfo);
      if (isLog) inspector('Created User service:', newUser);
      opcuaUser = newUser;
      assert.ok(newUser, 'newUser: created the service');
    } catch (error) {
      assert.ok(false, 'New user: created the service');
    }
  });

  it('OPC-UA clients: created the service', async () => {
    const service = app.service('opcua-clients');
    // service create
    const params = { user: opcuaUser, provider: 'rest', authenticated: true };
    const opcuaClient = await service.create(clientData, params);
    if (isLog) inspector('created the service.opcuaClient:', opcuaClient);
    // inspector('created the service.opcuaClient:', opcuaClient);

    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });

  it('OPC-UA clients: Error in creating an existing service', async () => {
    const service = app.service('opcua-clients');
    try {
      // service create
      await service.create(clientData);
      assert.ok(false, 'OPC-UA clients: Error in creating an existing service');
    } catch (error) {
      assert.ok(true, 'OPC-UA clients: Error in creating an existing service');
    }
  });

  it('OPC-UA clients: get the service', async () => {
    const service = app.service('opcua-clients');
    const id = clientData.params.applicationName;
    const opcuaClient = await service.get(id);
    if (isLog) inspector('get the service.currentState:', opcuaClient.client.getCurrentState());
    // inspector('get the service.currentState:', opcuaClient.client.getCurrentState());

    assert.ok(opcuaClient, 'OPC-UA servers: get the service');
  });

  it('OPC-UA clients: find services', async () => {
    const service = app.service('opcua-clients');
    const opcuaClients = await service.find();
    if (isLog) inspector('find services.ids:', opcuaClients.map(cln => cln.id));
    // inspector('find services.ids:', opcuaClients.map(cln => cln.id));

    assert.ok(opcuaClients.length, 'OPC-UA clients: find services');
  });

  it('OPC-UA clients: remove the service', async () => {
    try {
      // service remove
      const service = app.service('opcua-clients');
      const id = clientData.params.applicationName;
      const opcuaClient = await service.remove(id);
      if (isLog) inspector('Remove the service:', opcuaClient);
      // inspector('Remove the service:', opcuaClient);
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
    const service = app.service('opcua-clients');
    opcuaClient = await service.create(clientData);
    const currentState = opcuaClient.client.getCurrentState();
    if (isLog) inspector('created the service:', currentState);
    // inspector('created the service:', currentState);

    // Get opcuaClient
    opcuaClient = await service.get(currentState.id);
    if (isDebug) debug('get the service.id:', currentState.id);
    debug('get the service.id:', currentState.id);
    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });

  it('OPC-UA clients: update the service', async () => {
    const service = app.service('opcua-clients');
    const id = clientData.params.applicationName;
    const opcuaClient = await service.update(id, clientData);
    if (isLog) inspector('Update the clients:', opcuaClient.client.getCurrentState());
    // inspector('Update the clients:', opcuaClient.client.getCurrentState());

    assert.ok(opcuaClient, 'OPC-UA clients: update the service');
  });

  it('OPC-UA clients: patch the service', async () => {
    const service = app.service('opcua-clients');
    const id = clientData.params.applicationName;
    const opcuaClient = await service.patch(id, clientData);
    if (isLog) inspector('Patch the clients:', opcuaClient.client.getCurrentState());
    inspector('Patch the clients:', opcuaClient.client.getCurrentState());

    assert.ok(opcuaClient, 'OPC-UA clients: patch the service');
  });


  //============== CLIENT SESSION READ NAMESPACE ARRAY ====================//

  it('OPC-UA clients: session read namespace array', async () => {
    const service = app.service('opcua-clients');
    // Execute action -> sessionReadNamespaceArray
    const data = {
      action: 'sessionReadNamespaceArray',
      id: clientData.params.applicationName
    };
    const result = await service.create(data);
    console.log(chalk.green('sessionReadNamespaceArray:'), chalk.cyan(`[ ${result} ]`));
    assert.ok(result, 'OPC-UA client session read namespace array');
  });

  //============== SESSION BROWSE ====================//

  it('OPC-UA clients: session browse', async () => {
    let browseResult = null, browseNames = '', nodeIds = '';
    // const folder = 'RootFolder';

    const service = app.service('opcua-clients');
    // Execute action -> sessionBrowse
    const data = {
      action: 'sessionBrowse',
      id: clientData.params.applicationName,
      path: 'RootFolder'// RootFolder|ObjectsFolder
    };
    browseResult = await service.create(data);

    if (isLog) inspector('OPC-UA client session browse.browseResult:', browseResult);
    const statusCode = browseResult[0].statusCode.name;
    console.log(chalk.green(`sessionBrowse.${data.path}.statusCode:`), chalk.cyan(statusCode));
    browseNames = browseResult[0].references.map((r) => r.browseName.name).join(',');
    nodeIds = browseResult[0].references.map((r) => r.nodeId.toString()).join(',');
    console.log(chalk.green(`sessionBrowse.${data.path}.browseNames:`), chalk.cyan(browseNames));
    console.log(chalk.green(`sessionBrowse.${data.path}.nodeIds:`), chalk.cyan(nodeIds));
    assert.ok(browseResult, 'OPC-UA client session browse');
  });

  it('OPC-UA clients: session translate browse path', async () => {
    const service = app.service('opcua-clients');
    // Execute action -> sessionTranslateBrowsePath
    const data = {
      action: 'sessionTranslateBrowsePath',
      id: clientData.params.applicationName,
      folder: 'RootFolder',
      path: '/Objects/Server.ServerStatus.BuildInfo.ProductName'
    };
    const browseResult = await service.create(data);

    if (isLog) inspector('sessionTranslateBrowsePath.browseResult:', browseResult);
    // inspector('sessionTranslateBrowsePath.browseResult:', browseResult);
    console.log(chalk.green('sessionTranslateBrowsePath.data.folder:'), chalk.cyan(data.folder));
    console.log(chalk.green('sessionTranslateBrowsePath.data.path:'), chalk.cyan(data.path));
    console.log(chalk.green('sessionTranslateBrowsePath.browseResult.nodeId:'), chalk.cyan(browseResult[0].targets[0].targetId.toString()));

    assert.ok(browseResult, 'OPC-UA client session translate browse path');
  });

  //============== SESSION READ VALUES ====================//

  it('OPC-UA clients: session read', async () => {
    let data, readResult = null, value = null;

    const service = app.service('opcua-clients');
    // Execute action -> sessionRead
    data = {
      action: 'sessionRead',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device2.PressureVesselDevice',
      attributeIds: AttributeIds.BrowseName
    };
    readResult = await service.create(data);

    value = readResult[0].value.value;
    console.log(chalk.green('pressureVesselDevice.BrowseName:'), chalk.cyan(isObject(value) ? value.name : loRound(value, 3)));

    data = {
      action: 'sessionRead',
      id: clientData.params.applicationName,
      nameNodeIds: { nodeId: 'ns=1;s=Device2.PressureVesselDevice', attributeId: AttributeIds.Value }
    };
    readResult = await service.create(data);

    value = readResult[0].value.value;
    console.log(chalk.green('pressureVesselDevice.value:'), chalk.cyan(isObject(value) ? value.name : loRound(value, 3)));

    data = {
      action: 'sessionRead',
      id: clientData.params.applicationName,
      nameNodeIds: ['Device1.Temperature', 'Device2.PressureVesselDevice'],
      attributeIds: [AttributeIds.Value, AttributeIds.BrowseName]
    };
    readResult = await service.create(data);

    readResult.forEach((item, index) => {
      if (item.statusCode.name === 'Good') {
        value = item.value.value;
        value = item.value.dataType === DataType.QualifiedName ? value.name : loRound(value, 3);
        console.log(chalk.green(`${data.nameNodeIds[index]}.value:`), chalk.cyan(value));
      }
    });
    assert.ok(readResult, 'OPC-UA client session read');
  });

  it('OPC-UA clients: session read variable value', async () => {
    let value = null, readResult = null;
    const service = app.service('opcua-clients');
    // Execute action -> sessionReadVariableValue
    const data = {
      action: 'sessionReadVariableValue',
      id: clientData.params.applicationName,
      nameNodeIds: ['Device1.Temperature', 'Device2.PressureVesselDevice']
    };
    readResult = await service.create(data);
    readResult.forEach((item, index) => {
      if (item.statusCode.name === 'Good') {
        value = item.value.value;
        value = loRound(value, 3);
        console.log(chalk.green(`${data.nameNodeIds[index]}.value:`), chalk.cyan(value));
      }
    });
    assert.ok(readResult, 'OPC-UA client session read');
  });

  it('OPC-UA client session read all attributes', async () => {
    let value = null, readResult = null;
    const service = app.service('opcua-clients');
    // Execute action -> sessionReadAllAttributes
    const data = {
      action: 'sessionReadAllAttributes',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device1.Temperature',
    };
    readResult = await service.create(data);
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
      }
    }
  });

  //============== SESSION HISTORY VALUES ====================//

  it('OPC-UA clients: session history value', async () => {
    let data, readResult = null;
    const service = app.service('opcua-clients');

    const start = moment.utc().format();
    const dt = getDateTimeSeparately();
    dt.minutes = dt.minutes + 1;
    const end = moment.utc(Object.values(dt)).format();

    await pause(1500);

    // Execute action -> getItemNodeId
    data = {
      action: 'getItemNodeId',
      id: clientData.params.applicationName,
      nameNodeId: 'Device2.PressureVesselDevice',
    };

    readResult = await service.create(data);
    if (isLog) inspector('getItemNodeId.readResult:', readResult);
    // inspector('getItemNodeId.readResult:', readResult);

    if (readResult) {
      // Execute action -> sessionReadHistoryValues
      data = {
        action: 'sessionReadHistoryValues',
        id: clientData.params.applicationName,
        nameNodeIds: 'Device2.PressureVesselDevice',
        start,
        end
      };
      readResult = await service.create(data);
      if (isLog) inspector('sessionReadHistoryValues.readResult:', readResult);
      // inspector('sessionReadHistoryValues.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              console.log(chalk.green('sessionReadHistoryValues.PressureVesselDevice:'), chalk.cyan(`${loRound(dataValue.value.value, 3)}; Timestamp=${dataValue.sourceTimestamp}`));
            }
          });
        }
      }
    }
    assert.ok(readResult, 'OPC-UA clients: session history value');
  });

  //============== SESSION WRITE VALUE ====================//

  it('OPC-UA clients: session write single node value', async () => {
    let readResult, statusCode = null;
    const service = app.service('opcua-clients');
    // Execute action -> sessionWriteSingleNode
    const dataForWrite = {
      action: 'sessionWriteSingleNode',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device1.VariableForWrite',
      value: {
        dataType: DataType.String,
        value: 'Stored value',
      }
    };
    statusCode = await service.create(dataForWrite);
    console.log(chalk.green('Device1.variableForWrite.statusCode:'), chalk.cyan(statusCode.name));

    // Execute action -> sessionRead
    const dataForRead = {
      action: 'sessionRead',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device1.VariableForWrite'
    };
    readResult = await service.create(dataForRead);
    console.log(chalk.green('Device1.variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

    assert.ok(readResult[0].value.value === dataForWrite.value.value, 'OPC-UA clients: session write single node value');
  });

  it('OPC-UA clients: session write node value', async () => {
    let statusCodes = [], readResult = null;
    const service = app.service('opcua-clients');
    // Execute action -> sessionWrite
    const dataForWrite = {
      action: 'sessionWrite',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device1.VariableForWrite',
      values: [
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
      ]
    };
    statusCodes = await service.create(dataForWrite);
    console.log(chalk.green('Device1.variableForWrite.statusCode:'), chalk.cyan(statusCodes[0].name));

    // Execute action -> sessionRead
    const dataForRead = {
      action: 'sessionRead',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device1.VariableForWrite'
    };
    readResult = await service.create(dataForRead);
    console.log(chalk.green('Device1.variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

    assert.ok(readResult[0].value.value === dataForWrite.values[0].value.value.value, 'OPC-UA clients: session write node value');
  });

  //============== SESSION CALL METHOD ====================//

  it('OPC-UA clients: session call method', async () => {
    let callResults = [];
    const service = app.service('opcua-clients');
    // Execute action -> sessionCallMethod
    const data = {
      action: 'sessionCallMethod',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device1.SumMethod',
      inputArguments: [
        {
          dataType: DataType.UInt32,
          value: 2,
        },
        {
          dataType: DataType.UInt32,
          value: 3,
        }
      ]
    };
    callResults = await service.create(data);
    console.log(chalk.green('Device1.SumMethod.statusCode:'), chalk.cyan(callResults[0].statusCode.name));
    console.log(chalk.green('Device1.SumMethod.callResult:'), chalk.cyan(callResults[0].outputArguments[0].value));

    assert.ok(callResults, 'OPC-UA clientS: session call method');
  });

  it('OPC-UA clients: session get method argument definition', async () => {
    let argumentsDefinition = [];
    const service = app.service('opcua-clients');
    // Execute action -> sessionGetArgumentDefinition
    const data = {
      action: 'sessionGetArgumentDefinition',
      id: clientData.params.applicationName,
      nameNodeIds: 'Device1.SumMethod'
    };
    argumentsDefinition = await service.create(data);

    // argumentsDefinition = await client.sessionGetArgumentDefinition('Device1.SumMethod');
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
    const service = app.service('opcua-clients');
    // Execute action -> subscriptionCreate
    const data = {
      action: 'subscriptionCreate',
      id: clientData.params.applicationName,
    };
    await service.create(data);
    // client.subscriptionCreate();
    assert.ok(true, 'OPC-UA clients: subscription create');
  });

  // it('OPC-UA client subscription monitor', async () => {
  //   // const nameNodeIds = ['Device1.Temperature'];
  //   let data;
  //   const service = app.service('opcua-clients');
  //   // Execute action -> subscriptionCreate
  //   data = {
  //     action: 'getNodeIds',
  //     id: clientData.params.applicationName,
  //     nameNodeIds: ['Device1.Temperature']
  //   };
  //   const nodeIds = await service.create(data);
  //   if (nodeIds.length) {
  //     nodeIds.forEach(async nodeId => {

  //       await client.subscriptionMonitor(cbSubscriptionMonitor, { nodeId });
  //     });
  //     // await pause(1000);
  //     assert.ok(true, 'OPC-UA client subscription monitor');
  //   }
  // });

  // it('OPC-UA client subscription get monitored items', async () => {
  //   const monitoredItems = await client.sessionGetMonitoredItems(client.subscription.subscriptionId);
  //   console.log(chalk.green('getMonitoredItems.clientHandles:'), chalk.cyan(monitoredItems.clientHandles));
  //   console.log(chalk.green('getMonitoredItems.serverHandles:'), chalk.cyan(monitoredItems.serverHandles));
  //   assert.ok(true, 'OPC-UA client subscription monitor');
  // });

  it('OPC-UA clients: subscription terminate', async () => {
    const service = app.service('opcua-clients');
    // Execute action -> subscriptionTerminate
    const data = {
      action: 'subscriptionTerminate',
      id: clientData.params.applicationName,
    };
    await pause(1000);
    await service.create(data);

    // await client.subscriptionTerminate();
    assert.ok(true, 'OPC-UA clients: subscription terminate');
  });

});
