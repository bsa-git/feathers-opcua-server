/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { getValueFromNodeId, OpcuaServer, OpcuaClient, pause, getDateTimeSeparately, isObject, inspector, appRoot } = require('../../src/plugins');
const chalk = require('chalk');
const moment = require('moment');
const loRound = require('lodash/round');
const {
  // Variant,
  DataType,
  // VariantArrayType,
  AttributeIds,
  StatusCodes,
  makeBrowsePath
} = require('node-opcua');
const debug = require('debug')('app:test.opcua');
const isDebug = false;
const isLog = false;

// Options
const srvParams = {
  port: 26540, // default - 26543, 26540 (opcua.test), 26550 (opcua.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test),
  serverInfo: { applicationName: 'UA-CHERKASSY-AZOT-M5.TEST1' },
};

const clientParams = {
  applicationName: 'UA-CHERKASSY-AZOT-M5.TEST1',
};

let server = null, client = null;
let opcuaServer = null, opcuaClient = null;

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

describe('<<=== OPC-UA: Test (opcua.test) ===>>', () => {

  before(async () => {
    // Create OPC-UA server
    server = new OpcuaServer(app, srvParams);
    // Create OPC-UA client
    client = new OpcuaClient(app, clientParams);
    debug('OPCUA - Test::before: Done');
  });

  after(async () => {
    if (opcuaClient !== null) opcuaClient = null;
    if (client !== null) client = null;

    if (opcuaServer !== null) opcuaServer = null;
    if (server !== null) server = null;
    debug('OPCUA - Test::after: Done');
  });

  it('Server object created', async () => {
    assert.ok(server, 'OPCUA server not created');
  });
  it('Client object created', async () => {
    assert.ok(client, 'OPCUA client not created');
  });
  describe('<<=== OPC-UA: RUN (opcua.test) ===>>', function () {

    //===== SERVER CREATE/SERVER CONSTRUCT ADDRESS SPACE/CLIENT CREATE/CLIENT CONNECT/SESSION CREATE =======//

    it('OPC-UA server start', async () => {
      await server.opcuaServerCreate();
      server.constructAddressSpace();
      const endpoints = await server.opcuaServerStart();
      opcuaServer = server.opcuaServer;
      console.log(chalk.green('server.securityMode'), chalk.cyan(endpoints[0].securityMode));
      console.log(chalk.green('server.securityPolicyUri'), chalk.cyan(endpoints[0].securityPolicyUri));
      assert.ok(true, 'OPC-UA server start');
    });

    it('OPC-UA client create', async () => {
      client.opcuaClientCreate();
      opcuaClient = client.opcuaClient;
      assert.ok(true, 'OPC-UA client create');
    });

    it('OPC-UA client connect', async () => {
      await client.opcuaClientConnect(server.getCurrentState());
      assert.ok(true, 'OPC-UA client connect');
    });

    it('OPC-UA client session create', async () => {
      await client.sessionCreate();
      assert.ok(true, 'OPC-UA client session create');
    });

    //============== SESSION READ NAMESPACE ARRAY ====================//

    it('OPC-UA client session read namespace array', async () => {
      const result = await client.sessionReadNamespaceArray();
      console.log(chalk.green('sessionReadNamespaceArray:'), chalk.cyan(`[ ${result} ]`));
      assert.ok(true, 'OPC-UA client session create');
    });

    //============== SESSION BROWSE ====================//

    it('OPC-UA client session browse', async () => {
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

    it('OPC-UA client session browse2', async () => {
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

    it('OPC-UA client session translate browse path', async () => {
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

    it('OPC-UA client session read', async () => {
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

    it('OPC-UA client session read variable value', async () => {
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

    it('OPC-UA client session read all attributes', async () => {
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

    it('OPC-UA client session history value', async () => {
      let readResult = null;

      if (client.getItemNodeId('Device2.PressureVesselDevice')) {
        // Get start time
        const start = moment.utc().format();

        // Save value to history
        readResult = await client.sessionReadVariableValue('Device2.PressureVesselDevice');
        readResult = await client.sessionReadVariableValue('Device2.PressureVesselDevice');
        readResult = await client.sessionReadVariableValue('Device2.PressureVesselDevice');

        await pause(1000);
        // Get end time
        const end = moment.utc().format();

        readResult = await client.sessionReadHistoryValues('Device2.PressureVesselDevice', start, end);
        if (readResult.length && readResult[0].statusCode.name === 'Good') {
          if (readResult[0].historyData.dataValues.length) {
            let dataValues = readResult[0].historyData.dataValues;
            dataValues.forEach(dataValue => {
              if (dataValue.statusCode.name === 'Good') {
                console.log(chalk.green('PressureVesselDevice:'), chalk.cyan(`${loRound(dataValue.value.value, 3)}; Timestamp=${dataValue.sourceTimestamp}`));
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

    it('OPC-UA client session write single node value', async () => {
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

    it('OPC-UA client session write node value', async () => {
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

    it('OPC-UA client session call method', async () => {
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

    it('OPC-UA client session get method argument definition', async () => {
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

    it('OPC-UA client subscription create', async () => {
      await client.subscriptionCreate();
      assert.ok(true, 'OPC-UA client subscription create');
    });

    it('OPC-UA client subscription monitor', async () => {
      const nameNodeIds = ['Device1.Temperature'];
      client.getNodeIds(nameNodeIds).forEach(async nodeId => {
        // await client.subscriptionMonitor(cbSubscriptionMonitor, { nodeId });
        await client.subscriptionMonitor(null, { nodeId });
      });
      // await pause(1000);
      assert.ok(true, 'OPC-UA client subscription monitor');
    });

    it('OPC-UA client subscription get monitored items', async () => {
      const monitoredItems = await client.sessionGetMonitoredItems(client.subscription.subscriptionId);
      console.log(chalk.green('getMonitoredItems.clientHandles:'), chalk.cyan(monitoredItems.clientHandles));
      console.log(chalk.green('getMonitoredItems.serverHandles:'), chalk.cyan(monitoredItems.serverHandles));
      assert.ok(true, 'OPC-UA client subscription monitor');
    });

    it('OPC-UA client subscription terminate', async () => {
      await pause(1000);
      await client.subscriptionTerminate();
      assert.ok(true, 'OPC-UA client subscription terminate');
    });

    //===== SESSION CLOSE/CLIENT DISCONNECT/SERVER SHUTDOWN =====//

    it('OPC-UA client session close', async () => {
      await client.sessionClose();
      assert.ok(true, 'OPC-UA client session close');
    });

    it('OPC-UA client disconnect', async () => {
      await client.opcuaClientDisconnect();
      assert.ok(true, 'OPC-UA client disconnect');
    });

    it('OPC-UA server shutdown', async () => {
      await server.opcuaServerShutdown();
      assert.ok(true, 'OPC-UA server shutdown');
    });
  });
});
