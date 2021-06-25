/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const host = app.get('host') || 'localhost';
const { localStorage, loginLocal, feathersClient, AuthServer } = require('../../src/plugins/auth');
const {
  inspector,
  saveFakesToServices,
  fakeNormalize,
  startListenPort,
  stopListenPort,
} = require('../../src/plugins');

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
      this.timeout(10000);
      if (isDebug) debug('before Start!');
      server = app.listen(port);
      server.once('listening', () => {
        setTimeout(async () => {
          localStorage.clear();
          await saveFakesToServices(app, 'users');
          appSocketioClient = feathersClient({ transport: 'socketio', serverUrl: baseUrl });
          appRestClient = feathersClient({ transport: 'rest', serverUrl: baseUrl });
          done();
        }, 500);
      });
    });

    after(function (done) {
      if (isDebug) debug('after EndTest !');
      this.timeout(10000);
      server.close();
      setTimeout(() => done(), 500);
    });

    it('#2: Authenticates user and get accessToken', async () => {
      await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      const { accessToken } = await appRestClient.get('authentication');
      assert.ok(accessToken, 'Created access token for user');
      const payload = await AuthServer.verifyJWT(accessToken);
      if(isLog) inspector('Get userId from payload:', payload);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
    });

    it('#3: Authenticates and get user from `users` service', async () => {
      const { accessToken } = await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');
      const service = appRestClient.service('users');
      assert.ok(service, 'Get service for `users`');
      const payload = await AuthServer.verifyJWT(accessToken);
      assert.ok(payload.sub === fakeUser[idField], 'Get userId from payload');
      const user = await service.get(payload.sub);
      if(isLog) inspector('Get user from `users` service.user:', user);
      assert.ok(user, 'Get user from `users` service');
    });
  });
});
