/* eslint-disable no-unused-vars */
const assert = require('assert');

const {
  inspector,
  pause,
  getTime
} = require('../../src/plugins/lib');

const {
  localStorage,
  loginLocal,
  feathersClient,
  AuthServer
} = require('../../src/plugins/auth');

const {
  saveFakesToServices,
  fakeNormalize,
  clearCacheApp
} = require('../../src/plugins/test-helpers');

const {
  getCountItems,
  createItems,
  findItems,
  removeItems
} = require('../../src/plugins/db-helpers');

const chalk = require('chalk');
const moment = require('moment');
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');

const debug = require('debug')('app:feathers-client.test');

const isDebug = false;
const isTest = false;

// OPCUA Options
const srvData = {
  params: {
    port: 26560, // default - 26543, 26540 (opcua.test), 26550 (opcua.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test),
    serverInfo: { applicationName: 'ua-cherkassy-azot_test2' },
  }
};

const clientData = {
  params: {
    applicationName: 'ua-cherkassy-azot_test2',
  }
};

const id = srvData.params.serverInfo.applicationName;

// Get generated fake data
const fakes = fakeNormalize();
const fakeUsers = fakes['users'];
const fakeUser = fakeUsers[0];
const idField = AuthServer.getIdField(fakeUser);

describe('<<=== Feathers Client Tests (feathers-client.test.js) ===>>', () => {

  describe('<<--- Local strategy --->>', () => {
    let app, appSocketioClient, appRestClient, server;
    //----------------------------------------------

    before(function (done) {

      // Clear cache app
      app = clearCacheApp();
      const port = app.get('port') || 3030;
      const baseUrl = process.env.BASE_URL;
      
      server = app.listen(port);
      server.once('listening', () => {
        setTimeout(async () => {
          localStorage.clear();
          await saveFakesToServices(app, 'users');
          appSocketioClient = await feathersClient({ transport: 'socketio', serverUrl: baseUrl });
          appRestClient = await feathersClient({ transport: 'rest', serverUrl: baseUrl });
          if (isDebug) debug('Done before StartTest!');
          done();
        }, 500);
      });
    });

    after(function (done) {
      // this.timeout(30000);
      server.close();
      setTimeout(() => {
        if (isDebug) debug('Done after EndTest!');
        done();
      }, 500);
    });

    it('#1: Registered the authentication service', () => {
      assert.ok(app.service('authentication'));
    });

    it('#2.1: Authenticates (appRestClient) user and get accessToken', async () => {
      // Login
      await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      const { accessToken } = await appRestClient.get('authentication');
      assert.ok(accessToken, 'Get access token for user');
      const payload = await AuthServer.verifyJWT(accessToken);
      if (isDebug) inspector('Get userId from payload:', payload);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
      // Logout
      await appRestClient.logout();
      let token = await appRestClient.authentication.getAccessToken();
      if (isDebug) debug('token:', token);
      assert.ok(!token, 'Get access token for user');
    });

    it('#2.2: Authenticates (appSocketioClient) user and get accessToken', async () => {
      // Login
      await loginLocal(appSocketioClient, fakeUser.email, fakeUser.password);
      const { accessToken } = await appSocketioClient.get('authentication');
      assert.ok(accessToken, 'Get access token for user');
      
      const payload = await AuthServer.verifyJWT(accessToken);
      if (isDebug) inspector('Get userId from payload:', payload);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
      // Logout
      await appSocketioClient.logout();
      let token = await appSocketioClient.authentication.getAccessToken();
      if (isDebug) debug('token:', token);
      assert.ok(!token, 'Get access token for user');
    });

    it('#3.1: Authenticates (appRestClient) and get user from `users` service', async () => {
      // Login
      const { accessToken } = await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');
      const service = appRestClient.service('users');
      assert.ok(service, 'Get service for `users`');
      const payload = await AuthServer.verifyJWT(accessToken);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
      const user = await service.get(payload.sub);
      if (isDebug) inspector('Get user from `users` service.user:', user);
      assert.ok(user, 'Get user from `users` service');
      // Logout
      await appRestClient.logout();
    });

    it('#3.2: Authenticates (appSocketioClient) and get user from `users` service', async () => {
      // Login
      const { accessToken } = await loginLocal(appSocketioClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');
      const service = appSocketioClient.service('users');
      assert.ok(service, 'Get service for `users`');
      const payload = await AuthServer.verifyJWT(accessToken);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
      const user = await service.get(payload.sub);
      if (isDebug) inspector('Get user from `users` service.user:', user);
      assert.ok(user, 'Get user from `users` service');
      // Logout
      await appSocketioClient.logout();
    });

    it('#4.1: Error Authenticates (appRestClient) user', async () => {
      try {
        await loginLocal(appRestClient, 'error@test.com', 'anypass');
        assert.ok(false, 'Error Authenticates user');
      } catch (error) {
        console.error('Authentication error', error.message);
        assert.ok(true, 'Error Authenticates user');
      }
    });

    it('#4.2: Error Authenticates (appSocketioClient) user', async () => {
      try {
        await loginLocal(appSocketioClient, 'error@test.com', 'anypass');
        assert.ok(false, 'Error Authenticates user');
      } catch (error) {
        console.error('Authentication error', error.message);
        assert.ok(true, 'Error Authenticates user');
      }
    });

    it('#5.1: Authentication (appRestClient) client operations', async () => {
      const auth = appRestClient.authentication;
      // Login
      await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      let accessToken = await auth.getAccessToken();
      assert.ok(accessToken, 'Created access token for user');
      const feathersJwt = await auth.storage.getItem('feathers-jwt');
      if (isDebug) inspector('Get storage.feathersJwt:', feathersJwt);
      assert.ok(accessToken === feathersJwt, 'Get access token from storage');
      // reAuthenticate
      await auth.reAuthenticate();
      accessToken = await auth.getAccessToken();
      assert.ok(accessToken, 'Created access token for user');
      // removeAccessToken()
      await auth.removeAccessToken();
      accessToken = await auth.getAccessToken();
      assert.ok(!accessToken, 'Remove access token from storage');
      // Logout
      await appRestClient.logout();
    });

    it('#5.2: Authentication (appSocketioClient) client operations', async () => {
      const auth = appSocketioClient.authentication;
      // Login
      await loginLocal(appSocketioClient, fakeUser.email, fakeUser.password);
      let accessToken = await auth.getAccessToken();
      assert.ok(accessToken, 'Created access token for user');
      const feathersJwt = await auth.storage.getItem('feathers-jwt');
      if (isDebug) inspector('Get storage.feathersJwt:', feathersJwt);
      assert.ok(accessToken === feathersJwt, 'Get access token from storage');
      // reAuthenticate
      await auth.reAuthenticate();
      accessToken = await auth.getAccessToken();
      assert.ok(accessToken, 'Created access token for user');
      // removeAccessToken()
      await auth.removeAccessToken();
      accessToken = await auth.getAccessToken();
      assert.ok(!accessToken, 'Remove access token from storage');
      // Logout
      await appSocketioClient.logout();
    });

    //===== OPERATIONS WITH "OPCUA-TAGS" =======//
    it('#6.1: Authenticates (appRestClient) and operations with `opcua-tags` service', async () => {
      // Login
      const { accessToken } = await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');

      // Get opcua tags 
      const opcuaTags = fakes['opcuaTags'];
      if (isDebug) inspector('fakes.opcua-tags:', opcuaTags);

      if (opcuaTags.length) {
        // Remove data from 'opcua-tags' services 
        const countItems = await getCountItems(appRestClient, 'opcua-tags');
        if (countItems) {
          let removedItems = await removeItems(appRestClient, 'opcua-tags');
          assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');
        }

        // Add tags
        await createItems(appRestClient, 'opcua-tags', opcuaTags);
        // Find all tags
        const findedItems = await findItems(appRestClient, 'opcua-tags');
        if (isDebug) inspector('Find tags from \'opcua-tags\' service', findedItems);
        assert.ok(findedItems.length === opcuaTags.length, 'Error for test: `Save tags and find tags`');
      }

      // Logout
      await appRestClient.logout();
    });

    it('#6.2: Authenticates (appSocketioClient) and operations with `opcua-tags` service', async () => {
      // Login
      const { accessToken } = await loginLocal(appSocketioClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');

      // Get opcua tags 
      const opcuaTags = fakes['opcuaTags'];
      if (isDebug) inspector('fakes.opcua-tags:', opcuaTags);

      if (opcuaTags.length) {
        // Remove data from 'opcua-tags' services 
        const countItems = await getCountItems(appSocketioClient, 'opcua-tags');
        if (countItems) {
          let removedItems = await removeItems(appSocketioClient, 'opcua-tags');
          assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');
        }

        // Add tags
        await createItems(appSocketioClient, 'opcua-tags', opcuaTags);
        // Find all tags
        const findedItems = await findItems(appSocketioClient, 'opcua-tags');
        if (isDebug) inspector('Find tags from \'opcua-tags\' service', findedItems);
        assert.ok(findedItems.length === opcuaTags.length, 'Error for test: `Save tags and find tags`');
      }

      // Logout
      await appSocketioClient.logout();
    });

    //===== REGISTERED SERVICES "OPCUA-CLIENTS"/"OPCUA-SERVERS" =======//
    it('#7.1 OPC-UA clients: registered (appRestClient) the service', async () => {
      const service = appRestClient.service('opcua-clients');
      assert.ok(service, 'OPC-UA clients: registered the service');
    });

    it('#7.2 OPC-UA clients: registered (appSocketioClient) the service', async () => {
      const service = appSocketioClient.service('opcua-clients');
      assert.ok(service, 'OPC-UA clients: registered the service');
    });

    it('#8.1 OPC-UA servers: registered (appRestClient) the service', async () => {
      const service = appRestClient.service('opcua-servers');
      assert.ok(service, 'OPC-UA servers: registered the service');
    });

    it('#8.2 OPC-UA servers: registered (appSocketioClient) the service', async () => {
      const service = appSocketioClient.service('opcua-servers');
      assert.ok(service, 'OPC-UA servers: registered the service');
    });
    
    //===== SERVER/CLIENT CREATE (appRestClient) =======//
    it('#9.1 OPC-UA servers: created (appRestClient) the service', async () => {
      const service = appRestClient.service('opcua-servers');
      // service create
      const opcuaServer = await service.create(srvData);
      if (isDebug) inspector('created the service.opcuaServer:', opcuaServer.server.currentState);
      assert.ok(opcuaServer, 'OPC-UA servers: created the service');
    });

    it('#10.1 OPC-UA clients: created (appRestClient) the service', async () => {
      const service = appRestClient.service('opcua-clients');
      // service create
      let opcuaClient = await service.create(clientData);
      if (isDebug) inspector('created the service.opcuaClient:', opcuaClient);
      assert.ok(opcuaClient, 'OPC-UA clients: created the service');
      // Get client service
      opcuaClient = await service.get(id);
      assert.ok(opcuaClient, 'OPC-UA servers: get the service');
      // Find client services
      const opcuaClients = await service.find();
      assert.ok(opcuaClients.length, 'OPC-UA clients: find services');
      // Get client currentState
      let data = { id, action: 'getCurrentState' };
      const currentState = await service.create(data);
      // inspector('clientCurrentState:', currentState);
      assert.ok(currentState, 'OPC-UA clients: get service currentState');
      // Get clientInfo
      data = { id, action: 'getClientInfo' };
      const clientInfo = await service.create(data);
      // inspector('clientInfo:', clientInfo);
      assert.ok(clientInfo, 'OPC-UA clients: get clientInfo');
    });

    //============== SESSION HISTORY VALUES (appRestClient) ====================//
    it('#11.1 OPC-UA clients: session history (appRestClient) value', async () => {
      let readResult, data, dataItems, histOpcuaValues = [], values = [], accumulator;
      //------------------------------------
      const service = appRestClient.service('opcua-clients');

      // getSrvCurrentState

      data = { id, action: 'getItemNodeId', nameNodeId: 'CH_M51::ValueFromFile' };
      readResult = await service.create(data);
      if (isDebug) inspector('getItemNodeId.readResult:', readResult);

      if (readResult) {
        // Get start time
        const start = moment();
        debug('SessionHistoryValue_ForCH_M51.StartTime:', getTime(start, false));
        // Pause
        await pause(1000);
        // Get end time
        const end = moment();
        debug('SessionHistoryValue_ForCH_M51.EndTime:', getTime(end, false));

        // service.sessionReadHistoryValues
        data = { id, action: 'sessionReadHistoryValues', nameNodeIds: 'CH_M51::ValueFromFile', start, end };
        readResult = await service.create(data);

        if (isDebug) inspector('SessionHistoryValue_ForCH_M51.readResult:', readResult);
        // inspector('SessionHistoryValue_ForCH_M51.readResult:', readResult);
        if (readResult.length && readResult[0].statusCode.value === 0) {
          if (readResult[0].historyData.dataValues.length) {
            let dataValues = readResult[0].historyData.dataValues;
            dataValues.forEach(dataValue => {
              if (dataValue.statusCode.value === 0) {
                dataItems = JSON.parse(dataValue.value.value);
                accumulator = '';
                values = [];
                loForEach(dataItems, function (value, key) {
                  accumulator = accumulator + `${key}=${value}, `;
                  values.push({ key, value });
                });
                histOpcuaValues.push({ name: data.nameNodeIds, timestamp: dataValue.sourceTimestamp, values });
                // console.log(chalk.green('SessionHistoryValue_ForCH_M51.ValueFromFile:'), chalk.cyan(`${accumulator} Timestamp=${dataValue.sourceTimestamp}`));
                assert.ok(true, 'OPC-UA clients: session history value from file');
              } else {
                assert.ok(false, 'OPC-UA clients: session history value from file');
              }
            });
          }
        } else {
          assert.ok(false, 'OPC-UA clients: session history value from file');
        }
      } else {
        assert.ok(false, 'OPC-UA clients: session history value from file');
      }
      if (isDebug) inspector('SessionHistoryValue_ForCH_M51.histOpcuaValues:', histOpcuaValues);
      inspector('SessionHistoryValue_ForCH_M51.histOpcuaValues:', histOpcuaValues);
      assert.ok(readResult.length, 'OPC-UA clients: session history value from file');
    });

    //===== CLIENT/SERVER REMOVE (appRestClient) =======//
    it('#12.1 OPC-UA clients: remove service (appRestClient)', async () => {
      const service = appRestClient.service('opcua-clients');
      const opcuaClient = await service.remove(id);
      if (isDebug) inspector('Remove client service:', opcuaClient);
      // inspector('Remove client service:', opcuaClient);
      assert.ok(opcuaClient, 'OPC-UA clients: remove service');
    });

    it('#13.1 OPC-UA servers:  remove service (appRestClient)', async () => {
      const service = appRestClient.service('opcua-servers');
      const opcuaServer = await service.remove(id);
      if (isDebug) inspector('Remove server service:', opcuaServer);
      // inspector('Remove server service:', opcuaServer);
      assert.ok(opcuaServer, 'OPC-UA servers:  remove service');
    });
  });
});
