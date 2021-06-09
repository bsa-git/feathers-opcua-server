const assert = require('assert');
const app = require('../../src/app');
const {checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

describe('<<=== Teams Service Test (teams.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'teams');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'teams\' service', async () => {
    const errPath = await saveFakesToServices(app, 'teams');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });
});
