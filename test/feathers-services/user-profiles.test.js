const assert = require('assert');
const app = require('../../src/app');
const {checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

describe('<<=== User-Profiles Service Test (user-profiles.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'user-profiles');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'user-profiles\' service', async () => {
    const errPath = await saveFakesToServices(app, 'userProfiles');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });
});
