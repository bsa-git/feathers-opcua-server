/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const {
  inspector,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins');

const {
  getOpcuaTags
} = require('../../src/plugins/opcua');

const {
  createItems,
  findItem,
  findItems,
  removeItems
} = require('../../src/plugins/db-helpers');

const {
  localStorage,
  loginLocal,
  feathersClient,
  AuthServer
} = require('../../src/plugins/auth');



// Get generated fake data
const fakes = fakeNormalize();

const debug = require('debug')('app:opcua-tags.test');

const isDebug = true;
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
    if (isLog) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
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
      if (isLog) inspector('Error on unique `browseName`.error', error.message);
      assert.ok(true, 'Error on unique `browseName`');
    }
  });

  it('#4: Save tags and find tags', async () => {

    // Get opcua tags 
    const opcuaTags = getOpcuaTags();
    if (isLog) inspector('Save tags to \'opcua-tags\' service', opcuaTags);

    if (!opcuaTags.length) return;

    // Remove data from 'opcua-tags' services 
    const removedItems = await removeItems(app, 'opcua-tags');
    assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');

    // Add tags
    const createdItems = await createItems(app, 'opcua-tags', opcuaTags);

    // Find one tag
    const findedItem = await findItem(app, 'opcua-tags');
    if (isLog) inspector('Find one tag from \'opcua-tags\' service', findedItem);
    assert.ok(findedItem.browseName === opcuaTags[0].browseName, 'Error for test: `Save tags and find tag`');
    // inspector('Find one tag from \'opcua-tags\' service', findedItem);

    // Find all tags
    const findedItems = await findItems(app, 'opcua-tags');
    if (isLog) inspector('Find tags from \'opcua-tags\' service', findedItems);
    assert.ok(findedItems.length === opcuaTags.length, 'Error for test: `Save tags and find tags`');
  });
});
