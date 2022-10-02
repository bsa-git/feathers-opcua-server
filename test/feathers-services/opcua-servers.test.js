/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const {
  appRoot, 
  inspector,
  startListenPort, 
  stopListenPort,
  makeDirSync,
  removeFilesFromDirSync,
  clearIntervalIds,
} = require('../../src/plugins');
const { getServerService } = require('../../src/plugins/opcua');

const loMerge = require('lodash/merge');
const chalk = require('chalk');
const { pause } = require('../../src/plugins/lib/util');

const debug = require('debug')('app:test.opcua-servers');
const isDebug = false;

// Options
let srvData = {
  params: {
    port: 26570, // default - 26543, 26540 (opcua-class.test), 26550 (opcua-class.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test),
    serverInfo: { applicationName: 'ua-cherkassy-azot_test1' },
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
    startListenPort(app, done);
    makeDirSync([appRoot, 'test/data/tmp/test1']);
  });

  after(function (done) {
    stopListenPort(done);
    clearIntervalIds();
    removeFilesFromDirSync([appRoot, 'test/data/tmp/test1']);
  });

  it('#1: OPC-UA servers: registered the service', async () => {
    const service = await getServerService(app, id);
    assert.ok(service, 'OPC-UA servers: registered the service');
  });

  it('#2: OPC-UA servers: created the service', async () => {
    const service = await getServerService(app, id);
    // service create
    const opcuaServer = await service.create(srvData);
    if (isDebug) inspector('created the service:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('#3: OPC-UA servers: Error in creating an existing service', async () => {
    const service = await getServerService(app, id);
    try {
      // service create
      const opcuaServer = await service.create(srvData);
      assert.ok(false, 'OPC-UA servers: Error in creating an existing service');
    } catch (error) {
      assert.ok(true, 'OPC-UA servers: Error in creating an existing service');
    }
  });

  it('#4: OPC-UA servers: get the service', async () => {
    const service = await getServerService(app, id);
    const opcuaServer = await service.get(id);
    if (isDebug) inspector('get the service.currentState:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: get the service');
  });

  it('#5: OPC-UA servers: find services', async () => {
    const service = await getServerService(app, id);
    const opcuaServers = await service.find();
    if (isDebug) inspector('find services.ids:', opcuaServers.map(srv => srv.id));
    assert.ok(opcuaServers.length, 'OPC-UA servers: find services');
  });


  it('#12: OPC-UA servers: properties of service', async () => {
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
    if (isDebug) inspector('server.getCurrentState:', result);

    assert.ok(true, 'OPC-UA servers: properties of server');
  });

  it('#13: OPC-UA servers: remove the service', async () => {
    const service = await getServerService(app, id);
    let opcuaServer = await service.remove(id);

    if (isDebug) inspector('Shutdown the server:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: shutdown the service');
  });

});
