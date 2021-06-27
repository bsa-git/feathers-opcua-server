/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const host = app.get('host') || 'localhost';
const { inspector} = require('../../src/plugins/lib');
const { localStorage, loginLocal, feathersClient, AuthServer } = require('../../src/plugins/auth');
const {
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins/test-helpers');

const debug = require('debug')('app:feathers-client.test');

const isDebug = true;
const isLog = true;
const isTest = false;

// Get generated fake data
const fakes = fakeNormalize();
const fakeUsers = fakes['users'];
const fakeUser = fakeUsers[0];
const  idField = AuthServer.getIdField(fakeUser);

const baseUrl = process.env.BASE_URL;
const baseUrl2 = 'http://localhost:3131';

describe('<<=== Feathers Client Tests (feathers-client.test.js) ===>>', () => {

  it('#1: Registered the authentication service', () => {
    assert.ok(app.service('authentication'));
  });

  describe('<<--- Local strategy --->>', () => {
    let appSocketioClient, appRestClient, server;
    //----------------------------------------------

    before(function (done) {
      // this.timeout(30000);
      server = app.listen(port);
      server.once('listening', () => {
        setTimeout(async () => {
          localStorage.clear();
          await saveFakesToServices(app, 'users');
          appSocketioClient = feathersClient({ transport: 'socketio', serverUrl: baseUrl });
          appRestClient = feathersClient({ transport: 'rest', serverUrl: baseUrl });
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

    it('#2: Authenticates user and get accessToken', async () => {
      // Login
      await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      const { accessToken } = await appRestClient.get('authentication');
      assert.ok(accessToken, 'Get access token for user');
      const payload = await AuthServer.verifyJWT(accessToken);
      if(isLog) inspector('Get userId from payload:', payload);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
      // Logout
      await appRestClient.logout();
      let token = await appRestClient.authentication.getAccessToken();
      if(isDebug) debug('token:', token);
      assert.ok(!token, 'Get access token for user');
    });

    it('#3: Authenticates and get user from `users` service', async () => {
      // Login
      const { accessToken } = await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');
      const service = appRestClient.service('users');
      assert.ok(service, 'Get service for `users`');
      const payload = await AuthServer.verifyJWT(accessToken);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
      const user = await service.get(payload.sub);
      if(isLog) inspector('Get user from `users` service.user:', user);
      assert.ok(user, 'Get user from `users` service');
      // Logout
      await appRestClient.logout();
    });

    it('#4: Error Authenticates user', async () => {
      try {
        await loginLocal(appRestClient, 'error@test.com', 'anypass');
        assert.ok(false, 'Error Authenticates user');
      } catch (error) {
        console.error('Authentication error', error.message);
        assert.ok(true, 'Error Authenticates user');
      }
    });

    it('#5: Authentication client operations', async () => {
      const auth = appRestClient.authentication;
      // Login
      await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      let accessToken = await auth.getAccessToken();
      assert.ok(accessToken, 'Created access token for user');
      const feathersJwt = await auth.storage.getItem('feathers-jwt');
      if(isLog) inspector('Get storage.feathersJwt:', feathersJwt);
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
  });
});
