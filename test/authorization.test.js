/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../src/app');
const port = app.get('port');
const { inspector, } = require('../src/plugins/lib');
const { localStorage, loginLocal, feathersClient } = require('../src/plugins/auth');
const {
  saveFakesToServices,
  fakeNormalize,
} = require('../src/plugins/test-helpers');

const debug = require('debug')('app:authorization.test');

const isDebug = false;
const isLog = true;
const isTest = false;

// Get generated fake data
const fakes = fakeNormalize();
const fakeUsers = fakes['users'];
const adminFakeUser = fakeUsers[0];
const guestFakeUser = fakeUsers[1];
const idField = 'id' in adminFakeUser ? 'id' : '_id';


const newUser = {
  email: 'new-user@test.com',
  password: 'new-user'
};

const newMessage = {
  text: 'New message!'
};

let newUserId = '';


const baseUrl = process.env.BASE_URL;

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

    
    it('#2: Create new user for not authenticates user', async () => {
      const params = { provider: 'rest' };
      const service = app.service('users');
      const user = await service.create(newUser, params);
      newUserId = user[idField].toString();
      assert.ok(user, 'Create user for not authenticates user');
    });

    it('#3: Error while searching for a new user by not authenticated user', async () => {
      try {
        const provider = 'rest';
        const service = app.service('users');
        await service.find({ query: { email: newUser.email }, provider });
        assert.ok(false, 'Error while searching for a new user by not authenticated user');        
      } catch (error) {
        assert.ok(error.message === 'Not authenticated', 'Error while searching for a new user by not authenticated user');
      }
    });

    it('#4: Error removing a new user for authenticates user (Guest)', async () => {
      try {
        // Login
        await loginLocal(appRestClient, guestFakeUser.email, guestFakeUser.password);
        const service = appRestClient.service('users');
        await service.remove(newUserId);
        // inspector('Error reading new user for not authenticates user user::', user);
        assert.ok(false, 'Error removing new user for authenticates user (Guest)');
      } catch (error) {
        assert.ok(error.code === 403, 'Error removing new user for authenticates user (Guest)');
        assert.ok(error.name === 'Forbidden', 'Error removing new user for authenticates user (Guest)');
        assert.ok(error.message === 'You are not allowed to remove users', 'Error removing new user for authenticates user (Guest)');
        // Logout
        await appRestClient.logout();
      }
    });

    it('#5: Remove a new user for authenticates user (Administrator)', async () => {
      // Login
      await loginLocal(appRestClient, adminFakeUser.email, adminFakeUser.password);
      const service = appRestClient.service('users');
      const user = await service.remove(newUserId);
      assert.ok(user, 'Remove a new user for authenticates user (Administrator)');
      // Logout
      await appRestClient.logout();
    });
  });
});
