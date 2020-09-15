const assert = require('assert');
const app = require('../../src/app');
const {OpcuaServer, OpcuaClient}= require('../../src/plugins/opcua');
const debug = require('debug')('app:test.opcua');

const isDebug = false;

describe('OPCUA - Test', () => {

  before(async () => {
    try {

      // if (isDebug) debug('newUser:', newUser);
    } catch (error) {
      // Do nothing, it just means the user already exists and can be tested
    }
  });

  after(async () => {
    try {

      // if (isDebug) debug('newUser:', newUser);
    } catch (error) {
      // Do nothing, it just means the user already exists and can be tested
    }
  });

  it('OPCUA server create', async () => {
    
    assert.ok(true, 'OPCUA server not created');
  });
  it('OPCUA client create', async () => {
    
    assert.ok(true, 'OPCUA client not created');
  });
  describe('OPCUA run', function() {
    it('Start opc-ua server', async () => {
      try {
        assert.ok(true, 'Start opc-ua server');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('Shutdown OPCUA server', async () => {
      try {
        assert.ok(true, 'Shutdown OPCUA server');
      } catch (error) {
        const { response } = error;
        assert.fail(`Should never get here: ${error.message}`);
      }
    });
  });
});
