/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port');
const {  inspector, } = require('../../src/plugins/lib');
const { localStorage, loginLocal, feathersClient, AuthServer } = require('../../src/plugins/auth');
const {
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins/test-helpers');

const debug = require('debug')('app:authentication.test');

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
      server.close();
      setTimeout(() => { 
        if (isDebug) debug('Done after EndTest!');
        done(); 
      }, 500);
    });

    it('#2: Authenticates user and creates accessToken', async () => {
      const { user, accessToken } = await app.service('authentication').create({
        strategy: 'local',
        email: fakeUser.email, 
        password: fakeUser.password
      });
      assert.ok(accessToken, 'Created access token for user');
      assert.ok(user, 'Includes user in authentication data');
    });

    it('#4: Authenticates from rest client user and creates accessToken', async () => {
      const { accessToken } = await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');
    });

    
  });
});
