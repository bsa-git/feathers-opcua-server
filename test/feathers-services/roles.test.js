const assert = require('assert');
const app = require('../../src/app');
const {inspector, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== Roles Service Test (roles.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'roles');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'roles\' service', async () => {
    const errPath = await saveFakesToServices(app, 'roles');
    const service = app.service('roles');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'roles\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
