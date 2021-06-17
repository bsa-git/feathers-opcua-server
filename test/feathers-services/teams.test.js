const assert = require('assert');
const app = require('../../src/app');
const {inspector, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== Teams Service Test (teams.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'teams');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'teams\' service', async () => {
    const errPath = await saveFakesToServices(app, 'teams');
    const service = app.service('teams');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'teams\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
