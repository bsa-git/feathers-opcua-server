/* eslint-disable no-unused-vars */
const assert = require('assert');
const { logger, inspector, clearCacheApp } = require('../../src/plugins');
const {
  localStorage,
  loginLocal,
  feathersClient,
  AuthServer
} = require('../../src/plugins/auth');

const {
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins/test-helpers');

const debug = require('debug')('app:authorization.test');

const isDebug = false;
const isTest = false;

// Get generated fake data
const fakes = fakeNormalize();
const fakeUsers = fakes['users'];
const adminFakeUser = fakeUsers[0];
const guestFakeUser = fakeUsers[1];
const idField = 'id' in adminFakeUser ? 'id' : '_id';


const newUser = {
  email: 'new-user@test.com',
  password: 'new-user',
  active: true
};

let newUserId = '';

describe('<<=== Authorization Tests (authorization.test.js) ===>>', () => {

  describe('<<--- Local strategy --->>', () => {
    let app, appClient, server;
    //----------------------------------------------

    before(function (done) {
      // Clear cache app
      app = clearCacheApp();
      const port = app.get('port') || 3030;
      const baseUrl =  process.env.BASE_URL;
      // const baseUrl = 'http://10.60.0.50:3131';
      // const baseUrl = 'http://localhost:3131';

      server = app.listen(port);
      server.once('listening', () => {
        setTimeout(async () => {
          await saveFakesToServices(app, 'roles');
          await saveFakesToServices(app, 'users');
          localStorage.clear();
          // Create feathers client for transport = 'rest'|'socketio'
          appClient = await feathersClient({ transport: 'rest', serverUrl: baseUrl });
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

    it('#1: Registered the authentication service', () => {
      assert.ok(appClient.service('authentication'));
    });

    it('#2: Create new user for not authenticates user', async () => {
      try {
        const service = appClient.service('users');
        const user = await service.create(newUser);
        newUserId = user[idField].toString();
        if (isDebug && user) inspector('Create new user for not authenticates user:', user);
        assert.ok(user, 'Create user for not authenticates user');
      } catch (error) {
        if (true && error) logger.error(`error.message: "${error.message}"`);
        assert.ok(false, 'Create user for not authenticates user');
      }
    });

    it('#3: Authenticates (appClient) and get user from `users` service', async () => {
      try {
        // Login
        const { accessToken } = await loginLocal(appClient, newUser.email, newUser.password);
        if (isDebug && accessToken) inspector('loginLocal.accessToken:', accessToken);
        assert.ok(accessToken, 'Created access token for newUser');
        const service = appClient.service('users');
        assert.ok(service, 'Get service for `users`');
        const payload = await AuthServer.verifyJWT(accessToken);
        if (isDebug && payload) inspector('AuthServer.verifyJWT.payload:', payload);
        const userId = payload.userId ? payload.userId :  payload.sub;
        assert.ok(userId === newUserId, 'Get userId from payload');
        const user = await service.get(userId);
        if (isDebug && user) inspector('Get user from `users` service.user:', user);
        assert.ok(user, 'Get user from `users` service');
        // Logout
        await appClient.logout();
      } catch (error) {
        if (true && error) logger.error(`error.message: "${error.message}"`);
        assert.ok(false, 'Authenticates (appClient) and get user from `users` service');
      }
    });
    /** 
    it('#4: Error while searching for a new user by not authenticated user', async () => {
      try {
        const service = appClient.service('users');
        await service.find({ query: { email: newUser.email } });
        assert.ok(false, 'Error while searching for a new user by not authenticated user');        
      } catch (error) {
        assert.ok(true, 'Error while searching for a new user by not authenticated user');
      }
    });

    it('#5: Error removing a new user for authenticates user (Guest)', async () => {
      try {
        // Login
        await loginLocal(appClient, guestFakeUser.email, guestFakeUser.password);
        const service = appClient.service('users');
        await service.remove(newUserId);
        assert.ok(false, 'Error removing new user for authenticates user (Guest)');
      } catch (error) {
        assert.ok(error.code === 403, 'Error removing new user for authenticates user (Guest)');
        assert.ok(error.name === 'Forbidden', 'Error removing new user for authenticates user (Guest)');
        assert.ok(error.message === 'You are not allowed to remove users', 'Error removing new user for authenticates user (Guest)');
        // Logout
        await appClient.logout();
      }
    });

    it('#6: Remove a new user for authenticates user (Administrator)', async () => {
      // Login
      await loginLocal(appClient, adminFakeUser.email, adminFakeUser.password);
      const service = appClient.service('users');
      const user = await service.remove(newUserId);
      assert.ok(user, 'Remove a new user for authenticates user (Administrator)');
      // Logout
      await appClient.logout();
    });
    */
  });
});
