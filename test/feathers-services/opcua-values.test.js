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
  });

  it('#3: Find fake data from \'opcua-values\' service', async () => {
    const service = app.service('opcua-values');
    const findResults = await service.find({});
    if(isDebug && findResults) inspector('Find fake data from \'opcua-values\' service.data[0]', findResults.data);
    assert.ok(findResults.data.length > 0, 'Find fake data from \'opcua-values\' service');
  });

  it('#4: Run service mixin \'getStoreSources4Data\'', async () => {
    const service = app.service('opcua-values');
    const mixinResults = await service.getStoreSources4Data();
    if(true && mixinResults.length) inspector('Run service mixin \'getStoreSources4Data\'.mixinResults', mixinResults);
    assert.ok(mixinResults.length, 'Run service mixin \'getStoreSources4Data\'');
  });
});
