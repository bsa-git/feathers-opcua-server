const assert = require('assert');
const app = require('../../src/app');
const debug = require('debug')('app:auth.unit.test');

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
});
