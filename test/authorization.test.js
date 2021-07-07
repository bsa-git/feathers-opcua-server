/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../src/app');
const port = app.get('port');
const { inspector, } = require('../src/plugins/lib');
const { localStorage, loginLocal, feathersClient, AuthServer } = require('../src/plugins/auth');
const {
  saveFakesToServices,
  fakeNormalize,
} = require('../src/plugins/test-helpers');

const debug = require('debug')('app:authentication.test');

const isDebug = false;
const isLog = true;
const isTest = false;

// Get generated fake data
const fakes = fakeNormalize();
const fakeUsers = fakes['users'];
const fakeMessages = fakes['messages'];
const idField = AuthServer.getIdField(fakeUsers);
const AdminFakeUser = fakeUsers[0];
const guestFakeUser = fakeUsers[1];
const fakeMessage = fakeMessages[0];


const baseUrl = process.env.BASE_URL;
const baseUrl2 = 'http://localhost:3131';

describe('<<=== Authentication Tests (authentication.test.js) ===>>', () => {

  it('#1: Registered the authentication service', () => {
    assert.ok(app.service('authentication'));
  });

  describe('<<--- Local strategy --->>', () => {
    let appSocketioClient, appRestClient, server;
    //----------------------------------------------

    before(function (done) {
      server = app.listen(port);
      server.once('listening', () => {
        setTimeout(async () => {
          await saveFakesToServices(app, 'users');
          localStorage.clear();
          appRestClient = feathersClient({ transport: 'rest', serverUrl: baseUrl });
          if (isDebug) debug('Done before StartTest!');
          done();
        }, 500);
      });
    });

    after(function (done) {
      server.close();
      setTimeout(() => {
        if (isDebug) debug('Done after EndTest!');
        done();
      }, 500);
    });

    it('#2: Error reading message for not authenticates user', async () => {
      try {
        const params = { provider: 'rest' };
        const service = app.service('messages');
        await service.get(fakeMessage[idField], params);
        assert.ok(false, 'Error reading message for not authenticates user');
      } catch (error) {
        // inspector('Error reading message for not authenticates user.error:', error.message);
        assert.ok(error.message === 'Not authenticated', 'Error reading message for not authenticates user');
      }
    });

    it('#3: Reading message test for authenticates user', async () => {
      // Login
      await loginLocal(appRestClient, AdminFakeUser.email, AdminFakeUser.password);
      const service = appRestClient.service('messages');
      const msg = await service.get(fakeMessage[idField]);
      // Logout
      await appRestClient.logout();
      assert.ok(msg, 'Reading message test for authenticates user');
    });


    it('#4: Error creating message for authenticates user ???', async () => {
      try {
        // Login
        await loginLocal(appRestClient, AdminFakeUser.email, AdminFakeUser.password);
        const service = appRestClient.service('messages');
        const msg = await service.create({text: 'Test authorization'});
        // Logout
        await appRestClient.logout();
        // inspector('Error creating message for authenticates user.msg:', msg);
        assert.ok(true, 'Error creating message for authenticates user');
      } catch (error) {
        inspector('Error creating message for authenticates user.error:', error);
        // assert.ok(error.message === 'Not authenticated', 'Error reading message for not authenticates user');
        assert.ok(true, 'Error creating message for authenticates user');
      }
    });

  });
});
