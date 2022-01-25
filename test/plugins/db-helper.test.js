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
  dbNullIdValue,
  getIdField,
  integrityCheckOpcua,
  getCountItems,
  createItem,
  createItems,
  findItem,
  findItems,
  handleFoundItems,
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

  it('#2: Save tags and find tags', async () => {

    // Get opcua tags 
    const opcuaTags = fakes['opcuaTags'];
    if (isLog) inspector('fakes.opcuaTags.length', opcuaTags.length);

    if (!opcuaTags.length) return;

    // Remove data from 'opcua-tags' services 
    const countItems = await getCountItems(app, 'opcua-tags');
    if (countItems) {
      const removedItems = await removeItems(app, 'opcua-tags');
      if (isLog) inspector('removeItems.removedItems.length', removedItems.length);
      assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');
    }

    // Add tags
    await createItems(app, 'opcua-tags', opcuaTags);

    // Find one tag
    const findedItem = await findItem(app, 'opcua-tags');
    if (isLog) inspector('findItem.findedItem', findedItem);
    assert.ok(opcuaTags.find(tag => tag.browseName === findedItem.browseName), 'Error for test: `Save tags and find tag`');

    // Find all tags
    const findedItems = await findItems(app, 'opcua-tags');
    if (isLog) inspector('Find tags from \'opcua-tags\' service', findedItems);
    assert.ok(findedItems.length === opcuaTags.length, 'Error for test: `Save tags and find tags`');
  });

  it('#3: Save fake data to \'opcua-tags\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaTags');
    const service = app.service('opcua-tags');
    const data = await service.find({});
    if (isLog) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#4: Save fake data to \'opcua-values\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaValues');
    const service = app.service('opcua-values');
    const data = await service.find({});
    if (isLog) inspector('Save fake data to \'opcua-values\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#5: Test handle found values', async () => {

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

    // Handle fake data from `opcua-values`
    const processedData = await handleFoundItems(app, 'opcua-values', { tagName: 'CH_M51::ValueFromFile' }, cb);
    if (isLog) inspector('Handle values from \'opcua-values\' service', processedData);
    // inspector('Handle values from \'opcua-values\' service', processedData);
    assert.ok(processedData.length, 'Error for test: `Handle found values`');
  });

  it('#6: Test integrity check opcua', async () => {
    let createdItem, findedItem;
    //-------------------------------------------------
    // Remove 'object' tags that have no child tags
    createdItem = await createItem(app, 'opcua-tags', {
      browseName: 'NoChildTags',
      displayName: 'Any display name',
      type: 'object'
    });
    if (createdItem) {
      await integrityCheckOpcua(app);
      findedItem = await findItem(app, 'opcua-tags', { browseName: createdItem['browseName'] });
      assert.ok(!findedItem, 'Error for test: `Remove \'object\' tags that have no child tags`');
    }

    // Remove 'variables' tags that have no owner tags
    createdItem = await createItem(app, 'opcua-tags', {
      browseName: 'AnyBrowseName',
      displayName: 'Any display name',
      type: 'variable.simple',
      ownerName: 'NoOwnerName'
    });
    if (createdItem) {
      await integrityCheckOpcua(app);
      findedItem = await findItem(app, 'opcua-tags', { browseName: createdItem['browseName'] });
      assert.ok(!findedItem, 'Error for test: `Remove \'variables\' tags that have no owner tags`');
    }

    // Remove 'ownerGroup' tags that have no 'childGroup' tags
    createdItem = await createItem(app, 'opcua-tags', {
      browseName: 'NoChildGroup',
      displayName: 'Any display name',
      type: 'variable.simple',
      ownerName: 'CH_M51'
    });
    if (createdItem) {
      await integrityCheckOpcua(app);
      findedItem = await findItem(app, 'opcua-tags', { browseName: createdItem['browseName'] });
      assert.ok(!findedItem, 'Error for test: `Remove \'ownerGroup\' tags that have no \'childGroup\' tags`');
    }

    // Remove 'childGroup' tags that have no 'ownerGroup' tags
    createdItem = await createItem(app, 'opcua-tags', {
      browseName: 'AnyBrowseName',
      displayName: 'Any display name',
      type: 'variable.simple',
      ownerName: 'CH_M51',
      ownerGroup: 'NoOwnerGroup'
    });
    if (createdItem) {
      await integrityCheckOpcua(app);
      findedItem = await findItem(app, 'opcua-tags', { browseName: createdItem['browseName'] });
      assert.ok(!findedItem, 'Error for test: `Remove \'childGroup\' tags that have no \'ownerGroup\' tags`');
    }

    // Remove opcua values that have no 'owner' tags
    createdItem = await createItem(app, 'opcua-values', {
      tagId: dbNullIdValue(),
      tagName: 'NoTagName',
      values: [
        {
          key: 'NoTagName',
          value: 6.123245
        }
      ]
    });
    if (createdItem) {
      const idField = getIdField(createdItem);
      const id = createdItem[idField];
      await integrityCheckOpcua(app);
      findedItem = await findItem(app, 'opcua-values', { [idField]: id });
      assert.ok(!findedItem, 'Error for test: `Remove opcua values that have no \'owner\' tags`');
    }
  });
});
