/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { OpcuaServer, OpcuaClient, appRoot, inspector, getDateTimeSeparately } = require('../../src/plugins');
const addressSpaceGetters = require(`${appRoot}/src/plugins/test-helpers/opcua-addressspace-getters`);
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
const AddressSpaceParams = require(`${appRoot}/src/api/opcua/AddressSpaceTestOptions.json`);
const debug = require('debug')('app:test.opcua');
const isDebug = false;
const isLog = false;

let server = null, client = null;
let opcuaServer = null, opcuaClient = null;

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
        server.constructAddressSpace(AddressSpaceParams, addressSpaceGetters);
        const endpoints = await server.start();
        opcuaServer = server.opcuaServer;
        // server.securityMode
        console.log(chalk.green('server.securityMode'), chalk.cyan(endpoints[0].securityMode));
        // server.securityPolicyUri
        console.log(chalk.green('server.securityPolicyUri'), chalk.cyan(endpoints[0].securityPolicyUri));
        assert.ok(true, 'OPC-UA server start');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get serverInfo', async () => {
      try {
        // serverInfo
        inspector('OPC-UA server get serverInfo:', server.getServerInfo());
        assert.ok(true, 'OPC-UA server get serverInfo');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get buildInfo', async () => {
      try {
        // buildInfo
        inspector('OPC-UA server get buildInfo:', server.getBuildInfo());
        assert.ok(true, 'OPC-UA server get buildInfo');
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


    it('OPC-UA client session read variables value', async () => {
      try {
        let readResult = null;

        // Read 'Device1.Temperature' value
        readResult = await client.sessionReadVariableValue(['Device1.Temperature']);
        console.log(chalk.green('Device1.Temperature:'), chalk.cyan(readResult[0].value.value));

        // Read 'Device1.Variable2' value
        readResult = await client.sessionReadVariableValue(['Device1.Variable2']);
        console.log(chalk.green('Device1.Variable2:'), chalk.cyan(readResult[0].value.value));

        // Read 'Device1.Variable3' value
        readResult = await client.sessionReadVariableValue(['Device1.Variable3']);
        console.log(chalk.green('Device1.Variable3:'), chalk.cyan(readResult[0].value.value));

        // Read 'Device1.PercentageMemoryUsed' value
        readResult = await client.sessionReadVariableValue(['Device1.PercentageMemoryUsed']);
        console.log(chalk.green('Device1.PercentageMemoryUsed:'), chalk.cyan(`${readResult[0].value.value}%`));

        assert.ok(readResult, 'OPC-UA client session read');
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
                value: 'Stored value'
              }
            }
          }
        ];
        statusCodes = await client.sessionWrite('Device1.VariableForWrite', valuesToWrite);
        console.log(chalk.green('Device1::variableForWrite.statusCode:'), chalk.cyan(statusCodes[0].name));
        readResult = await client.sessionRead('Device1.VariableForWrite');
        console.log(chalk.green('Device1::variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

        assert.ok(readResult[0].value.value === valuesToWrite[0].value.value.value, 'OPC-UA client session write node value');
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

        readResult = await client.sessionReadHistoryValues('Device2.PressureVesselDevice', start, end);
        if (readResult.length && readResult.values.length) {
          console.log(chalk.green('PressureVesselDevice:'), chalk.cyan(readResult[0].values[0].value));
        }
        assert.ok(readResult, 'OPC-UA client session history value');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get bytesWritten', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('bytesWritten:'), chalk.cyan(server.getBytesWritten()));
        assert.ok(true, 'OPC-UA server get bytesWritten');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get bytesRead', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('bytesRead:'), chalk.cyan(server.getBytesRead()));
        assert.ok(true, 'OPC-UA server get bytesRead');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get transactionsCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('transactionsCount:'), chalk.cyan(server.getTransactionsCount()));
        assert.ok(true, 'OPC-UA server get transactionsCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get currentChannelCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('currentChannelCount:'), chalk.cyan(server.getCurrentChannelCount()));
        assert.ok(true, 'OPC-UA server get currentChannelCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get currentSubscriptionCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('currentSubscriptionCount:'), chalk.cyan(server.getCurrentSubscriptionCount()));
        assert.ok(true, 'OPC-UA server get currentSubscriptionCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get rejectedSessionCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('rejectedSessionCount:'), chalk.cyan(server.getRejectedSessionCount()));
        assert.ok(true, 'OPC-UA server get rejectedSessionCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get rejectedRequestsCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('rejectedRequestsCount:'), chalk.cyan(server.getRejectedRequestsCount()));
        assert.ok(true, 'OPC-UA server get rejectedRequestsCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get sessionAbortCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('sessionAbortCount:'), chalk.cyan(server.getSessionAbortCount()));
        assert.ok(true, 'OPC-UA server get sessionAbortCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get publishingIntervalCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('publishingIntervalCount:'), chalk.cyan(server.getPublishingIntervalCount()));
        assert.ok(true, 'OPC-UA server get publishingIntervalCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get currentSessionCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('currentSessionCount:'), chalk.cyan(server.getCurrentSessionCount()));
        assert.ok(true, 'OPC-UA server get currentSessionCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server is initialized', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('isInitialized:'), chalk.cyan(server.isInitialized()));
        assert.ok(true, 'OPC-UA server is initialized');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server is auditing', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('isAuditing:'), chalk.cyan(server.isAuditing()));
        assert.ok(true, 'OPC-UA server is auditing');
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
        await server.shutdown();
        assert.ok(true, 'OPC-UA server shutdown');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

  });
});
