/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const { inspector } = require('../../src/plugins');
const { getServerService } = require('../../src/plugins/opcua');

const loMerge = require('lodash/merge');
const chalk = require('chalk');

const debug = require('debug')('app:test.opcua-servers');
const isDebug = false;
const isLog = false;

// Options
let srvData = {
  // action: 'create',
  params: {
    port: 26570, // default - 26543, 26540 (opcua.test), 26550 (opcua.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test),
    serverInfo: { applicationName: 'UA-CHERKASSY-AZOT-M5.TEST1' },
  }
};

const id = srvData.params.serverInfo.applicationName;

const userInfo = {
  email: 'opcua-servers@example.com',
  password: 'supersecret'
};

let opcuaUser = null, opcuaAccessToken = '';

describe('<<=== OPC-UA: Test (opcua-servers.test) ===>>', () => {
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
    const service = app.service('users');
    assert.ok(service, 'Users: registered the service');
    // service create
    const newUser = await service.create(userInfo);
    if (isLog) inspector('Created User service:', newUser);
    assert.ok(newUser, 'newUser: created the service');
  });

  it('authenticates user and creates accessToken', async () => {
    const { user, accessToken } = await app.service('authentication').create({
      strategy: 'local',
      ...userInfo
    });
    opcuaUser = user;
    opcuaAccessToken = accessToken;
    if (isLog) inspector('Authenticates user:', opcuaUser);
    if (isLog) inspector('Creates accessToken:', opcuaAccessToken);
    assert.ok(accessToken, 'Created access token for user');
    assert.ok(user, 'Includes user in authentication data');
  });

  it('OPC-UA servers: registered the service', async () => {
    const service = await getServerService(app, id);
    assert.ok(service, 'OPC-UA servers: registered the service');
  });

  it('OPC-UA servers: created the service', async () => {
    const service = await getServerService(app, id);
    // service create
    const params = { user: opcuaUser, provider: 'rest', authenticated: true };
    const opcuaServer = await service.create(srvData, params);
    if (isLog) inspector('created the service:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('OPC-UA servers: Error in creating an existing service', async () => {
    const service = await getServerService(app, id);
    try {
      // service create
      const opcuaServer = await service.create(srvData);
      assert.ok(false, 'OPC-UA servers: Error in creating an existing service');
    } catch (error) {
      assert.ok(true, 'OPC-UA servers: Error in creating an existing service');
    }
  });

  it('OPC-UA servers: get the service', async () => {
    const service = await getServerService(app, id);
    const opcuaServer = await service.get(id);
    if (isLog) inspector('get the service.currentState:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: get the service');
  });

  it('OPC-UA servers: find services', async () => {
    const service = await getServerService(app, id);
    const opcuaServers = await service.find();
    if (isLog) inspector('find services.ids:', opcuaServers.map(srv => srv.id));
    assert.ok(opcuaServers.length, 'OPC-UA servers: find services');
  });

  it('OPC-UA servers: remove the service', async () => {
    try {
      // service remove
      const service = await getServerService(app, id);
      const opcuaServer = await service.remove(id);
      if (isLog) inspector('Remove the service:', opcuaServer);
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
    const service = await getServerService(app, id);
    const port = srvData.params.port + 1;
    const data = loMerge(srvData, { params: { port } });
    opcuaServer = await service.create(data);
    if (isLog) inspector('created the service:', opcuaServer);
    // Get opcuaServer
    opcuaServer = await service.get(id);
    if (isLog) inspector('created the service.getCurrentState:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('OPC-UA servers: update the service', async () => {
    const service = await getServerService(app, id);
    // get opcuaServer port
    let opcuaServer = await service.get(id);
    let port = opcuaServer.server.getCurrentState().port + 1;
    const data = loMerge(srvData, { params: { port } });
    opcuaServer = await service.update(id, data);
    if (isLog) inspector('Update the service.port:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: update the service');
  });

  it('OPC-UA servers: patch the service', async () => {
    const service = await getServerService(app, id);
    // get opcuaServer port
    let opcuaServer = await service.get(id);
    let port = opcuaServer.server.getCurrentState().port + 1;
    const data = loMerge(srvData, { params: { port } });
    opcuaServer = await service.patch(id, data);
    if (isLog) inspector('Patch the service.port:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: patch the service');
  });

  it('OPC-UA servers: shutdown the service', async () => {
    const service = await getServerService(app, id);
    let opcuaServer = await service.get(id);
    opcuaServer = await service.opcuaServerShutdown(id, 1500);
    if (isLog) inspector('Shutdown the server:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: shutdown the service');
  });

  it('OPC-UA servers: create/constructAddressSpace/start the service', async () => {
    const service = await getServerService(app, id);
    let port = await service.getCurrentState(id).port + 1;
    let opcuaServer = await service.get(id);
    opcuaServer.server.params.port = port;
    opcuaServer = await service.opcuaServerCreate(id);
    opcuaServer = await service.constructAddressSpace(id);
    opcuaServer = await service.opcuaServerStart(id);
    if (isLog) inspector('Create the server:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: create/constructAddressSpace/start the service');
  });

  it('OPC-UA servers: properties of service', async () => {
    const service = await getServerService(app, id);

    let result = await service.getBytesWritten(id);
    console.log(chalk.greenBright('server.getBytesWritten:'), chalk.cyan(result));
    result = await service.getBytesRead(id);
    console.log(chalk.greenBright('server.getBytesRead:'), chalk.cyan(result));
    result = await service.getTransactionsCount(id);
    console.log(chalk.greenBright('server.getTransactionsCount:'), chalk.cyan(result));
    result = await service.getCurrentChannelCount(id);
    console.log(chalk.greenBright('server.getCurrentChannelCount:'), chalk.cyan(result));
    result = await service.getCurrentSubscriptionCount(id);
    console.log(chalk.greenBright('server.getCurrentSubscriptionCount:'), chalk.cyan(result));
    result = await service.getRejectedSessionCount(id);
    console.log(chalk.greenBright('server.getRejectedSessionCount:'), chalk.cyan(result));
    result = await service.getRejectedRequestsCount(id);
    console.log(chalk.greenBright('server.getRejectedRequestsCount:'), chalk.cyan(result));
    result = await service.getSessionAbortCount(id);
    console.log(chalk.greenBright('server.getSessionAbortCount:'), chalk.cyan(result));
    result = await service.getPublishingIntervalCount(id);
    console.log(chalk.greenBright('server.getPublishingIntervalCount:'), chalk.cyan(result));
    result = await service.getCurrentSessionCount(id);
    console.log(chalk.greenBright('server.getCurrentSessionCount:'), chalk.cyan(result));
    result = await service.isInitialized(id);
    console.log(chalk.greenBright('server.isInitialized:'), chalk.cyan(result));
    result = await service.isAuditing(id);
    console.log(chalk.greenBright('server.isAuditing:'), chalk.cyan(result));
    result = await service.getServerInfo(id);
    inspector('server.getServerInfo:', result);
    result = await service.getBuildInfo(id);
    inspector('server.getBuildInfo:', result);
    result = await service.getCurrentState(id);
    if (isLog) inspector('server.getCurrentState:', result);

    assert.ok(true, 'OPC-UA servers: properties of server');
  });

  //===== SESSION CLOSE/CLIENT DISCONNECT/SERVER SHUTDOWN =====//

  it('OPC-UA servers: shutdown the service', async () => {
    const service = await getServerService(app, id);
    let opcuaServer = await service.get(id);
    opcuaServer = await service.opcuaServerShutdown(id, 1500);
    if (isLog) inspector('Shutdown the server:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: shutdown the service');
  });

});
