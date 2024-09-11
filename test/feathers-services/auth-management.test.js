const assert = require('assert');
const app = require('../../src/app');
const debug = require('debug')('app:auth.unit.test');
const isDebug = false;

const isTest = true;

describe('<<< Test /services/auth-management.test.js >>>', () => {

  if (!isTest) {
    debug('<<< Test /services/auth-management.test.js >>> - NOT >>>');
    return;
  }

  it('Registered the "auth-management" service', () => {
    const service = app.service('auth-management');
    assert.ok(service, 'Registered the service');
  });

  it('auth-management.get service', async () => {
    let result;
    //--------------------------------------
    const service = app.service('auth-management');
    result = await service.get('authManagementID');
    if (isDebug && result) debug('service.get.result:', result);
    assert.ok(result, 'service.get.result:', result);
  });
});
