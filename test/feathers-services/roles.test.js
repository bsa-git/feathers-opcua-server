const assert = require('assert');
const app = require('../../src/app');
const {checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

describe('<<=== Roles Service Test (roles.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'roles');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'roles\' service', async () => {
    const errPath = await saveFakesToServices(app, 'roles');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });
});
