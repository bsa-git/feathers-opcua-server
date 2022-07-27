/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  inspector,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins');


// Get generated fake data
const fakes = fakeNormalize();

const debug = require('debug')('app:opcua-tags.test');
const isDebug = true;

describe('<<=== Opcua-Tags Service Test (opcua-tags.test.js) ===>>', () => {
  
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'opcua-tags');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'opcua-tags\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaTags');
    const service = app.service('opcua-tags');
    const data = await service.find({});
    if (isDebug) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#3: Error on unique `browseName`', async () => {
    let fake;
    try {
      fake = fakes['opcuaTags'][0];
      const service = app.service('opcua-tags');
      await service.create({
        'browseName': fake.browseName,
        'displayName': fake.displayName,
        'type': fake.type
      });
      assert.ok(false, 'Error on unique `browseName`');
    } catch (error) {
      if (isDebug) inspector('Error on unique `browseName`.error', error.message);
      assert.ok(true, 'Error on unique `browseName`');
    }
  });
});
