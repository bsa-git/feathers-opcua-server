/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
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
  processFoundItems,
  removeItems
} = require('../../src/plugins/db-helpers');


// Get generated fake data
const fakes = fakeNormalize();

const debug = require('debug')('app:opcua-tags.test');

const isDebug = false;
const isLog = false;

describe('<<=== DB-Helper Plugin Test (db-helper.test.js) ===>>', () => {
  
  it('#1: Registered the service', () => {
    let errPath = checkServicesRegistered(app, 'opcua-tags');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);

    errPath = checkServicesRegistered(app, 'opcua-values');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'opcua-tags\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaTags');
    const service = app.service('opcua-tags');
    const data = await service.find({});
    if (isLog) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#3: Save fake data to \'opcua-values\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaValues');
    const service = app.service('opcua-values');
    const data = await service.find({});
    if (isLog) inspector('Save fake data to \'opcua-values\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#4: Process found values', async () => {

    const cb = function (data) {
      const result = {};
      //-----------------------
      if (data.length && data[0].values.length) {
        const values = data[0].values;
        values.forEach(value => {
          result[value.key] = value.value;
        });
      }
      return result;
    };

    // const values = fakes['opcuaValues'][0].values;

    // Process fake data from `opcua-values`
    const processedData = await processFoundItems(app, 'opcua-values', { tagName: 'CH_M51::ValueFromFile' }, cb);
    if (isLog) inspector('Process values from \'opcua-values\' service', processedData);
    // inspector('Process values from \'opcua-values\' service', processedData);
    assert.ok(processedData.length, 'Error for test: `Process found values`');
  });

  it('#5: Save tags and find tags', async () => {

    // Get opcua tags 
    const opcuaTags = getOpcuaTags();
    if (isLog) inspector('Save tags to \'opcua-tags\' service', opcuaTags);

    if (!opcuaTags.length) return;

    // Remove data from 'opcua-tags' services 
    const removedItems = await removeItems(app, 'opcua-tags');
    assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');

    // Add tags
    await createItems(app, 'opcua-tags', opcuaTags);

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
