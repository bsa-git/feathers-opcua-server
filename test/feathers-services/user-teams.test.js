const assert = require('assert');
const app = require('../../src/app');
const {checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

describe('<<=== User-Teams Service Test (user-teams.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'user-teams');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'user-teams\' service', async () => {
    const errPath = await saveFakesToServices(app, 'userTeams');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });
});
