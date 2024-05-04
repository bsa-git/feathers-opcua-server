/* eslint-disable no-unused-vars */
const assert = require('assert');

const {
  UserTokenType
} = require('node-opcua');

require('../../src/app');
const {
  appRoot,
  inspector,
  makeDirSync,
  removeFilesFromDirSync,
  getTime,
  OpcuaServer,
  OpcuaClient,
  pause,
  isObject,
  getIntervalIds,
  clearIntervalIds
} = require('../../src/plugins');

const chalk = require('chalk');
const moment = require('moment');
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');

const {
  DataType,
  AttributeIds,
  StatusCodes,
  makeBrowsePath,
  MessageSecurityMode,
  SecurityPolicy
} = require('node-opcua');
const debug = require('debug')('app:opcua-class.test');
const isDebug = false;
const isLog = false;

// Options
const srvParams = {
  port: 26540, // default - 26543, 26540 (opcua.test), 26550 (opcua.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test),
  serverInfo: { applicationName: 'ua-cherkassy-azot_test1' },
};

// Default user identity info
const userIdentityInfo = { type: UserTokenType.UserName, userName: process.env.OPCUA_ADMIN_LOGIN, password: process.env.OPCUA_ADMIN_PASS };

const clientParams = {
  applicationName: 'ua-cherkassy-azot_test1',
  securityMode: MessageSecurityMode.SignAndEncrypt,
  securityPolicy: SecurityPolicy.Basic256Sha256
};

let server = null, client = null;
let opcuaServer = null, opcuaClient = null;


