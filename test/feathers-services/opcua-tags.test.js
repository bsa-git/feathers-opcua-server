/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const {inspector, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== Opcua-Tags Service Test (opcua-tags.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'opcua-tags');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'opcua-tags\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaTags');
    const service = app.service('opcua-tags');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
