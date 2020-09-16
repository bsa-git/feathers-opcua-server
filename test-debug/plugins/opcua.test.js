const assert = require('assert');

const app = require('../../src/app');
const { OpcuaServer, OpcuaClient, pause } = require('../../src/plugins');
// const util = require('../../src/plugins/lib/util');
const debug = require('debug')('app:test.opcua');

const isDebug = true;
let opcuaServer = null, opcuaClient = null;

/**
 * Call back function for subscription monitor
 * @param {String} nameNodeId 
 * @param {*} value 
 */
const cbSubscriptionMonitor = async (nameNodeId, value) => {
  const itemNodeId = opcuaClient.params.nodeIds.find(item => item.name === nameNodeId);
  if(isDebug) debug('cbSubscriptionMonitor.itemNodeId:', itemNodeId);
  console.log(` Temperature = ${value}`)
};

describe('<<=== OPC-UA: Test ===>>', () => {

  before(async () => {
    try {
      // Create OPC-UA server
      opcuaServer = new OpcuaServer(app);
      // Create OPC-UA client
      opcuaClient = new OpcuaClient(app);
      debug('OPCUA - Test::before: Done');
    } catch (error) {
      const { response } = error;
      console.error('OPCUA - Test::before.error', response)
    }
  });

  after(async () => {
    try {
      if (opcuaServer === null) return;
      opcuaServer = null
      if (opcuaClient === null) return;
      opcuaClient = null
      debug('OPCUA - Test::after: Done');
    } catch (error) {
      // Do nothing, it just means the user already exists and can be tested
    }
  });

  it('OPC-UA server created', async () => {
    assert.ok(opcuaServer, 'OPCUA server not created');
  });
  it('OPC-UA client created', async () => {
    assert.ok(opcuaClient, 'OPCUA client not created');
  });
  describe('<<=== OPC-UA: RUN ===>>', function () {
    it('OPC-UA server start', async () => {
      try {
        await opcuaServer.create();
        await opcuaServer.start();
        assert.ok(true, 'OPC-UA server start');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client create', async () => {
      try {
        opcuaClient.clientCreate();
        // await opcuaClient.clientConnect();
        assert.ok(true, 'OPC-UA client create');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client connect', async () => {
      try {
        // opcuaClient.clientCreate();
        await opcuaClient.clientConnect();
        assert.ok(true, 'OPC-UA client connect');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session create', async () => {
      try {
        await opcuaClient.sessionCreate();
        assert.ok(true, 'OPC-UA client session create');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session browse', async () => {
      try {
        let browseResult = await opcuaClient.sessionBrowse('RootFolder');
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
        readResult = await opcuaClient.sessionRead('temperature');
        assert.ok(readResult, 'OPC-UA client session read');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription create', async () => {
      try {
        await opcuaClient.subscriptionCreate();
        assert.ok(true, 'OPC-UA client subscription create');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription monitor', async () => {
      try {
        await opcuaClient.subscriptionMonitor('temperature', cbSubscriptionMonitor);
        assert.ok(true, 'OPC-UA client subscription monitor');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription terminate', async () => {
      try {
        await pause(1000);
        await opcuaClient.subscriptionTerminate();
        assert.ok(true, 'OPC-UA client subscription terminate');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client session close', async () => {
      try {
        await opcuaClient.sessionClose()
        assert.ok(true, 'OPC-UA client session close');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client disconnect', async () => {
      try {
        await opcuaClient.clientDisconnect();
        assert.ok(true, 'OPC-UA client disconnect');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server shutdown', async () => {
      try {
        opcuaServer.shutdown()
        assert.ok(true, 'OPC-UA server shutdown');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

  });
});
