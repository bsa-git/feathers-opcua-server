/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const {
  inspector, 
  checkServicesRegistered, 
  saveFakesToServices
} = require('../../src/plugins');

const isDebug = false;


describe('<<=== Opcua-Values Service Test (opcua-values.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'opcua-values');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'opcua-values\' service', async () => {
    let errPath = await saveFakesToServices(app, 'opcuaTags');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
    errPath = await saveFakesToServices(app, 'opcuaValues');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
    const service = app.service('opcua-values');
    const findResults = await service.find({});
    if(isDebug && findResults) inspector('Save fake data to \'opcua-values\' service.data[0]', findResults.data);
    assert.ok(findResults.data.length > 0, 'Save fake data to \'opcua-values\' service');
  });
});
