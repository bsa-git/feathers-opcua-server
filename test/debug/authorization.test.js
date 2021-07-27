/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port');
const { inspector, } = require('../../src/plugins/lib');
const { localStorage, loginLocal, feathersClient, AuthServer } = require('../../src/plugins/auth');
const {
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins/test-helpers');

const debug = require('debug')('app:authorization.test');

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

const newUser = {
  email: 'new-user@test.com',
  password: 'new-user'
};

const newMessage = {
  text: 'Новое сообщение!'
};

let newUserId = '';


const baseUrl = process.env.BASE_URL;
const baseUrl2 = 'http://localhost:3131';

describe('<<=== Authorization Tests (authorization.test.js) ===>>', () => {

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

    it('#4: Error create message for authenticates user (Guest)', async () => {
      try {
        // Login 
        await loginLocal(appRestClient, guestFakeUser.email, guestFakeUser.password);
        // Get message
        let service = appRestClient.service('messages');
        await service.create(newMessage);
        assert.ok(false, 'Reading message test for authenticates user');
      } catch (error) {
        // inspector('Error create message for authenticates user (Guest).error:', error.message);
        assert.ok(error.message === 'You are not allowed to create messages', 'Reading message test for authenticates user');
        // Logout
        await appRestClient.logout();
      }
    });

    // it('#3: Reading message test for authenticates user (Administrator)', async () => {
    //   // Login
    //   await loginLocal(appRestClient, AdminFakeUser.email, AdminFakeUser.password);
    //   const service = appRestClient.service('messages');
    //   const msg = await service.create(newMessage);
    //   // Logout
    //   await appRestClient.logout();
    //   assert.ok(msg, 'Reading message test for authenticates user');
    // });

    /*

    it('#3: Reading message test for authenticates user (Administrator)', async () => {
      // Login
      await loginLocal(appRestClient, AdminFakeUser.email, AdminFakeUser.password);
      const service = appRestClient.service('messages');
      const msg = await service.get(fakeMessage[idField]);
      // Logout
      await appRestClient.logout();
      assert.ok(msg, 'Reading message test for authenticates user');
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

    it('#5: Create new user for not authenticates user', async () => {
      const params = { provider: 'rest' };
      const service = app.service('users');
      const user = await service.create(newUser, params);
      newUserId = user[idField].toString();
      assert.ok(user, 'Create user for not authenticates user');
    });

    it('#6: Find new user for not authenticates user', async () => {
      const params = { provider: 'rest' };
      const service = app.service('users');
      let user = await service.find({ query: { email: newUser.email } }, params);
      user = user.data[0];
      assert.ok(user, 'Error reading new user for not authenticates user');
    });

    it('#7: Error get new user for not authenticates user', async () => {
      try {
        const params = { provider: 'rest' };
        const service = app.service('users');
        await service.get(newUserId, params);
        // inspector('Error reading new user for not authenticates user user::', user);
        assert.ok(false, 'Error get new user for not authenticates user');
      } catch (error) {
        // inspector('Error reading message for not authenticates user.error:', error.message);
        assert.ok(error.message === 'Not authenticated', 'Error get new user for not authenticates user');
      }
    });

    it('#8: Error removing new user for not authenticates user', async () => {
      try {
        const params = { provider: 'rest' };
        const service = app.service('users');
        await service.remove(newUserId, params);
        // inspector('Error reading new user for not authenticates user user::', user);
        assert.ok(false, 'Error removing new user for not authenticates user');
      } catch (error) {
        // inspector('Error reading message for not authenticates user.error:', error.message);
        assert.ok(error.message === 'Not authenticated', 'Error reading new user for not authenticates user');
      }
    });

    it('#9: Error removing new user for authenticates user (Guest)', async () => {
      try {
        // Login
        await loginLocal(appRestClient, guestFakeUser.email, guestFakeUser.password);
        const service = app.service('users');
        await service.remove(newUserId);
        // inspector('Error reading new user for not authenticates user user::', user);
        assert.ok(false, 'Error removing new user for not authenticates user');
      } catch (error) {
        // Logout
        await appRestClient.logout();
        assert.ok(error.message === 'Not authenticated', 'Error reading new user for not authenticates user');
      }
    });
    */
  });
});
