/* eslint-disable no-unused-vars */
const assert = require('assert');
const {
  appRoot, 
  inspector, 
} = require('../../src/plugins/lib');
const {
  HookHelper, 
} = require('../../src/plugins/hook-helpers');
const {
  AuthServer, 
} = require('../../src/plugins/auth');
const {
  saveFakesToServices,
  fakeNormalize
} = require('../../src/plugins/test-helpers');

const authHook = require(`${appRoot}/src/hooks/auth`);
const chalk = require('chalk');
const app = require(`${appRoot}/src/app`);
const debug = require('debug')('app:auth.unit.test');

const isDebug = false;
const isTest = true;

// Get generated fake data
const fakes = fakeNormalize();

describe('<<=== Auth Hook Test (auth.unit.test.js) ===>>', () => {

  if (!isTest) {
    debug('<<< Test /hooks/auth.unit.test.js - NOT >>>');
    return;
  }

  // eslint-disable-next-line no-unused-vars
  let contextBefore, contextAfterPaginated,
    // eslint-disable-next-line no-unused-vars
    contextAfter, contextAfterMultiple;

  beforeEach(() => {
    contextBefore = {
      type: 'before',
      params: {
        provider: 'socketio',
      },
      data: {}
    };

    contextAfter = {
      type: 'after',
      params: {provider: 'socketio'},
      result: {}
    };

    contextAfterMultiple = {
      type: 'after',
      params: {provider: 'socketio'},
      result: []
    };

    contextAfterPaginated = {
      type: 'after',
      method: 'find',
      params: {provider: 'socketio'},
      result: {
        data: []
      }
    };
    contextAfterPaginated.result.total = contextAfterPaginated.result.data.length;
  });

  it('#1: authHook.authCheck hook exists', () => {
    assert(typeof authHook.authCheck() === 'function', 'authHook.authCheck hook is not a function.');
  });

  it('#2: authHook.loginCheck hook exists', () => {
    assert(typeof authHook.loginCheck() === 'function', 'authHook.loginCheck hook is not a function.');
  });

  it('#3: authHook.setLoginAt hook exists', () => {
    assert(typeof authHook.setLoginAt() === 'function', 'authHook.setLoginAt hook is not a function.');
  });

  it('#4: auth.payloadExtension hook exists', () => {
    assert(typeof authHook.payloadExtension() === 'function', 'auth.payloadExtension hook is not a function.');
  });

  it('#5: Save fake data to \'users\' service', async () => {
    const errPath = await saveFakesToServices(app, 'users');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });

  it('#6: Customizing the Payload with Hook', async () => {

    const fakeUser = fakes['users'][0];
    const idField = HookHelper.getIdField(fakeUser);
    const userId = fakeUser[idField];
    // Set context params
    contextBefore.app = app;
    contextBefore.params.authenticated = true;
    contextBefore.params.user = fakeUser;
    contextBefore.params.payload = {};
    contextBefore.path = 'roles';
    contextBefore.method = 'create';

    await authHook.payloadExtension(true)(contextBefore);
    if(isDebug && contextBefore.params.payload) inspector('Customizing the Payload with Hook.contextBefore:', contextBefore.params.payload);
    const isCheckPayload = contextBefore.params.payload.role && (contextBefore.params.payload.userId === userId);
    assert(isCheckPayload, 'Customizing the Payload');
  });

  it('#7: Check of set user loginAt field -> setLoginAt()', async () => {
    try {
      const fakeUser = fakes['users'][0];
      const idField = HookHelper.getIdField(fakeUser);
      const payload = {userId: fakeUser[idField], role: 'Administrator'};

      // Get user loginAt field
      const users = app.service('users');
      let user = await users.get(fakeUser[idField]);
      let loginAtBefore = user.loginAt;
      if (isDebug && loginAtBefore) debug('Check of set user loginAt field::loginAtBefore:', loginAtBefore);

      contextAfter.app = app;
      contextAfter.path = 'authentication';
      contextAfter.method = 'create';
      contextAfter.params.payload = payload;

      await authHook.setLoginAt(true)(contextAfter);

      user = await users.get(fakeUser[idField]);
      let loginAtAfter = user.loginAt;
      if (isDebug && loginAtAfter) debug('Check of set user loginAt field::loginAtAfter:', loginAtAfter);
      if (isDebug && contextAfter) debug(`Check of set user loginAt field method - "${contextAfter.path}.${contextAfter.method}"`);
      assert(loginAtAfter !== loginAtBefore);
    }
    catch (ex) {
      console.error(chalk.red(ex.message));
      assert(false, 'The hook "authHook.setLoginAt()" generated an error of the wrong type.');
    }
  });

  it('#8: Check of set user active field -> loginCheck()', async () => {
    try {
      const fakeUser = fakes['users'][0];
      const idField = HookHelper.getIdField(fakeUser);
      const userId = fakeUser[idField];
      const payload = {userId: fakeUser[idField], role: 'Administrator'};

      // Get user loginAt field
      const service = app.service('users');
      let user = await service.get(userId);
      let active = user.active;
      if (isDebug && user) debug('Check of set user active field:user:', user);

      contextAfter.app = app;
      contextAfter.path = 'authentication';
      contextAfter.method = 'create';
      contextAfter.params.payload = payload;

      // Run loginCheck hook
      await authHook.loginCheck(true)(contextAfter);
      assert(active, 'Check of set user active field for "true"');

      user = await service.patch(userId, { active: false });
      active = user.active;
      if (isDebug && user) debug('Check of set user active field:user:', user);
      try {
        // Run loginCheck hook
        await authHook.loginCheck(true)(contextAfter);  
        assert(active, 'Check of set user active field for "false"');
      } catch (error) {
        assert(true, 'Check of set user active field for "false"');
      }
      
    } catch (ex) {
      console.error(chalk.red(ex.message));
      assert(false, 'The hook "authHook.loginCheck()" generated an error of the wrong type.');
    }
  });
  
});
