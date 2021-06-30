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

const isLog = false;
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

  it('#6: Customizing the Payload with Hook', () => {
    // Set context params
    contextBefore.params.authenticated = true;
    contextBefore.params.payload = {};
    contextBefore.path = 'users';
    contextBefore.method = 'create';

    const objRoles = AuthServer.getRoles();
    const roleNames = Object.keys(objRoles);
    roleNames.forEach(name => {
      contextBefore.params.payload.role = objRoles[name];
      authHook.payloadExtension(true)(contextBefore);
      if (isLog) inspector('Customizing the Payload with Hook.contextBefore:', contextBefore);
      if (isDebug) debug('Customizing the Payload with Hook.params.payload.role:', contextBefore.params.payload.role);
      assert(contextBefore.params.payload.role === objRoles[name], 'Customizing the Payload');
    });
  });

  it('#7: Check access to public services', async () => {
    try {
      const objServices = AuthServer.listServices(process.env.PUBLIC_SERVICES);
      const serviceNames = Object.keys(objServices);
      const name = serviceNames[0];
      const method = objServices[name][0];
      contextBefore.path = name;
      contextBefore.method = method;
      await authHook.authCheck(true)(contextBefore);
      if (isLog) inspector('Check access to public services.contextBefore:', contextBefore);
      if (isDebug) debug(`Check access to service method - "${contextBefore.path}.${contextBefore.method}"`);
      assert(true);
    }
    catch (ex) {
      console.error(chalk.red(ex.message));
      assert(false, 'The hook "authHook.authCheck()" generated an error of the wrong type.');
    }
  });

  it('#8: Error accessing services to not public services', async () => {
    try {
      const objServices = AuthServer.listServices(process.env.ADMIN_SERVICES);
      const serviceNames = Object.keys(objServices);
      const name = serviceNames[0];
      const method = objServices[name][0];
      contextBefore.path = name;
      contextBefore.method = method;
      if (isLog) inspector('Error accessing services to not public services.contextBefore:', contextBefore);
      if (isDebug) debug(`Check access to service method - "${contextBefore.path}.${contextBefore.method}"`);
      await authHook.authCheck(true)(contextBefore);
      assert(false, 'The hook "authHook.authCheck()" generated an error of the wrong type.');
    }
    catch (ex) {
      assert.strictEqual(ex.code, 403, 'unexpected error.code');
      assert.strictEqual(ex.message, `Access to the service method "${contextBefore.path}.${contextBefore.method}" is denied. Not enough rights`, 'unexpected error.message');
      assert.strictEqual(ex.name, 'Forbidden', 'unexpected error.name');
    }

  });

  it('#9: Check access to services for the administrator role', async () => {
    try {
      // Set context params
      contextBefore.params.authenticated = true;
      contextBefore.params.payload = {};
      contextBefore.params.payload.role = 'Administrator';

      const objServices = AuthServer.listServices(process.env.ADMIN_SERVICES);
      const serviceNames = Object.keys(objServices);
      const name = serviceNames[0];
      const method = objServices[name][0];
      contextBefore.path = name;
      contextBefore.method = method;
      await authHook.authCheck(true)(contextBefore);
      if (isLog) inspector('Check access to services for the administrator role.contextBefore:', contextBefore);
      if (isDebug) debug(`Check access to service method - "${contextBefore.path}.${contextBefore.method}"`);
      assert(true);
    }
    catch (ex) {
      console.error(chalk.red(ex.message));
      assert(false, 'The hook "authHook.authCheck()" generated an error of the wrong type.');
    }
  });

  it('#10: Error accessing services if the role is not an administrator', async () => {
    try {
      // Set context params
      contextBefore.params.authenticated = true;
      contextBefore.params.payload = {};
      contextBefore.params.payload.role = 'notAdministrator';

      const objServices = AuthServer.listServices(process.env.ADMIN_SERVICES);
      const serviceNames = Object.keys(objServices);
      const name = serviceNames[0];
      const method = objServices[name][0];
      contextBefore.path = name;
      contextBefore.method = method;
      if (isLog) inspector('Error accessing services if the role is not an administrator.contextBefore:', contextBefore);
      if (isDebug) debug(`Check access to service method - "${contextBefore.path}.${contextBefore.method}"`);
      await authHook.authCheck(true)(contextBefore);
      assert(false, 'The hook "authHook.authCheck()" generated an error of the wrong type.');
    }
    catch (ex) {
      assert.strictEqual(ex.code, 403, 'unexpected error.code');
      assert.strictEqual(ex.message, `Access to the service method "${contextBefore.path}.${contextBefore.method}" is denied. Not enough rights`, 'unexpected error.message');
      assert.strictEqual(ex.name, 'Forbidden', 'unexpected error.name');
    }
  });

  it('#11: Check auth for active user', async () => {
    try {
      const fakeUser = fakes['users'][0];
      const idField = HookHelper.getIdField(fakeUser);
      const payload = {userId: fakeUser[idField], role: 'Administrator'};

      contextAfter.app = app;
      contextAfter.path = 'authentication';
      contextAfter.method = 'create';
      contextAfter.params.payload = payload;

      await authHook.loginCheck(true)(contextAfter);
      if (isLog) inspector('Check auth for active user services.contextAfter:', contextAfter);
      if (isDebug) debug(`Check auth for active user method - "${contextAfter.path}.${contextAfter.method}"`);
      assert(true);
    }
    catch (ex) {
      console.error(chalk.red(ex.message));
      assert(false, 'The hook "authHook.loginCheck()" generated an error of the wrong type.');
    }
  });

  it('#12: Error check auth for not active user', async () => {
    try {
      const fakeUser = fakes['users'][0];
      const idField = HookHelper.getIdField(fakeUser);
      const payload = {userId: fakeUser[idField], role: 'Administrator'};

      // Set user.active = false
      const users = app.service('users');
      const pathUser = await users.patch(fakeUser[idField], {active: false});
      if (isLog) inspector('Error check auth for not active user::pathUser:', pathUser);

      contextAfter.app = app;
      contextAfter.path = 'authentication';
      contextAfter.method = 'create';
      contextAfter.params.payload = payload;

      if (isLog) inspector('Error check auth for not active user.contextAfter:', contextAfter);
      if (isDebug) debug(`Check access to service method - "${contextAfter.path}.${contextAfter.method}"`);

      await authHook.loginCheck(true)(contextAfter);
      assert(false, 'The hook "authHook.loginCheck()" generated an error of the wrong type.');
    }
    catch (ex) {
      assert.strictEqual(ex.code, 403, 'unexpected error.code');
      assert.strictEqual(ex.message, 'Access to the login is denied because your account is not activated. Contact your administrator.');
      assert.strictEqual(ex.name, 'Forbidden', 'unexpected error.name');
    }
  });

  it('#13: Check of set user loginAt field', async () => {
    try {
      const fakeUser = fakes['users'][0];
      const idField = HookHelper.getIdField(fakeUser);
      const payload = {userId: fakeUser[idField], role: 'Administrator'};

      // Get user loginAt field
      const users = app.service('users');
      let user = await users.get(fakeUser[idField]);
      let loginAtBefore = user.loginAt;
      if (isDebug) debug('Check of set user loginAt field::loginAtBefore:', loginAtBefore);

      contextAfter.app = app;
      contextAfter.path = 'authentication';
      contextAfter.method = 'create';
      contextAfter.params.payload = payload;

      await authHook.setLoginAt(true)(contextAfter);

      user = await users.get(fakeUser[idField]);
      let loginAtAfter = user.loginAt;
      if (isDebug) debug('Check of set user loginAt field::loginAtAfter:', loginAtAfter);
      if (isDebug) debug(`Check of set user loginAt field method - "${contextAfter.path}.${contextAfter.method}"`);
      assert(loginAtAfter !== loginAtBefore);
    }
    catch (ex) {
      console.error(chalk.red(ex.message));
      assert(false, 'The hook "authHook.loginCheck()" generated an error of the wrong type.');
    }
  });
});
