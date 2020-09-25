const assert = require('assert');

const app = require('../../src/app');
const { OpcuaServer, OpcuaClient, pause, getDateTimeSeparately } = require('../../src/plugins');
const chalk = require('chalk');
const moment = require('moment');
const {
  // Variant,
  DataType,
  // VariantArrayType,
  AttributeIds
} = require('node-opcua');
const debug = require('debug')('app:test.opcua');

const isDebug = false;
let server = null, client = null;
let opcuaServer = null, opcuaClient = null;

/**
 * Call back function for subscription monitor
 * @param {String} nameNodeId 
 * @param {*} value 
 */
const cbSubscriptionMonitor = async (nameNodeId, value) => {
  const itemNodeId = client.params.nodeIds.find(item => item.name === nameNodeId);
  if (isDebug) debug('cbSubscriptionMonitor.itemNodeId:', itemNodeId);
  console.log(chalk.green(`${nameNodeId}:`), chalk.cyan(value));

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

      if (client === null && opcuaClient === null) return;
      opcuaClient = null;
      client = null;

      if (server === null && opcuaServer === null) return;
      opcuaServer = null;
      server = null;

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
        await server.start();
        opcuaServer = server.opcuaServer;
        // debug('serverInfo', server.opcuaServer.serverInfo);
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

    it('OPC-UA client session browse', async () => {
      try {
        let browseResult = null;
        browseResult = await client.sessionBrowse('ObjectsFolder');// RootFolder|ObjectsFolder|browseObjectsFolder
        browseResult = browseResult[0].references.map((r) => r.browseName.name).join(',');
        console.log(chalk.green('sessionBrowse.folder:'), chalk.cyan(browseResult));
        assert.ok(browseResult, 'OPC-UA client session browse');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session read', async () => {
      try {
        let readResult = null;
        readResult = await client.sessionRead('pressureVesselDevice', AttributeIds.value);
        console.log(chalk.green('pressureVesselDevice:'), chalk.cyan(readResult[0].value.value));
        assert.ok(readResult, 'OPC-UA client session read');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session read variable value', async () => {
      try {
        let readResult = null;
        // Read pressureVesselDevice
        readResult = await client.sessionReadVariableValue(['pressureVesselDevice']);
        console.log(chalk.green('pressureVesselDevice:'), chalk.cyan(readResult[0].value.value));
        assert.ok(readResult, 'OPC-UA client session read');
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

        readResult = await client.sessionReadHistoryValues('pressureVesselDevice', start, end);
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
        statusCode = await client.sessionWriteSingleNode('variableForWrite', variantValue);
        console.log(chalk.green('variableForWrite.statusCode:'), chalk.cyan(statusCode.name));
        readResult = await client.sessionRead('variableForWrite');
        console.log(chalk.green('variableForWrite.readResult:'), chalk.cyan(`'${readResult[0].value.value}'`));

        assert.ok(readResult[0].value.value === variantValue.value, 'OPC-UA client session write single node value');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription create', async () => {
      try {
        await client.subscriptionCreate();
        assert.ok(true, 'OPC-UA client subscription create');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription monitor', async () => {
      try {
        await client.subscriptionMonitor('pressureVesselDevice', cbSubscriptionMonitor);
        await client.subscriptionMonitor('percentageMemoryUsed', cbSubscriptionMonitor);
        await client.subscriptionMonitor('temperature', cbSubscriptionMonitor);
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
