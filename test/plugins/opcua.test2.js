/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { 
  OpcuaServer, 
  OpcuaClient, 
  appRoot, 
  inspector, 
  // getOpcuaConfig 
} = require('../../src/plugins');
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

const debug = require('debug')('app:test.opcua2');
const isDebug = false;
const isLog = false;

// Options
const srvParams = {
  port: 26550, // default - 26543, 26540 (opcua.test), 26550 (opcua.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test),
  serverInfo: { applicationName: 'ua-cherkassy-azot-test1' },
};

const clientParams = {
  applicationName: 'ua-cherkassy-azot-test1',
};

let server = null, client = null;
let opcuaServer = null, opcuaClient = null;

describe('<<=== OPC-UA: Test (opcua.test2) ===>>', () => {

  before(async () => {
    // Create OPC-UA server
    server = new OpcuaServer(app, srvParams);
    // Create OPC-UA client
    client = new OpcuaClient(app, clientParams);
    debug('OPCUA - Test2::before: Done');
  });

  after(async () => {
    if (opcuaClient !== null) opcuaClient = null;
    if (client !== null) client = null;

    if (opcuaServer !== null) opcuaServer = null;
    if (server !== null) server = null;
    debug('OPCUA - Test2::after: Done');
  });

  it('Server object created', async () => {
    assert.ok(server, 'OPCUA server not created');
  });
  it('Client object created', async () => {
    assert.ok(client, 'OPCUA client not created');
  });
  describe('<<=== OPC-UA: RUN ===>>', function () {
    it('OPC-UA server start', async () => {
      await server.opcuaServerCreate();
      server.constructAddressSpace();
      const endpoints = await server.opcuaServerStart();
      opcuaServer = server.opcuaServer;
      assert.ok(true, 'OPC-UA server start');
    });

    it('OPC-UA server get serverInfo', async () => {
      // serverInfo
      inspector('OPC-UA server get serverInfo:', server.getServerInfo());
      assert.ok(true, 'OPC-UA server get serverInfo');
    });

    it('OPC-UA server get buildInfo', async () => {
      // buildInfo
      inspector('OPC-UA server get buildInfo:', server.getBuildInfo());
      assert.ok(true, 'OPC-UA server get buildInfo');
    });

    it('OPC-UA client create', async () => {
      client.opcuaClientCreate();
      opcuaClient = client.opcuaClient;
      // const servers = await opcuaServer.findServers;
      // debug('servers', servers);
      assert.ok(true, 'OPC-UA client create');
    });

    it('OPC-UA client connect', async () => {
      await client.opcuaClientConnect(server.getCurrentState());
      assert.ok(true, 'OPC-UA client connect');
    });

    it('OPC-UA client session create', async () => {
      await client.sessionCreate();
      assert.ok(true, 'OPC-UA client session create');
    });

    //------------- SERVER GET -----------------//

    it('OPC-UA server get bytesWritten', async () => {
      // bytesWritten
      console.log(chalk.green('server.bytesWritten:'), chalk.cyan(server.getBytesWritten()));
      assert.ok(true, 'OPC-UA server get bytesWritten');
    });

    it('OPC-UA server get bytesRead', async () => {
      // bytesWritten
      console.log(chalk.green('server.bytesRead:'), chalk.cyan(server.getBytesRead()));
      assert.ok(true, 'OPC-UA server get bytesRead');
    });

    it('OPC-UA server get transactionsCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.transactionsCount:'), chalk.cyan(server.getTransactionsCount()));
      assert.ok(true, 'OPC-UA server get transactionsCount');
    });

    it('OPC-UA server get currentChannelCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.currentChannelCount:'), chalk.cyan(server.getCurrentChannelCount()));
      assert.ok(true, 'OPC-UA server get currentChannelCount');
    });

    it('OPC-UA server get currentSubscriptionCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.currentSubscriptionCount:'), chalk.cyan(server.getCurrentSubscriptionCount()));
      assert.ok(true, 'OPC-UA server get currentSubscriptionCount');
    });

    it('OPC-UA server get rejectedSessionCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.rejectedSessionCount:'), chalk.cyan(server.getRejectedSessionCount()));
      assert.ok(true, 'OPC-UA server get rejectedSessionCount');
    });

    it('OPC-UA server get rejectedRequestsCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.rejectedRequestsCount:'), chalk.cyan(server.getRejectedRequestsCount()));
      assert.ok(true, 'OPC-UA server get rejectedRequestsCount');
    });

    it('OPC-UA server get sessionAbortCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.sessionAbortCount:'), chalk.cyan(server.getSessionAbortCount()));
      assert.ok(true, 'OPC-UA server get sessionAbortCount');
    });

    it('OPC-UA server get publishingIntervalCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.publishingIntervalCount:'), chalk.cyan(server.getPublishingIntervalCount()));
      assert.ok(true, 'OPC-UA server get publishingIntervalCount');
    });

    it('OPC-UA server get currentSessionCount', async () => {
      // bytesWritten
      console.log(chalk.green('server.currentSessionCount:'), chalk.cyan(server.getCurrentSessionCount()));
      assert.ok(true, 'OPC-UA server get currentSessionCount');
    });

    it('OPC-UA server is initialized', async () => {
      // bytesWritten
      console.log(chalk.green('server.isInitialized:'), chalk.cyan(server.isInitialized()));
      assert.ok(true, 'OPC-UA server is initialized');
    });

    it('OPC-UA server is auditing', async () => {
      // bytesWritten
      console.log(chalk.green('server.isAuditing:'), chalk.cyan(server.isAuditing()));
      assert.ok(true, 'OPC-UA server is auditing');
    });

    //------------- SESSION GET -----------------//

    it('OPC-UA client sessionEndpoint', async () => {
      // client.sessionEndpoint()
      inspector('client.sessionEndpoint:', client.sessionEndpoint());
      assert.ok(true, 'OPC-UA client sessionEndpoint');
    });

    it('OPC-UA client sessionSubscriptionCount', async () => {
      // client.sessionSubscriptionCount()
      console.log(chalk.green('client.sessionSubscriptionCount:'), chalk.cyan(client.sessionSubscriptionCount()));
      assert.ok(true, 'OPC-UA client sessionSubscriptionCount');
    });

    it('OPC-UA client sessionIsReconnecting', async () => {
      // client.isReconnecting()
      console.log(chalk.green('client.sessionIsReconnecting:'), chalk.cyan(client.sessionIsReconnecting()));
      assert.ok(true, 'OPC-UA client sessionIsReconnecting');
    });

    it('OPC-UA client sessionGetPublishEngine', async () => {
      const publishEngine = client.sessionGetPublishEngine();
      console.log(chalk.green('client.publishEngine.activeSubscriptionCount:'), chalk.cyan(publishEngine.activeSubscriptionCount));
      console.log(chalk.green('client.publishEngine.isSuspended:'), chalk.cyan(publishEngine.isSuspended));
      console.log(chalk.green('client.publishEngine.nbMaxPublishRequestsAcceptedByServer:'), chalk.cyan(publishEngine.nbMaxPublishRequestsAcceptedByServer));
      console.log(chalk.green('client.publishEngine.nbPendingPublishRequests:'), chalk.cyan(publishEngine.nbPendingPublishRequests));
      assert.ok(true, 'OPC-UA client sessionGetPublishEngine');
    });

    //------------- START SUBSCRIPTION -------------------//
    it('OPC-UA client subscription create', () => {
      client.subscriptionCreate();
      assert.ok(true, 'OPC-UA client subscription create');
    });

    it('OPC-UA client subscription get session', () => {
      const session = client.subscriptionGetSession();
      inspector('OPC-UA client subscription get session:', session.toString());
      assert.ok(session, 'OPC-UA client subscription get session');
    });

    it('OPC-UA client subscription has session', () => {
      const hasSession = client.subscriptionHasSession();
      console.log(chalk.green('OPC-UA client subscription has session:'), chalk.cyan(hasSession));
      assert.ok(hasSession, 'OPC-UA client subscription has session');
    });

    it('OPC-UA client subscription is active', () => {
      const isActive = client.subscriptionIsActive();
      console.log(chalk.green('OPC-UA client subscription is active:'), chalk.cyan(isActive));
      assert.ok(isActive, 'OPC-UA client subscription is active');
    });

    it('OPC-UA client subscription to string', () => {
      const strSubscription = client.subscriptionToString();
      inspector('OPC-UA client subscription to string:', strSubscription);
      assert.ok(strSubscription, 'OPC-UA client subscription to string');
    });

    it('OPC-UA client subscription evaluate remaining lifetime', () => {
      const lifetimeNumber = client.subscriptionEvaluateRemainingLifetime();
      console.log(chalk.green('OPC-UA client subscription evaluate remaining lifetime:'), chalk.cyan(lifetimeNumber));
      assert.ok(true, 'OPC-UA client subscription evaluate remaining lifetime');
    });

    it('OPC-UA client subscription terminate', async () => {
      // await pause(1000);
      await client.subscriptionTerminate();
      assert.ok(true, 'OPC-UA client subscription terminate');
    });


    //------------- SESSION close/disconnect -----------------//

    it('OPC-UA client session close', async () => {
      await client.sessionClose();
      assert.ok(true, 'OPC-UA client session close');
    });

    it('OPC-UA client disconnect', async () => {
      await client.opcuaClientDisconnect();
      assert.ok(true, 'OPC-UA client disconnect');
    });

    //------------- SERVER shutdown -----------------//

    it('OPC-UA server shutdown', async () => {
      await server.opcuaServerShutdown();
      assert.ok(true, 'OPC-UA server shutdown');
    });
  });
});
