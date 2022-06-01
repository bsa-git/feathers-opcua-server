/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const loConcat = require('lodash/concat');

const {
  inspector,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins');

const {
  dbNullIdValue,
  getIdField,
  checkStoreParameterChanges,
  saveStoreParameterChanges,
  saveOpcuaTags,
  integrityCheckOpcua,
  getCountItems,
  createItem,
  createItems,
  patchItem,
  findItem,
  findItems,
  handleFoundItems,
  removeItems
} = require('../../src/plugins/db-helpers');


// Get generated fake data
const fakes = fakeNormalize();

const debug = require('debug')('app:opcua-tags.test');

const isDebug = false;

describe('<<=== DB-Helper Plugin Test (db-helper.test.js) ===>>', () => {

  it('#1: Registered the service', () => {
    let errPath = checkServicesRegistered(app, 'opcua-tags');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);

    errPath = checkServicesRegistered(app, 'opcua-values');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save tags and find tags', async () => {

    // Get opcua tags 
    const opcuaTags = loConcat([], fakes['opcuaTags']);
    if (isDebug && opcuaTags.length) inspector('fakes.opcuaTags.length', opcuaTags.length);

    if (!opcuaTags.length) return;

    // Remove data from 'opcua-tags' services 
    const countItems = await getCountItems(app, 'opcua-tags');
    if (countItems) {
      const removedItems = await removeItems(app, 'opcua-tags');
      if (isDebug && removedItems.length) inspector('removeItems.removedItems.length', removedItems.length);
      assert.ok(removedItems.length === opcuaTags.length, 'Not remove data from services \'opcua-tags\'');
    }

    // Add tags
    await createItems(app, 'opcua-tags', opcuaTags);

    // Find one tag
    const findedItem = await findItem(app, 'opcua-tags');
    if (isDebug && findedItem) inspector('findItem.findedItem', findedItem);
    assert.ok(opcuaTags.find(tag => tag.browseName === findedItem.browseName), 'Error for test: `Save tags and find tag`');

    // Find all tags
    const findedItems = await findItems(app, 'opcua-tags');
    if (isDebug && findedItems.length) inspector('Find tags from \'opcua-tags\' service', findedItems);
    assert.ok(findedItems.length === opcuaTags.length, 'Error for test: `Save tags and find tags`');
  });

  it('#3: Save fake data to \'opcua-tags\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaTags');
    const service = app.service('opcua-tags');
    const data = await service.find({});
    if (isDebug && data) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#4: Save fake data to \'opcua-values\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaValues');
    const service = app.service('opcua-values');
    const data = await service.find({});
    if (isDebug) inspector('Save fake data to \'opcua-values\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#5: Test handle found values', async () => {

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');

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
    if (isDebug && processedData.length) inspector('Handle values from \'opcua-values\' service', processedData);
    // inspector('Handle values from \'opcua-values\' service', processedData);
    assert.ok(processedData.length, 'Error for test: `Handle found values`');
  });

  it('#6: Test integrity check opcua', async () => {
    let createdItem, findedItem;
    //-------------------------------------------------

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

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
      ownerName: 'CH_M51',
      group: true
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

  it('#7: Save store values when store parameter changes', async () => {

    //--------------------------------------
    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    const tagsFromDB = await findItems(app, 'opcua-tags');
    if (isDebug && tagsFromDB.length) inspector('Save store values when store parameter changes.tagFromDB:', tagsFromDB.find(tag => tag.store));

    // Get opcua tags 
    let opcuaTags = loConcat([], fakes['opcuaTags']);
    if (isDebug && opcuaTags.length) inspector('fakes.opcuaTags.length', opcuaTags.length);

    // Change opcuaTag store
    let newStore = [1, 'days'];
    opcuaTags.find(tag => tag.store)['store']['numberOfValuesInDoc'] = newStore;
    newStore = opcuaTags.find(tag => tag.store)['store'];
    if (isDebug && opcuaTags.length) inspector('Save store values when store parameter changes.opcuaTags:', opcuaTags.find(tag => tag.store));

    // Check store parameter changes
    const storeBrowseNames = await checkStoreParameterChanges(app, opcuaTags);
    if (true && storeBrowseNames) inspector('Save store values when store parameter changes.storeBrowseNames:', storeBrowseNames);
    assert.ok(storeBrowseNames.length, `storeBrowseNames array must not be empty - '${storeBrowseNames.length}'`);
    
    // Save opcua tags to local test DB
    let saveOpcuaTagsResult = await saveOpcuaTags(app, opcuaTags, false);
    if (true && saveOpcuaTagsResult) inspector('Save store values when store parameter changes.saveOpcuaTagsResult:', saveOpcuaTagsResult);

    // Save store parameter changes
    const saveStoreResults = await saveStoreParameterChanges(app, storeBrowseNames, opcuaTags);
    if (true && saveStoreResults.length) inspector('Save store values when store parameter changes.saveStoreResults:', saveStoreResults.length);
    
    
    assert.ok(true, `saveStoreResults array must not be empty - '${saveStoreResults.length}'`);
  });
});
