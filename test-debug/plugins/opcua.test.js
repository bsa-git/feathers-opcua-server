const assert = require('assert');

const app = require('../../src/app');
const { OpcuaServer, OpcuaClient, pause } = require('../../src/plugins');
// const util = require('../../src/plugins/lib/util');
const debug = require('debug')('app:test.opcua');

const isDebug = true;
let server = null, client = null;
let opcuaServer = null, opcuaClient = null;

/**
 * Call back function for subscription monitor
 * @param {String} nameNodeId 
 * @param {*} value 
 */
const cbSubscriptionMonitor = async (nameNodeId, value) => {
  const itemNodeId = client.params.nodeIds.find(item => item.name === nameNodeId);
  if(isDebug) debug('cbSubscriptionMonitor.itemNodeId:', itemNodeId);
  console.log(` Temperature = ${value}`)
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
      const { response } = error;
      console.error('OPCUA - Test::before.error', response)
    }
  });

  after(async () => {
    try {
      
      if (client === null && opcuaClient === null) return;
      opcuaClient = null;
      client = null
      
      if (server === null && opcuaServer === null) return;
      opcuaServer = null;
      server = null

      debug('OPCUA - Test::after: Done');
    } catch (error) {
      // Do nothing, it just means the user already exists and can be tested
    }
  });

  it('OPC-UA server created', async () => {
    assert.ok(server, 'OPCUA server not created');
  });
  it('OPC-UA client created', async () => {
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
        const { response } = error;
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
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client connect', async () => {
      try {
        await client.connect();
        assert.ok(true, 'OPC-UA client connect');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session create', async () => {
      try {
        await client.sessionCreate();
        assert.ok(true, 'OPC-UA client session create');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session browse', async () => {
      try {
        let browseResult = await client.sessionBrowse('RootFolder');
        browseResult = browseResult.references.map((r) => r.browseName.toString()).join(',');
        // Objects,Types,Views
        assert.ok(browseResult === 'Objects,Types,Views', 'OPC-UA client session browse');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session read', async () => {
      try {
        let readResult = null;
        readResult = await client.sessionRead('temperature');
        assert.ok(readResult, 'OPC-UA client session read');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription create', async () => {
      try {
        await client.subscriptionCreate();
        assert.ok(true, 'OPC-UA client subscription create');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription monitor', async () => {
      try {
        await client.subscriptionMonitor('temperature', cbSubscriptionMonitor);
        assert.ok(true, 'OPC-UA client subscription monitor');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription terminate', async () => {
      try {
        await pause(1000);
        await client.subscriptionTerminate();
        assert.ok(true, 'OPC-UA client subscription terminate');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session close', async () => {
      try {
        await client.sessionClose()
        assert.ok(true, 'OPC-UA client session close');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client disconnect', async () => {
      try {
        await client.disconnect();
        assert.ok(true, 'OPC-UA client disconnect');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server shutdown', async () => {
      try {
        server.shutdown()
        assert.ok(true, 'OPC-UA server shutdown');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

  });
});
