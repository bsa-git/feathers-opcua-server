/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const loCloneDeep = require('lodash/cloneDeep');

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
  updateRemoteFromLocalStore,
  getCountItems,
  createItem,
  createItems,
  getItem,
  patchItem,
  findItem,
  findItems,
  handleFoundItems,
  removeItems
} = require('../../src/plugins/db-helpers');


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

    // Get generated fake data
    const fakes = loCloneDeep(fakeNormalize());
    // Get opcua tags 
    const opcuaTags = fakes['opcuaTags'];
    if (isDebug && opcuaTags.length) inspector('fakes.opcuaTags.length', opcuaTags.length);

    if (!opcuaTags.length) return;

    // Remove data from 'opcua-tags' services 
    const countItems = await getCountItems(app, 'opcua-tags');
    if (countItems) {
      const removedItems = await removeItems(app, 'opcua-tags');
      if (isDebug && removedItems.length) inspector('removeItems.removedItems.length', removedItems.length);
      assert.ok(removedItems.length === countItems, 'Not remove data from services \'opcua-tags\'');
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
    
    const fakes = loCloneDeep(fakeNormalize());
    // Get opcua tags 
    const opcuaTags = fakes['opcuaTags'];
    if (isDebug && opcuaTags.length) inspector('fakes.opcuaTags.length', opcuaTags.length);
    
    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    // Change opcuaTag store
    let newStore = [1, 'days'];
    opcuaTags.find(tag => tag.store)['store']['numberOfValuesInDoc'] = newStore;
    newStore = opcuaTags.find(tag => tag.store)['store'];
    if (isDebug && opcuaTags.length) inspector('Save store values when store parameter changes.opcuaTags:', opcuaTags.find(tag => tag.store));

    // Check store parameter changes
    const groupBrowseNames = await checkStoreParameterChanges(app, opcuaTags);
    if (isDebug && groupBrowseNames.length) inspector('Save store values when store parameter changes.groupBrowseNames:', groupBrowseNames);
    assert.ok(groupBrowseNames.length, `groupBrowseNames array must not be empty - '${groupBrowseNames.length}'`);
    
    // Save opcua tags to local test DB
    let saveOpcuaTagsResult = await saveOpcuaTags(app, opcuaTags, false);
    if (isDebug && saveOpcuaTagsResult) inspector('Save store values when store parameter changes.saveOpcuaTagsResult:', saveOpcuaTagsResult);
    assert.deepEqual(saveOpcuaTagsResult, { added: 0, updated: 1, deleted: 0, total: 4 }, 'Two objects, and their child objects, are equal');


    // Save store parameter changes
    const saveStoreResults = await saveStoreParameterChanges(app, groupBrowseNames, opcuaTags);
    if (isDebug && saveStoreResults.length) inspector('Save store values when store parameter changes.saveStoreResults:', saveStoreResults.length);
    
    // Get opcua values 
    const valuesFromDB = await findItems(app, 'opcua-values', { storeStart: { $ne: undefined } });
    if (isDebug && valuesFromDB.length) inspector('Save store values when store parameter changes.valuesFromDB:', valuesFromDB.length);
    
    assert.ok(valuesFromDB.length === 4, `valuesFromDB array must not be empty and is equal to (4) - '${valuesFromDB.length}'`);
  });

  it('#8: Save store values for test "store-items" hook', async () => {

    const fakes = loCloneDeep(fakeNormalize());
    // Get opcua values 
    const opcuaValues = fakes['opcuaValues'];
    if (isDebug && opcuaValues.length) inspector('fakes.opcuaValues.length', opcuaValues.length);

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    // Get group tag
    const groupTag = await findItem(app, 'opcua-tags', { group: { $ne: undefined }, store: { $ne: undefined } });
    if (isDebug && groupTag) inspector('Save store values for test "store-items" hook.storeTag:', groupTag);
    if (groupTag) {
      const browseName = groupTag.browseName;
      // Get store tags
      const storeTags = await findItems(app, 'opcua-tags', { ownerGroup: browseName });
      if (isDebug && storeTags.length) inspector('Save store values for test "store-items" hook.storeTags:', storeTags);
      for (let index = 0; index < storeTags.length; index++) {
        const storeTag = storeTags[index];
        const idField = getIdField(storeTag);
        let storeValue = await findItem(app, 'opcua-values', { tagId: storeTag[idField], storeStart: { $ne: undefined } });
        if (isDebug && storeValue) inspector('Save store values for test "store-items" hook.storeValue:', storeValue);

        const unitsRange = storeTag.valueParams.engineeringUnitsRange;
        const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
        const storeData = {
          tagId: storeValue.tagId.toString(),
          tagName: storeValue.tagName,
          storeStart: '2022-01-03',
          storeEnd: '2022-01-03',
          values: [
            {
              key: '2022-01-03',
              value: storeTagValue
            }
          ]
        };

        // Patch store value
        const id = storeValue[idField].toString();
        const patchValue = await patchItem(app, 'opcua-values', id, storeData);
        if (isDebug && storeValue) inspector('Save store values for test "store-items" hook.patchValue:', patchValue);

        // Get store value 
        storeValue = await getItem(app, 'opcua-values', id);
        if (isDebug && storeValue) inspector('Save store values for test "store-items" hook.storeValue:', storeValue);

        const opcuaValue = opcuaValues.find(v => v[idField] === id);

        const length1 = storeValue.values.length;
        const length2 = opcuaValue.values.length;
        assert.ok(length1 > length2, `length1 must be greater than length2  - (${length1}) > (${length2})`);
      }
    }
  });

  it('#9: Test update remote store from local store', async () => {

    const fakes = loCloneDeep(fakeNormalize());
    // Get opcua values 
    const opcuaValues = fakes['opcuaValues'];
    if (isDebug && opcuaValues.length) inspector('fakes.opcuaValues.length', opcuaValues.length);

    // Get opcua tags 
    const opcuaTags = fakes['opcuaTags'];
    if (isDebug && opcuaTags.length) inspector('fakes.opcuaTags.length', opcuaTags.length);

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    // Get group tag
    const groupTag = await findItem(app, 'opcua-tags', { group: { $ne: undefined }, store: { $ne: undefined } });
    if (isDebug && groupTag) inspector('Test update remote store from local store.groupTag:', groupTag);
    if (groupTag) {
      const browseName = groupTag.browseName;
      // Get store tags
      const storeTags = await findItems(app, 'opcua-tags', { ownerGroup: browseName });
      if (isDebug && storeTags.length) inspector('Test update remote store from local store.storeTags:', storeTags);
      
      // Update remote store from local store
      for (let index = 0; index < storeTags.length; index++) {
        const storeTag = storeTags[index];
        const idField = getIdField(storeTag);
        let storeValue = await findItem(app, 'opcua-values', { tagName: storeTag.browseName, storeStart: { $ne: undefined } });
        if (isDebug && storeValue) inspector('Test update remote store from local store.storeValue:', storeValue);

        const unitsRange = storeTag.valueParams.engineeringUnitsRange;
        const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
        const storeData = {
          tagId: storeValue.tagId.toString(),
          tagName: storeValue.tagName,
          storeStart: '2022-01-03',
          storeEnd: '2022-01-03',
          values: [
            {
              key: '2022-01-03',
              value: storeTagValue
            }
          ]
        };

        // Patch store value
        const id = storeValue[idField].toString();
        const patchValue = await patchItem(app, 'opcua-values', id, storeData);
        if (isDebug && storeValue) inspector('Test update remote store from local store.patchValue:', patchValue);

        // Get store value 
        storeValue = await getItem(app, 'opcua-values', id);
        if (isDebug && storeValue) inspector('Test update remote store from local store.storeValue:', storeValue);

        const opcuaValue = opcuaValues.find(v => (v.tagName === storeTag.browseName) && (v.storeStart !== undefined));
        if (isDebug && opcuaValue) inspector('Test update remote store from local store.opcuaValue:', opcuaValue);
        
        const length1 = storeValue.values.length;
        const length2 = opcuaValue.values.length;
        assert.ok(length1 > length2, `length1 must be greater than length2  - (${length1}) > (${length2})`);

        // Update remote store from local store
        const results = await updateRemoteFromLocalStore(app, app, opcuaTags);
        if (isDebug && results.length) inspector('Test update remote store from local store.results:', results);
        assert.ok(results.length, 'Results length must be greater than 0');
      }
    }
  });
});
