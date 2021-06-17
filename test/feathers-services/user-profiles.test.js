const assert = require('assert');
const app = require('../../src/app');
const {inspector, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== User-Profiles Service Test (user-profiles.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'user-profiles');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'user-profiles\' service', async () => {
    const errPath = await saveFakesToServices(app, 'userProfiles');
    const service = app.service('user-profiles');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'user-profiles\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
