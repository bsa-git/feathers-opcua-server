const assert = require('assert');
const app = require('../../src/app');
const {inspector, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== User-Teams Service Test (user-teams.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'user-teams');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'user-teams\' service', async () => {
    const errPath = await saveFakesToServices(app, 'userTeams');
    const service = app.service('user-teams');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'user-teams\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