describe('<<=== OPC-UA: Test (opcua-class.test) ===>>', () => {

  before(async () => {
    // Create OPC-UA server
    server = new OpcuaServer(srvParams);
    // Create OPC-UA client
    client = new OpcuaClient(clientParams);
    // Make dirs
    makeDirSync([appRoot, 'test/data/tmp/test1']);
  });

  after(async () => {
    if (opcuaClient !== null) opcuaClient = null;
    if (client !== null) client = null;

    if (opcuaServer !== null) opcuaServer = null;
    if (server !== null) server = null;

    clearIntervalIds();
    removeFilesFromDirSync([appRoot, 'test/data/tmp/test1']);
    console.log(chalk.white('<<=== END: Test (opcua-class.test) ===>>'));
  });

  it('#1: Server object created', async () => {
    assert.ok(server, 'OPCUA server not created');
  });
  
  it('#2: Client object created', async () => {
    assert.ok(client, 'OPCUA client not created');
  });

  it('#3: OPC-UA server start', async () => {
    await server.opcuaServerCreate();
    server.constructAddressSpace();
    const endpoints = await server.opcuaServerStart();
    opcuaServer = server.opcuaServer;
    console.log(chalk.green('server.securityMode'), chalk.cyan(endpoints[0].securityMode));
    console.log(chalk.green('server.securityPolicyUri'), chalk.cyan(endpoints[0].securityPolicyUri));
    assert.ok(true, 'OPC-UA server start');
  });

  it('#4: OPC-UA client create', async () => {
    client.opcuaClientCreate();
    opcuaClient = client.opcuaClient;
    assert.ok(true, 'OPC-UA client create');
  });

  it('#5: OPC-UA client connect', async () => {
    await client.opcuaClientConnect(server.getCurrentState());
    assert.ok(true, 'OPC-UA client connect');
  });

  it('#6: OPC-UA client session create', async () => {
    await client.sessionCreate(userIdentityInfo);
    assert.ok(true, 'OPC-UA client session create');
  });

  //============== SESSION READ NAMESPACE ARRAY ====================//

  it('#7: OPC-UA client session read namespace array', async () => {
    const result = await client.sessionReadNamespaceArray();
    console.log(chalk.green('sessionReadNamespaceArray:'), chalk.cyan(`[ ${result} ]`));
    assert.ok(true, 'OPC-UA client session create');
  });

  //============== SESSION BROWSE ====================//

  it('#8: OPC-UA client session browse', async () => {
    let browseResult = null, browseNames = '', nodeIds = '';
    const folder = 'RootFolder';// RootFolder|ObjectsFolder
    browseResult = await client.sessionBrowse({ nodeId: folder });
    // inspector('OPC-UA client session browse.browseResult:', browseResult);
    const statusCode = browseResult[0].statusCode.name;
    console.log(chalk.green(`sessionBrowse.${folder}.statusCode:`), chalk.cyan(statusCode));
    browseNames = browseResult[0].references.map((r) => r.browseName.name).join(',');
    nodeIds = browseResult[0].references.map((r) => r.nodeId.toString()).join(',');
    console.log(chalk.green(`sessionBrowse.${folder}.browseNames:`), chalk.cyan(browseNames));
    console.log(chalk.green(`sessionBrowse.${folder}.nodeIds:`), chalk.cyan(nodeIds));
    assert.ok(browseResult, 'OPC-UA client session browse');
  });

  it('#9: OPC-UA client session browse2', async () => {
    let browseResult = null, browseNames = '', nodeIds = '';
    const folder = 'ObjectsFolder';// RootFolder|ObjectsFolder
    browseResult = await client.sessionBrowse(folder);
    // inspector('OPC-UA client session browse.browseResult:', browseResult);
    const statusCode = browseResult[0].statusCode.name;
    console.log(chalk.green(`sessionBrowse.${folder}.statusCode:`), chalk.cyan(statusCode));
    browseNames = browseResult[0].references.map((r) => r.browseName.name).join(',');
    nodeIds = browseResult[0].references.map((r) => r.nodeId.toString()).join(',');
    console.log(chalk.green(`sessionBrowse.${folder}.browseNames:`), chalk.cyan(browseNames));
    console.log(chalk.green(`sessionBrowse.${folder}.nodeIds:`), chalk.cyan(nodeIds));
    assert.ok(browseResult, 'OPC-UA client session browse');
  });

  it('#10: OPC-UA client session translate browse path', async () => {
    let browsePath = null, browseResult = null;
    browsePath = makeBrowsePath(
      'RootFolder',
      '/Objects/Server.ServerStatus.BuildInfo.ProductName'
    );
    if (isLog) inspector('sessionTranslateBrowsePath.browsePath:', browsePath);
    // inspector('sessionTranslateBrowsePath.browsePath:', browsePath);
    browseResult = await client.sessionTranslateBrowsePath(browsePath);
    if (isLog) inspector('sessionTranslateBrowsePath.browseResult:', browseResult);
    // inspector('sessionTranslateBrowsePath.browseResult:', browseResult);
    console.log(chalk.green('sessionTranslateBrowsePath.nodeId:'), chalk.cyan(browseResult[0].targets[0].targetId.toString()));

    assert.ok(browseResult, 'OPC-UA client session translate browse path');
  });

  //============== SESSION READ VALUES ====================//

  it('#11: OPC-UA client session read', async () => {
    let readResult = null, value = null, nameNodeIds = [];
    readResult = await client.sessionRead('Device2.PressureVesselDevice', AttributeIds.BrowseName);// AttributeIds: BrowseName, Value
    value = readResult[0].value.value;
    console.log(chalk.green('pressureVesselDevice.BrowseName:'), chalk.cyan(isObject(value) ? value.name : loRound(value, 3)));

    readResult = await client.sessionRead([{ nodeId: 'ns=1;s=Device2.PressureVesselDevice', attributeId: AttributeIds.Value }]);
    value = readResult[0].value.value;
    console.log(chalk.green('pressureVesselDevice.value:'), chalk.cyan(isObject(value) ? value.name : loRound(value, 3)));

    nameNodeIds = ['Device1.Temperature', 'Device2.PressureVesselDevice'];
    readResult = await client.sessionRead(nameNodeIds, [AttributeIds.Value, AttributeIds.BrowseName]);
    // inspector('client.sessionRead.readResult:', readResult);
    readResult.forEach((item, index) => {
      if (item.statusCode.name === 'Good') {
        value = item.value.value;
        value = item.value.dataType === DataType.QualifiedName ? value.name : loRound(value, 3);
        console.log(chalk.green(`${nameNodeIds[index]}.value:`), chalk.cyan(value));
      }
    });
    assert.ok(readResult, 'OPC-UA client session read');
  });

  it('#12: OPC-UA client session read variable value', async () => {
    let value = null, readResult = null, nameNodeIds = [];
    // Read variable values
    nameNodeIds = ['Device1.Temperature', 'Device2.PressureVesselDevice'];
    readResult = await client.sessionReadVariableValue(nameNodeIds);
    readResult.forEach((item, index) => {
      if (item.statusCode.name === 'Good') {
        value = item.value.value;
        value = loRound(value, 3);
        console.log(chalk.green(`${nameNodeIds[index]}.value:`), chalk.cyan(value));
      }
    });
    assert.ok(readResult, 'OPC-UA client session read');
  });

  it('#13: OPC-UA client session read all attributes', async () => {
    let readResult;
    // Read all attributes for temperature
    readResult = await client.sessionReadAllAttributes('Device1.Temperature');
    if (readResult && readResult.length) {
      readResult = readResult[0];
      if (readResult.statusCode === StatusCodes.Good) {
        console.log(chalk.green('nodeId:'), chalk.cyan(readResult.nodeId.toString()));
        console.log(chalk.green('browseName:'), chalk.cyan(readResult.browseName.name));
        console.log(chalk.green('displayName:'), chalk.cyan(readResult.displayName.text));
        console.log(chalk.green('value:'), chalk.cyan(loRound(readResult.value, 3)));
      }
    }
    assert.ok(readResult, 'OPC-UA client session read all attributes');
  });

  //============== SESSION HISTORY VALUES ====================//

  it('#14: OPC-UA client session history value', async () => {
    let readResult = null;
    //---------------------------------------------------------
    if (client.getItemNodeId('Device2.PressureVesselDevice')) {
      // Get start time
      // const start = moment.utc().format();
      const start = moment();
      debug('SessionHistoryValue.StartTime:', getTime(start, false));
      await pause(1000);
      // Get end time
      // const end = moment.utc().format();
      const end = moment();
      debug('SessionHistoryValue.EndTime:', getTime(end, false));

      readResult = await client.sessionReadHistoryValues('Device2.PressureVesselDevice', start, end);
      if (isLog && readResult) inspector('SessionHistoryValue.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            if (dataValue.statusCode.name === 'Good') {
              console.log(chalk.green('historyValue.PressureVesselDevice:'), chalk.cyan(`${loRound(dataValue.value.value, 3)}; Timestamp=${dataValue.sourceTimestamp}`));
              assert.ok(readResult, 'OPC-UA client session history value');
            } else {
              assert.ok(false, 'OPC-UA client session history value');
            }
          });
        } else {
          assert.ok(false, 'OPC-UA client session history value');
        }
      } else {
        assert.ok(false, 'OPC-UA client session history value');
      }
    } else {
      assert.ok(false, 'OPC-UA client session history value');
    }

  });

  //============== SESSION WRITE VALUE ====================//

  it('#15: OPC-UA client session write single node value', async () => {
    let statusCode = null, readResult = null;
    let variantValue = {
      dataType: DataType.String,
      value: 'Stored value',
    };
    statusCode = await client.sessionWriteSingleNode('Device1.VariableForWrite', variantValue);
    console.log(chalk.green('Device1.variableForWrite.statusCode:'), chalk.cyan(statusCode.name));
    readResult = await client.sessionRead('Device1.VariableForWrite');
    console.log(chalk.green('Device1.variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

    assert.ok(readResult[0].value.value === variantValue.value, 'OPC-UA client session write single node value');
  });

  it('#16: OPC-UA client session write node value', async () => {
    let statusCodes = [], readResult = null;
    const valuesToWrite = [
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

    statusCodes = await client.sessionWrite('Device1.VariableForWrite', valuesToWrite);
    console.log(chalk.green('Device1.variableForWrite.statusCode:'), chalk.cyan(statusCodes[0].name));
    readResult = await client.sessionRead('Device1.VariableForWrite');
    console.log(chalk.green('Device1.variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

    assert.ok(readResult[0].value.value === valuesToWrite[0].value.value.value, 'OPC-UA client session write node value');
  });

  //============== SESSION CALL METHOD ====================//

  it('#17: OPC-UA client session call method', async () => {
    let callResults = [];
    let inputArguments = [[
      {
        dataType: DataType.UInt32,
        value: 2,
      },
      {
        dataType: DataType.UInt32,
        value: 3,
      }
    ]];
    callResults = await client.sessionCallMethod('Device1.SumMethod', inputArguments);
    console.log(chalk.green('Device1.SumMethod.statusCode:'), chalk.cyan(callResults[0].statusCode.name));
    console.log(chalk.green('Device1.SumMethod.callResult:'), chalk.cyan(callResults[0].outputArguments[0].value));

    assert.ok(callResults, 'OPC-UA client session call method');
  });

  it('#18: OPC-UA client session get method argument definition', async () => {
    let argumentsDefinition = [];
    argumentsDefinition = await client.sessionGetArgumentDefinition('Device1.SumMethod');
    argumentsDefinition.inputArguments.forEach(argument => {
      console.log(chalk.green('Device1.SumMethod.inputArgument.name:'), chalk.cyan(argument.name));
      console.log(chalk.green('Device1.SumMethod.inputArgument.description:'), chalk.cyan(argument.description.text));
    });
    argumentsDefinition.outputArguments.forEach(argument => {
      console.log(chalk.green('Device1.SumMethod.outputArgument.name:'), chalk.cyan(argument.name));
      console.log(chalk.green('Device1.SumMethod.outputArgument.description:'), chalk.cyan(argument.description.text));
    });

    assert.ok(argumentsDefinition, 'OPC-UA client session get method argument definition');
  });

  //============== START SUBSCRIPTION ====================//

  it('#19: OPC-UA client subscription create', async () => {
    await client.subscriptionCreate();
    assert.ok(true, 'OPC-UA client subscription create');
  });

  it('#20: OPC-UA client subscription monitor', async () => {
    const nameNodeIds = ['Device1.Temperature'];
    client.getNodeIds(nameNodeIds).forEach(async nodeId => {
      // await client.subscriptionMonitor(cbSubscriptionMonitor, { nodeId });
      await client.subscriptionMonitor(null, { nodeId });
    });
    // await pause(1000);
    assert.ok(true, 'OPC-UA client subscription monitor');
  });

  it('#21: OPC-UA client subscription get monitored items', async () => {
    const monitoredItems = await client.sessionGetMonitoredItems(client.subscription.subscriptionId);
    console.log(chalk.green('getMonitoredItems.clientHandles:'), chalk.cyan(monitoredItems.clientHandles));
    console.log(chalk.green('getMonitoredItems.serverHandles:'), chalk.cyan(monitoredItems.serverHandles));
    assert.ok(true, 'OPC-UA client subscription monitor');
  });

  it('#22: OPC-UA client subscription terminate', async () => {
    await pause(1000);
    await client.subscriptionTerminate();
    assert.ok(true, 'OPC-UA client subscription terminate');
  });

  //===== SESSION CLOSE/CLIENT DISCONNECT/SERVER SHUTDOWN =====//

  it('#22: OPC-UA client session close', async () => {
    await client.sessionClose();
    assert.ok(true, 'OPC-UA client session close');
  });

  it('#23: OPC-UA client disconnect', async () => {
    await client.opcuaClientDisconnect();
    assert.ok(true, 'OPC-UA client disconnect');
  });

  it('#24: OPC-UA server shutdown', async () => {
    await server.opcuaServerShutdown();
    assert.ok(true, 'OPC-UA server shutdown');
  });
});
