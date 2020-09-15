const assert = require('assert');
const app = require('../../src/app');
const { OpcuaServer, OpcuaClient } = require('../../src/plugins/opcua');
const debug = require('debug')('app:test.opcua');

const isDebug = true;

let opcuaServer = null, opcuaClient = null;

describe('<<===== OPCUA - Test =====>>', () => {

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
  describe('<<===== OPC-UA RUN =====>>', function () {
    it('Start OPC-UA server', async () => {
      try {
        await opcuaServer.create();
        await opcuaServer.start();
        assert.ok(true, 'Start opc-ua server');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Shutdown OPC-UA server', async () => {
      try {
        opcuaServer.shutdown()
        assert.ok(true, 'Shutdown OPCUA server');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Start OPC-UA server', async () => {
      try {
        await opcuaServer.create();
        await opcuaServer.start();
        assert.ok(true, 'Start opc-ua server');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Create OPC-UA client', async () => {
      try {
        opcuaClient.clientCreate();
        // await opcuaClient.clientConnect();
        assert.ok(true, 'Create OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Connect OPC-UA client', async () => {
      try {
        // opcuaClient.clientCreate();
        await opcuaClient.clientConnect();
        assert.ok(true, 'Connect OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Disconnect OPC-UA client', async () => {
      try {
        await opcuaClient.clientDisconnect();
        assert.ok(true, 'Disconnect OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Connect OPC-UA client', async () => {
      try {
        // opcuaClient.clientCreate();
        await opcuaClient.clientConnect();
        assert.ok(true, 'Connect OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Create session OPC-UA client', async () => {
      try {
        await opcuaClient.sessionCreate();
        assert.ok(true, 'Create session OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Close session OPC-UA client', async () => {
      try {
        await opcuaClient.sessionClose()
        assert.ok(true, 'Close session OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Create session OPC-UA client', async () => {
      try {
        await opcuaClient.sessionCreate();
        assert.ok(true, 'Create session OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Session browse OPC-UA client', async () => {
      try {
        let browseResult = await opcuaClient.sessionBrowse('RootFolder');
        browseResult = browseResult.references.map((r) => r.browseName.toString()).join(',');
        // Objects,Types,Views
        assert.ok(browseResult === 'Objects,Types,Views', 'Session browse OPC-UA client');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Session read OPC-UA client', async () => {
      try {
        let readResult = null;
        readResult = await opcuaClient.sessionRead('temperature');
        assert.ok(readResult, 'Session read OPC-UA client');
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

    
  });
});
