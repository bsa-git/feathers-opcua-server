/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const {inspector, HookHelper, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== Log-Messages Service Test (log-messages.test.js) ===>>', () => {

  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'log-messages');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'log-messages\' service', async () => {
    const errPath = await saveFakesToServices(app, 'logMessages');
    const service = app.service('log-messages');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'log-messages\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
