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
