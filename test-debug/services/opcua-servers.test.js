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
let srvData = {
  action: 'create',
  params: {
    port: 26547, // default - 26543, 26544 (opcua.test), 26545 (opcua.test2), 26546 (opcua-clients.test), 26547 (opcua-servers.test),
    serverInfo: { applicationName: 'UA-CHERKASSY-AZOT-M5.TEST1' },
  }
};

const userInfo = {
  email: 'opcua-servers@example.com',
  password: 'supersecret'
};

let opcuaUser = null, opcuaAccessToken = '';

describe('<<=== OPC-UA: \'opcua-servers\' service ===>>', () => {
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

  it('New user: created the service', async () => {
    try {
      const service = app.service('users');
      assert.ok(service, 'Users: registered the service');
      // service create
      const newUser = await service.create(userInfo);
      if (isLog) inspector('Created User service:', newUser);
      assert.ok(newUser, 'newUser: created the service');
    } catch (error) {
      assert.ok(false, 'New user: created the service');
    }
  });

  it('authenticates user and creates accessToken', async () => {
    const { user, accessToken } = await app.service('authentication').create({
      strategy: 'local',
      ...userInfo
    });
    opcuaUser = user;
    opcuaAccessToken = accessToken;
    if (isLog) inspector('Authenticates user:', opcuaUser);
    inspector('Authenticates user:', opcuaUser);
    if (isLog) inspector('Creates accessToken:', opcuaAccessToken);
    inspector('Creates accessToken:', opcuaAccessToken);
    assert.ok(accessToken, 'Created access token for user');
    assert.ok(user, 'Includes user in authentication data');
  });

  it('OPC-UA servers: registered the service', () => {
    const service = app.service('opcua-servers');
    assert.ok(service, 'OPC-UA servers: registered the service');
  });

  it('OPC-UA servers: created the service', async () => {
    const service = app.service('opcua-servers');
    // service create
    const params = { user: opcuaUser, provider: 'rest', authenticated: true };
    const opcuaServer = await service.create(srvData, params);
    if (isLog) inspector('created the service:', opcuaServer);
    // inspector('created the service:', opcuaServer);

    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('OPC-UA servers: Error in creating an existing service', async () => {
    const service = app.service('opcua-servers');
    try {
      // service create
      const opcuaServer = await service.create(srvData);
      assert.ok(false, 'OPC-UA servers: Error in creating an existing service');
    } catch (error) {
      assert.ok(true, 'OPC-UA servers: Error in creating an existing service');
    }
  });

  it('OPC-UA servers: get the service', async () => {
    const service = app.service('opcua-servers');
    const id = srvData.params.serverInfo.applicationName;
    // const params = { provider: 'rest' };
    const opcuaServer = await service.get(id);
    if (isLog) inspector('get the service.currentState:', opcuaServer.server.getCurrentState());

    assert.ok(opcuaServer, 'OPC-UA servers: get the service');
  });

  it('OPC-UA servers: find services', async () => {
    const service = app.service('opcua-servers');
    const opcuaServers = await service.find();
    if (isLog) inspector('find services.ids:', opcuaServers.map(srv => srv.id));
    // inspector('find services.ids:', opcuaServers.map(srv => srv.id));

    assert.ok(opcuaServers.length, 'OPC-UA servers: find services');
  });

  it('OPC-UA servers: remove the service', async () => {
    try {
      // service remove
      const service = app.service('opcua-servers');
      const id = srvData.params.serverInfo.applicationName;
      const opcuaServer = await service.remove(id);
      if (isLog) inspector('Remove the service:', opcuaServer);
      // inspector('Remove the service:', opcuaServer);
      assert.ok(opcuaServer, 'OPC-UA servers: remove the service');
      await service.get(id);
      assert.ok(false, 'OPC-UA servers: remove the service');
    } catch (error) {
      assert.ok(true, 'OPC-UA servers: remove the service');
    }
  });

  it('OPC-UA servers: created the service', async () => {
    let opcuaServer;
    // service create
    const service = app.service('opcua-servers');
    const port = srvData.params.port + 1;
    const data = loMerge(srvData, { params: { port } });
    // inspector('created the service.data:', data);
    opcuaServer = await service.create(data);
    if (isLog) inspector('created the service:', opcuaServer);
    // inspector('created the service:', opcuaServer);

    // Get opcuaServer
    const id = srvData.params.serverInfo.applicationName;
    opcuaServer = await service.get(id);
    if (isLog) inspector('created the service.getCurrentState:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('OPC-UA servers: update the service', async () => {
    const service = app.service('opcua-servers');
    const id = srvData.params.serverInfo.applicationName;
    // get opcuaServer port
    let opcuaServer = await service.get(id);
    let port = opcuaServer.server.getCurrentState().port + 1;
    const data = loMerge(srvData, { params: { port } });
    opcuaServer = await service.update(id, data);
    if (isLog) inspector('Update the service.port:', opcuaServer.server.getCurrentState());
    // inspector('Update the service.port:', opcuaServer.server.getCurrentState());

    assert.ok(opcuaServer, 'OPC-UA servers: update the service');
  });

  it('OPC-UA servers: patch the service', async () => {
    const service = app.service('opcua-servers');
    const id = srvData.params.serverInfo.applicationName;
    // get opcuaServer port
    let opcuaServer = await service.get(id);
    let port = opcuaServer.server.getCurrentState().port + 1;
    const data = loMerge(srvData, { params: { port } });
    opcuaServer = await service.patch(id, data);
    if (isLog) inspector('Patch the service.port:', opcuaServer.server.getCurrentState());
    // inspector('Patch the service.port:', opcuaServer.server.getCurrentState());

    assert.ok(opcuaServer, 'OPC-UA servers: patch the service');
  });

});
