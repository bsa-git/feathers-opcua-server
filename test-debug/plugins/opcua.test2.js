/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const { OpcuaServer, OpcuaClient, appRoot, inspector } = require('../../src/plugins');
const AddressSpaceParams = require(`${appRoot}/src/plugins/test-helpers/AddressSpaceTestOptions.json`);
const addressSpaceGetters = require(`${appRoot}/src/plugins/test-helpers/opcua-addressspace-getters`);
const addressSpaceMethods = require(`${appRoot}/src/plugins/test-helpers/opcua-addressspace-methods`);
const chalk = require('chalk');
const moment = require('moment');

// serverInfo.applicationName = 'NodeOPCUA_380-472-00203826-M52'; // NodeOPCUA_UA-CHERKASSY-AZOT-M52
// buildInfo.productName

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

describe('<<=== OPC-UA: Test2 ===>>', () => {

  before(async () => {
    try {
      // Create OPC-UA server
      server = new OpcuaServer(app, {
        serverInfo: { applicationName: 'UA-CHERKASSY-AZOT-M52' },
        buildInfo: { productName: '380-472-00203826-M52' }
      });
      // Create OPC-UA client
      client = new OpcuaClient(app);
      debug('OPCUA - Test2::before: Done');
    } catch (error) {
      console.error('OPCUA - Test2::before.error:', error.message);
    }
  });

  after(async () => {
    try {
      if (opcuaClient !== null) opcuaClient = null;
      if (client !== null) client = null;

      if (opcuaServer !== null) opcuaServer = null;
      if (server !== null) server = null;

      debug('OPCUA - Test2::after: Done');
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
        server.constructAddressSpace(AddressSpaceParams, addressSpaceGetters, addressSpaceMethods);
        const endpoints = await server.start();
        opcuaServer = server.opcuaServer;
        assert.ok(true, 'OPC-UA server start');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get serverInfo', async () => {
      try {
        // serverInfo
        inspector('OPC-UA server get serverInfo:', server.getServerInfo());
        assert.ok(true, 'OPC-UA server get serverInfo');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get buildInfo', async () => {
      try {
        // buildInfo
        inspector('OPC-UA server get buildInfo:', server.getBuildInfo());
        assert.ok(true, 'OPC-UA server get buildInfo');
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
        await client.connect(server.getCurrentState());
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

    //------------- SERVER GET -----------------//

    it('OPC-UA server get bytesWritten', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.bytesWritten:'), chalk.cyan(server.getBytesWritten()));
        assert.ok(true, 'OPC-UA server get bytesWritten');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get bytesRead', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.bytesRead:'), chalk.cyan(server.getBytesRead()));
        assert.ok(true, 'OPC-UA server get bytesRead');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get transactionsCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.transactionsCount:'), chalk.cyan(server.getTransactionsCount()));
        assert.ok(true, 'OPC-UA server get transactionsCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get currentChannelCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.currentChannelCount:'), chalk.cyan(server.getCurrentChannelCount()));
        assert.ok(true, 'OPC-UA server get currentChannelCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get currentSubscriptionCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.currentSubscriptionCount:'), chalk.cyan(server.getCurrentSubscriptionCount()));
        assert.ok(true, 'OPC-UA server get currentSubscriptionCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get rejectedSessionCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.rejectedSessionCount:'), chalk.cyan(server.getRejectedSessionCount()));
        assert.ok(true, 'OPC-UA server get rejectedSessionCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get rejectedRequestsCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.rejectedRequestsCount:'), chalk.cyan(server.getRejectedRequestsCount()));
        assert.ok(true, 'OPC-UA server get rejectedRequestsCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get sessionAbortCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.sessionAbortCount:'), chalk.cyan(server.getSessionAbortCount()));
        assert.ok(true, 'OPC-UA server get sessionAbortCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get publishingIntervalCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.publishingIntervalCount:'), chalk.cyan(server.getPublishingIntervalCount()));
        assert.ok(true, 'OPC-UA server get publishingIntervalCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server get currentSessionCount', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.currentSessionCount:'), chalk.cyan(server.getCurrentSessionCount()));
        assert.ok(true, 'OPC-UA server get currentSessionCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server is initialized', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.isInitialized:'), chalk.cyan(server.isInitialized()));
        assert.ok(true, 'OPC-UA server is initialized');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA server is auditing', async () => {
      try {
        // bytesWritten
        console.log(chalk.green('server.isAuditing:'), chalk.cyan(server.isAuditing()));
        assert.ok(true, 'OPC-UA server is auditing');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    //------------- SESSION GET -----------------//

    it('OPC-UA client sessionEndpoint', async () => {
      try {
        // client.sessionEndpoint()
        inspector('client.sessionEndpoint:', client.sessionEndpoint());
        assert.ok(true, 'OPC-UA client sessionEndpoint');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client sessionSubscriptionCount', async () => {
      try {
        // client.sessionSubscriptionCount()
        console.log(chalk.green('client.sessionSubscriptionCount:'), chalk.cyan(client.sessionSubscriptionCount()));
        assert.ok(true, 'OPC-UA client sessionSubscriptionCount');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client sessionIsReconnecting', async () => {
      try {
        // client.isReconnecting()
        console.log(chalk.green('client.sessionIsReconnecting:'), chalk.cyan(client.sessionIsReconnecting()));
        assert.ok(true, 'OPC-UA client sessionIsReconnecting');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client sessionGetPublishEngine', async () => {
      try {
        const publishEngine = client.sessionGetPublishEngine();
        console.log(chalk.green('client.publishEngine.activeSubscriptionCount:'), chalk.cyan(publishEngine.activeSubscriptionCount));
        console.log(chalk.green('client.publishEngine.isSuspended:'), chalk.cyan(publishEngine.isSuspended));
        console.log(chalk.green('client.publishEngine.nbMaxPublishRequestsAcceptedByServer:'), chalk.cyan(publishEngine.nbMaxPublishRequestsAcceptedByServer));
        console.log(chalk.green('client.publishEngine.nbPendingPublishRequests:'), chalk.cyan(publishEngine.nbPendingPublishRequests));
        assert.ok(true, 'OPC-UA client sessionGetPublishEngine');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    //------------- START SUBSCRIPTION -------------------//
    it('OPC-UA client subscription create', () => {
      try {
        client.subscriptionCreate();
        assert.ok(true, 'OPC-UA client subscription create');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription get session', () => {
      try {
        const session = client.subscriptionGetSession();
        inspector('OPC-UA client subscription get session:', session.toString());
        assert.ok(session, 'OPC-UA client subscription get session');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription has session', () => {
      try {
        const hasSession = client.subscriptionHasSession();
        console.log(chalk.green('OPC-UA client subscription has session:'), chalk.cyan(hasSession));
        assert.ok(hasSession, 'OPC-UA client subscription has session');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription is active', () => {
      try {
        const isActive = client.subscriptionIsActive();
        console.log(chalk.green('OPC-UA client subscription is active:'), chalk.cyan(isActive));
        assert.ok(isActive, 'OPC-UA client subscription is active');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription to string', () => {
      try {
        const strSubscription = client.subscriptionToString();
        inspector('OPC-UA client subscription to string:', strSubscription);
        assert.ok(strSubscription, 'OPC-UA client subscription to string');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription evaluate remaining lifetime', () => {
      try {
        const lifetimeNumber = client.subscriptionEvaluateRemainingLifetime();
        console.log(chalk.green('OPC-UA client subscription evaluate remaining lifetime:'), chalk.cyan(lifetimeNumber));
        assert.ok(true, 'OPC-UA client subscription evaluate remaining lifetime');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });

    it('OPC-UA client subscription terminate', async () => {
      try {
        // await pause(1000);
        await client.subscriptionTerminate();
        assert.ok(true, 'OPC-UA client subscription terminate');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });


    //------------- SESSION close/disconnect -----------------//

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

    //------------- SERVER shutdown -----------------//

    it('OPC-UA server shutdown', async () => {
      try {
        await server.shutdown();
        assert.ok(true, 'OPC-UA server shutdown');
      } catch (error) {
        assert.fail(`Should never get here: ${error.message}`);
      }
    });
  });
});
