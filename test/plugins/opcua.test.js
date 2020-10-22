/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { OpcuaServer, OpcuaClient, pause, getDateTimeSeparately, isObject, inspector } = require('../../src/plugins');
const chalk = require('chalk');
const moment = require('moment');
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

let server = null, client = null;
let opcuaServer = null, opcuaClient = null;

/**
 * Call back function for subscription monitor
 * @param {String} nameNodeId 
 * @param {*} value 
 */
const cbSubscriptionMonitor = async (nameNodeId, dataValue) => {
  const itemNodeId = client.params.nodeIds.find(item => item.name === nameNodeId);
  const nodeId = itemNodeId ? itemNodeId.nodeId : nameNodeId;
  if (isDebug) debug('cbSubscriptionMonitor.nodeId:', nodeId);
  console.log(chalk.green(`${nameNodeId}:`), chalk.cyan(dataValue.value.value.toString()));

  // console.log(` Temperature = ${value}`)
};

describe('<<=== OPC-UA: Test ===>>', () => {

  before(async () => {
    try {
      // Create OPC-UA server
      server = new OpcuaServer(app);
      // Create OPC-UA client
      client = new OpcuaClient(app);
      debug('OPCUA - Test::before: Done');
    } catch (error) {
      console.error('OPCUA - Test::before.error:', error.message);
    }
  });

  after(async () => {
    try {
      if(opcuaClient !== null) opcuaClient = null;
      if(client !== null) client = null;

      if(opcuaServer !== null) opcuaServer = null;
      if(server !== null) server = null;

      debug('OPCUA - Test::after: Done');
    } catch (error) {
      // Do nothing, it just means the user already exists and can be tested
    }
  });

  it('Server object created', async () => {
    assert.ok(server, 'OPCUA server not created');
  });
  it('Client object created', async () => {
    assert.ok(client, 'OPCUA client not created');
  });
  describe('<<=== OPC-UA: RUN ===>>', function () {
    it('OPC-UA server start', async () => {
      try {
        await server.create();
        const endpoints = await server.start();
        opcuaServer = server.opcuaServer;
        console.log(chalk.green('server.securityMode'), chalk.cyan(endpoints[0].securityMode));
        console.log(chalk.green('server.securityPolicyUri'), chalk.cyan(endpoints[0].securityPolicyUri));
        assert.ok(true, 'OPC-UA server start');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client create', async () => {
      try {
        client.create();
        opcuaClient = client.opcuaClient;
        // const servers = await opcuaServer.findServers;
        // debug('servers', servers);
        assert.ok(true, 'OPC-UA client create');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client connect', async () => {
      try {
        await client.connect();
        assert.ok(true, 'OPC-UA client connect');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session create', async () => {
      try {
        await client.sessionCreate();
        assert.ok(true, 'OPC-UA client session create');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session read namespace array', async () => {
      try {
        const result = await client.sessionReadNamespaceArray();
        console.log(chalk.green('sessionReadNamespaceArray:'), chalk.cyan(`[ ${result} ]`));
        assert.ok(true, 'OPC-UA client session create');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session browse', async () => {
      try {
        let browseResult = null;
        const folder = 'RootFolder';
        browseResult = await client.sessionBrowse(folder);// RootFolder|ObjectsFolder|browseObjectsFolder
        browseResult = browseResult[0].references.map((r) => r.browseName.name).join(',');
        console.log(chalk.green(`sessionBrowse.${folder}:`), chalk.cyan(browseResult));
        assert.ok(browseResult, 'OPC-UA client session browse');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session translate browse path', async () => {
      try {
        let browseResult = null;
        const browsePath = makeBrowsePath(
          'RootFolder',
          '/Objects/Server.ServerStatus.BuildInfo.ProductName'
        );
        if (isLog) inspector('sessionTranslateBrowsePath.browsePath:', browsePath);
        browseResult = await client.sessionTranslateBrowsePath(browsePath);
        if (isLog) inspector('sessionTranslateBrowsePath.browseResult:', browseResult);
        console.log(chalk.green('sessionTranslateBrowsePath.nodeId:'), chalk.cyan(browseResult[0].targets[0].targetId.toString()));

        assert.ok(browseResult, 'OPC-UA client session translate browse path');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session read', async () => {
      try {
        let readResult = null;
        readResult = await client.sessionRead('VesselDevice.PressureVesselDevice', AttributeIds.BrowseName);// AttributeIds: BrowseName, Value
        const value = readResult[0].value.value;
        console.log(chalk.green('pressureVesselDevice:'), chalk.cyan(isObject(value) ? value.name : value));
        assert.ok(readResult, 'OPC-UA client session read');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session read variable value', async () => {
      try {
        let readResult = null;
        // Read pressureVesselDevice
        readResult = await client.sessionReadVariableValue(['VesselDevice.PressureVesselDevice']);
        console.log(chalk.green('pressureVesselDevice:'), chalk.cyan(readResult[0].value.value));
        assert.ok(readResult, 'OPC-UA client session read');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session read all attributes', () => {
      try {
        // Read all attributes for temperature
        client.sessionReadAllAttributes('MyDevice.Temperature', function (err, data) {
          if (err) {
            inspector('sessionReadAllAttributes.err:', err);
            assert.fail(`Should never get here: ${err}`);
          }
          if (isLog && data) inspector('sessionReadAllAttributes.data:', data);
          if (data && data.length) {
            data = data[0];
            if (data.statusCode === StatusCodes.Good) {
              console.log(chalk.green('nodeId:'), chalk.cyan(data.nodeId.toString()));
              console.log(chalk.green('browseName:'), chalk.cyan(data.browseName.name));
              console.log(chalk.green('displayName:'), chalk.cyan(data.displayName.text));
              console.log(chalk.green('value:'), chalk.cyan(data.value.toString()));
              assert.ok(true, 'OPC-UA client session read all attributes');
            }
          }
        });
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session history value', async () => {
      try {
        let readResult = null;

        // Read pressureVesselDevice
        const start = moment.utc().format();
        const dt = getDateTimeSeparately();
        dt.minutes = dt.minutes + 1;
        const end = moment.utc(Object.values(dt)).format();

        readResult = await client.sessionReadHistoryValues('VesselDevice.PressureVesselDevice', start, end);
        if (readResult.length && readResult.values.length) {
          console.log(chalk.green('pressureVesselDeviceHist:'), chalk.cyan(readResult[0].values[0].value));
        }
        assert.ok(readResult, 'OPC-UA client session history value');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session write single node value', async () => {
      try {
        let statusCode = null, readResult = null;
        let variantValue = {
          dataType: DataType.String,
          value: 'Stored value',
        };
        statusCode = await client.sessionWriteSingleNode('MyDevice.VariableForWrite', variantValue);
        console.log(chalk.green('MyDevice::variableForWrite.statusCode:'), chalk.cyan(statusCode.name));
        readResult = await client.sessionRead('MyDevice.VariableForWrite');
        console.log(chalk.green('MyDevice::variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

        assert.ok(readResult[0].value.value === variantValue.value, 'OPC-UA client session write single node value');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session write node value', async () => {
      try {
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

        statusCodes = await client.sessionWrite('MyDevice.VariableForWrite', valuesToWrite);
        console.log(chalk.green('MyDevice::variableForWrite.statusCode:'), chalk.cyan(statusCodes[0].name));
        readResult = await client.sessionRead('MyDevice.VariableForWrite');
        console.log(chalk.green('MyDevice::variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

        assert.ok(readResult[0].value.value === valuesToWrite[0].value.value.value, 'OPC-UA client session write node value');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session call method', async () => {
      try {
        let callResults = [];
        let inputArguments = [
          {
            dataType: DataType.UInt32,
            value: 2,
          },
          {
            dataType: DataType.UInt32,
            value: 3,
          }
        ];
        callResults = await client.sessionCallMethod('MyDevice.SumMethod', inputArguments);
        console.log(chalk.green('MyDevice::SumMethod.statusCode:'), chalk.cyan(callResults[0].statusCode.name));
        console.log(chalk.green('MyDevice::SumMethod.callResult:'), chalk.cyan(callResults[0].outputArguments[0].value));

        assert.ok(callResults, 'OPC-UA client session call method');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session get method argument definition', async () => {
      let argumentsDefinition = [];
      try {
        argumentsDefinition = await client.sessionGetArgumentDefinition('MyDevice.SumMethod');
        argumentsDefinition.inputArguments.forEach(argument => {
          console.log(chalk.green('MyDevice::SumMethod.inputArgument.name:'), chalk.cyan(argument.name));
          console.log(chalk.green('MyDevice::SumMethod.inputArgument.description:'), chalk.cyan(argument.description.text));
        });
        argumentsDefinition.outputArguments.forEach(argument => {
          console.log(chalk.green('MyDevice::SumMethod.outputArgument.name:'), chalk.cyan(argument.name));
          console.log(chalk.green('MyDevice::SumMethod.outputArgument.description:'), chalk.cyan(argument.description.text));
        });

        assert.ok(argumentsDefinition, 'OPC-UA client session get method argument definition');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription create', () => {
      try {
        // await client.subscriptionCreate();
        client.subscriptionCreate();
        assert.ok(true, 'OPC-UA client subscription create');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription monitor', async () => {
      try {
        await client.subscriptionMonitor('VesselDevice.PressureVesselDevice', cbSubscriptionMonitor);
        await client.subscriptionMonitor('MyDevice.PercentageMemoryUsed', cbSubscriptionMonitor);
        await client.subscriptionMonitor('MyDevice.Temperature', cbSubscriptionMonitor);
        assert.ok(true, 'OPC-UA client subscription monitor');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription get monitored items', async () => {
      try {
        const monitoredItems = await client.sessionGetMonitoredItems(client.subscription.subscriptionId);
        console.log(chalk.green('getMonitoredItems.clientHandles:'), chalk.cyan(monitoredItems.clientHandles));
        console.log(chalk.green('getMonitoredItems.serverHandles:'), chalk.cyan(monitoredItems.serverHandles));
        assert.ok(true, 'OPC-UA client subscription monitor');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription terminate', async () => {
      try {
        await pause(1000);
        await client.subscriptionTerminate();
        assert.ok(true, 'OPC-UA client subscription terminate');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session close', async () => {
      try {
        await client.sessionClose();
        assert.ok(true, 'OPC-UA client session close');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client disconnect', async () => {
      try {
        await client.disconnect();
        assert.ok(true, 'OPC-UA client disconnect');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server shutdown', async () => {
      try {
        server.shutdown();
        assert.ok(true, 'OPC-UA server shutdown');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

  });
});
