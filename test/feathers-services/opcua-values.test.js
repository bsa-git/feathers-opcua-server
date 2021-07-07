/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const {
  inspector, 
  appRoot, 
  readJsonFileSync, 
  checkServicesRegistered, 
  saveFakesToServices
} = require('../../src/plugins');

const isLog = false;


describe('<<=== Opcua-Values Service Test (opcua-values.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'opcua-values');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'opcua-values\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaValues');
    const service = app.service('opcua-values');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'opcua-values\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
