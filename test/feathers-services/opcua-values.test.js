/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const {
  inspector, 
  startListenPort,
  stopListenPort,
  checkServicesRegistered, 
  saveFakesToServices,
  fakeNormalize,
  cloneObject
} = require('../../src/plugins');

const debug = require('debug')('app:opcua-values.test');
const isDebug = false;

// Get generated fake data
const fakes = fakeNormalize();

describe('<<=== Opcua-Values Service Test (opcua-values.test.js) ===>>', () => {
  
  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });
  
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

  it('#4: Run service mixin \'getStoreParams4Data\'', async () => {
    const service = app.service('opcua-values');
    const mixinResults = await service.getStoreParams4Data(['CH_M51::ValueFromFile']);
    if(isDebug && mixinResults.length) inspector('Run service mixin \'getStoreParams4Data\'.mixinResults', mixinResults);
    assert.ok(mixinResults.length, 'Run service mixin \'getStoreParams4Data\'');
  });
});
