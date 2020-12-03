/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const { inspector, pause } = require('../../src/plugins');

const loMerge = require('lodash/merge');

const debug = require('debug')('app:test.opcua-servers');
const isDebug = false;
const isLog = false;

// Options
const srvData = {
  action: 'create',
  params: {
    port: 26546, // default - 26543, 26544 (opcua.test), 26545 (opcua.test2)
    serverInfo: { applicationName: 'UA-CHERKASSY-AZOT-M52' },
    buildInfo: { productName: '380-472-00203826-M52' }
  },
  paths: {
    options: '/src/plugins/test-helpers/AddressSpaceTestOptions.json',
    getters: '/src/plugins/test-helpers/opcua-addressspace-getters',
    methods: '/src/plugins/test-helpers/opcua-addressspace-methods',
  }
};

const clnData = {
  action: 'create',
  endpointUrl: 'opc.tcp://localhost:26544',
  params: {
    applicationName: 'UA-CHERKASSY-AZOT-M52',
    clientName: '380-472-00203826-M52',
  }
};

describe('<<=== OPC-UA: \'opcua-clients\' service ===>>', () => {
  let server;

  before(function (done) {
    if (isDebug) debug('before Start!');
    // debug('before Start!');
    server = app.listen(port);
    server.once('listening', () => {
      setTimeout(() => done(), 500);
    });
  });

  after(function (done) {
    if (isDebug) debug('after Start!');
    // debug('after Start!');
    server.close();
    setTimeout(() => done(), 500);
  });

  it('OPC-UA clients: registered the service', () => {
    const service = app.service('opcua-clients');
    assert.ok(service, 'OPC-UA clients: registered the service');
  });

  it('OPC-UA servers: registered the service', () => {
    const service = app.service('opcua-servers');
    assert.ok(service, 'OPC-UA servers: registered the service');
  });

  it('OPC-UA servers: created the service', async () => {
    const service = app.service('opcua-servers');
    // service create
    const opcuaServer = await service.create(srvData);
    if (isLog) inspector('created the service.opcuaServer:', opcuaServer.server.getCurrentState());
    // inspector('created the service.opcuaServer:', opcuaServer.server.getCurrentState());

    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('OPC-UA clients: created the service', async () => {
    const service = app.service('opcua-clients');
    // service create
    const opcuaClient = await service.create(clnData);
    if (isLog) inspector('created the service.opcuaClient:', opcuaClient.client.getCurrentState());
    // inspector('created the service.opcuaServer:', opcuaServer.server.getCurrentState());

    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });
});
