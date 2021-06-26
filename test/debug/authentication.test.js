/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port');
const { localStorage, loginLocal, feathersClient } = require('../../src/plugins/auth');
const {
  inspector,
  removeDataFromServices,
  fakeNormalize,
} = require('../../src/plugins');

const debug = require('debug')('app:authentication.test');

const isDebug = true;
const isLog = true;
const isTest = false;

// Get generated fake data
const fakes = fakeNormalize();
const usersRecs = fakes['users'];

const baseUrl = process.env.BASE_URL;
const baseUrl2 = 'http://localhost:3131';

describe('<<=== Authentication Tests (authentication.test.js) ===>>', () => {

  it('#1: Registered the authentication service', () => {
    assert.ok(app.service('authentication'));
  });

  describe('<<--- Local strategy --->>', () => {
    let appSocketioClient, appRestClient, server;
    //----------------------------------------------
    const userInfo = {
      email: 'authenticationTest@example.com',
      password: 'supersecret'
    };

    const userInfo2 = {
      email: 'authenticationTest2@example.com',
      password: 'supersecret',
      active: true
    };

    before(function (done) {
      // this.timeout(10000);
      server = app.listen(port);
      server.once('listening', () => {
        setTimeout(async () => {
          localStorage.clear();
          await removeDataFromServices(app, 'users');
          const newUser = await app.service('users').create(userInfo);
          if (isLog) inspector('newUser:', newUser);
          const newUser2 = await app.service('users').create(userInfo2);
          if (isLog) inspector('newUser2:', newUser2);
          appSocketioClient = feathersClient({ transport: 'socketio', serverUrl: baseUrl });
          appRestClient = feathersClient({ transport: 'rest', serverUrl: baseUrl });

          if (isDebug) debug('before Start!');

          done();
        }, 500);
      });
    });

    after(function (done) {
      // this.timeout(10000);
      server.close();
      setTimeout(() => { 
        
        if (isDebug) debug('after EndTest !');
        
        done(); 
      }, 500);
    });

    it('#2: Authenticates from server user and creates accessToken', async () => {
      const { user, accessToken } = await app.service('authentication').create({
        strategy: 'local',
        ...userInfo
      });
      assert.ok(accessToken, 'Created access token for user');
      assert.ok(user, 'Includes user in authentication data');
    });

    it('#4: Authenticates from rest client new user and creates accessToken', async () => {
      const { user, accessToken } = await loginLocal(appRestClient, userInfo2.email, userInfo2.password);
      assert.ok(accessToken, 'Created access token for user');
    });

    if (isTest) {
      it('#5: Authenticates from socketio client new user and creates accessToken', async () => {
        const { user, accessToken } = await loginLocal(appSocketioClient, userInfo2.email, userInfo2.password);
        assert.ok(accessToken, 'Created access token for user');
      });
    }
  });
});
