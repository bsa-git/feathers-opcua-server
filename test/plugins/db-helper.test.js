/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const loCloneDeep = require('lodash/cloneDeep');
const loSize = require('lodash/size');

const {
  inspector,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins');

const {
  getOpcuaConfigOptions,
} = require('../../src/plugins/opcua/opcua-helper');

const {
  dbNullIdValue,
  getIdField,
  checkStoreParameterChanges,
  saveStoreParameterChanges,
  saveOpcuaTags,
  removeOpcuaGroupValues,
  removeOpcuaStoreValues,
  integrityCheckOpcua,
  updateRemoteFromLocalStore,
  getStoreParams4Data,
  getOpcuaTagValuesFromStores,
  getStoresFromOpcuaTagValues,
  getCountItems,
  createItem,
  createItems,
  getItem,
  patchItem,
  findItem,
  findItems,
  handleFoundItems,
  removeItems,
  saveStoreOpcuaGroupValues,
  syncReportAtStartup,
  syncHistoryAtStartup
} = require('../../src/plugins/db-helpers');


const debug = require('debug')('app:db-helper.test');
const isDebug = false;

// Get test ID
const id = 'ua-cherkassy-azot_test2';

describe('<<=== DB-Helper Plugin Test (db-helper.test.js) ===>>', () => {

  it('#1: DB-Helper -> Registered the service', () => {
    let errPath = checkServicesRegistered(app, 'opcua-tags');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);

    errPath = checkServicesRegistered(app, 'opcua-values');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: DB-Helper -> Save tags and find tags', async () => {

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

  it('#3: DB-Helper -> Save fake data to \'opcua-tags\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaTags');
    const service = app.service('opcua-tags');
    const data = await service.find({});
    if (isDebug && data) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#4: DB-Helper -> Save fake data to \'opcua-values\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaValues');
    const service = app.service('opcua-values');
    const data = await service.find({});
    if (isDebug) inspector('Save fake data to \'opcua-values\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data.data.length, `Not save fakes to services - '${errPath}'`);
  });

  it('#5: DB-Helper -> Test handle found values', async () => {

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');

    const cb = function (data) {
      const result = {};
      //-----------------------
      if (data.length && data[0].opcuaData.length) {
        const values = data[0].opcuaData;
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

  it('#6: DB-Helper -> Test integrity check opcua', async () => {
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
      opcuaData: [
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

  it('#7: DB-Helper -> Save store values when store parameter changes', async () => {

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
    const valuesFromDB = await findItems(app, 'opcua-values', { storeStart: { $gt: '' } });
    if (isDebug && valuesFromDB.length) inspector('Save store values when store parameter changes.valuesFromDB:', valuesFromDB.length);

    assert.ok(valuesFromDB.length === 4, `valuesFromDB array must not be empty and is equal to (4) - '${valuesFromDB.length}'`);
  });

  it('#8.1: DB-Helper -> Save store values for test "store-items" hook', async () => {

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
        let storeValue = await findItem(app, 'opcua-values', { tagId: storeTag[idField], storeStart: { $gt: '' } });
        if (isDebug && storeValue) inspector('Save store values for test "store-items" hook.storeValue:', storeValue);

        const unitsRange = storeTag.valueParams.engineeringUnitsRange;
        const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
        const storeData = {
          tagId: storeValue.tagId.toString(),
          tagName: storeValue.tagName,
          storeStart: '2022-01-03',
          storeEnd: '2022-01-03',
          opcuaData: [
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

        const length1 = storeValue.opcuaData.length;
        const length2 = opcuaValue.opcuaData.length;
        assert.ok(length1 > length2, `length1 must be greater than length2  - (${length1}) > (${length2})`);
      }
    }
  });

  it('#8.2: DB-Helper -> Get stores from opcua tag values', async () => {

    const fakes = loCloneDeep(fakeNormalize());
    // Get opcua values 
    const opcuaTags = fakes['opcuaTags'];
    if (isDebug && opcuaTags.length) inspector('fakes.opcuaTags.length', opcuaTags.length);

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    // Get group tag
    const groupTag = await findItem(app, 'opcua-tags', { group: true, store: { $ne: undefined } });
    if (isDebug && groupTag) inspector('Get stores from opcua tag values.storeTag:', groupTag);
    if (groupTag) {
      const groupBrowseName = groupTag.browseName;
      // Get store tags
      const storeTags = await findItems(app, 'opcua-tags', { ownerGroup: groupBrowseName });
      if (isDebug && storeTags.length) inspector('Get stores from opcua tag values.storeTags:', storeTags);
      if (storeTags.length) {
        // Get opcua tag values from store 
        const opcuaTagValues = await getOpcuaTagValuesFromStores(app, storeTags.map(t => t.browseName));
        if (isDebug && opcuaTagValues.length) inspector('Get stores from opcua tag values.opcuaTagValues:', opcuaTagValues);
        // Get store items from opcua tag values
        let storeItems = getStoresFromOpcuaTagValues(opcuaTags, opcuaTagValues);
        if (isDebug && storeItems) inspector('Get stores from opcua tag values.storeItems:', storeItems);
        let length1 = loSize(storeItems);
        let length2 = storeTags.length;
        assert.ok(length1 === length2, `length1 must be equal to length2  - (${length1}) === (${length2})`);

        // Get new opcua tag value 
        const opcuaTagValue = { ['!value']: { dateTime: '2022-01-04' } };
        for (let index = 0; index < storeTags.length; index++) {
          const storeTag = storeTags[index];
          const storeBrowseName = storeTag.browseName;
          const unitsRange = storeTag.valueParams.engineeringUnitsRange;
          const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
          opcuaTagValue[storeBrowseName] = storeTagValue;
        }

        // Get store items from opcua tag values
        opcuaTagValues.push(opcuaTagValue);
        storeItems = getStoresFromOpcuaTagValues(opcuaTags, opcuaTagValues);
        if (isDebug && storeItems) inspector('Get stores from opcua tag values.storeItems:', storeItems);
        length1 = storeItems[Object.keys(storeItems)[0]].length;
        assert.ok(length1 === 2, `length1 must be equal to 2  - (${length1}) === 2`);
      }
    }
  });

  it('#9: DB-Helper -> Test update remote store from local store', async () => {

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
        let storeValue = await findItem(app, 'opcua-values', { tagName: storeTag.browseName, storeStart: { $gt: '' } });
        if (isDebug && storeValue) inspector('Test update remote store from local store.storeValue:', storeValue);

        const unitsRange = storeTag.valueParams.engineeringUnitsRange;
        const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
        const storeData = {
          tagId: storeValue.tagId.toString(),
          tagName: storeValue.tagName,
          storeStart: '2022-01-03',
          storeEnd: '2022-01-03',
          opcuaData: [
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

        const length1 = storeValue.opcuaData.length;
        const length2 = opcuaValue.opcuaData.length;
        assert.ok(length1 > length2, `length1 must be greater than length2  - (${length1}) > (${length2})`);

        // Update remote store from local store
        const results = await updateRemoteFromLocalStore(app, app, opcuaTags);
        assert.ok(!results, 'Results length must be equals 0');
      }
    }
  });

  it('#10: DB-Helper -> Get store params for data', async () => {

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    // Get store sources for data
    const storeParams = await getStoreParams4Data(app, ['CH_M51::ValueFromFile']);
    if (isDebug && storeParams.length) inspector('Get store params for data.storeParams:', storeParams);

    assert.ok(storeParams.length, 'Get store params for data');
  });

  it('#11: Data base: Save opcua tags', async () => {
    // Get opcua tags 
    const opcuaTags = getOpcuaConfigOptions(id);
    // Save opcua tags to local DB
    let saveResult = await saveOpcuaTags(app, opcuaTags, false);
    if (isDebug && saveResult) inspector('Data base: Save opcua tags:', saveResult);
    assert.ok(saveResult.total, 'Data base: Save opcua tags');

    // Remove opcua store values
    let removeResult = await removeOpcuaGroupValues(app);
    if (isDebug && removeResult) inspector('removeOpcuaGroupValues.removeResult:', removeResult);
    // Remove opcua store values
    removeResult = await removeOpcuaStoreValues(app);
    if (isDebug && removeResult) inspector('removeOpcuaStoreValues.removeResult:', removeResult);
  });
  
  it('#12: DB-Helper -> Run method "syncHistoryAtStartup" for sync history at startup', async () => {
    // Get opcua tags
    const opcuaTags = getOpcuaConfigOptions(id);
    const syncResult = await syncHistoryAtStartup(app, opcuaTags, 'methodAcmDayReportsDataGet');
    if (isDebug && syncResult) debug(`Run method "syncHistoryAtStartup".syncResult: {"saved": ${syncResult.savedValuesCount}, "removed": ${syncResult.removedValuesCount}}`);
    assert.ok(syncResult.savedValuesCount, 'OPC-UA clients: run method "syncHistoryAtStartup"');
  });

  it('#13: DB-Helper -> Run method "syncReportAtStartup" for sync report at startup', async () => {
    // Get opcua tags
    const opcuaTags = getOpcuaConfigOptions(id);
    const syncResult = await syncReportAtStartup(app, opcuaTags, 'methodAcmYearReportUpdate');
    if (isDebug && syncResult) debug('Run method "syncReportAtStartup".syncResult:', syncResult);
    assert.ok(syncResult.length, 'OPC-UA clients: run method "syncReportAtStartup"');
  });

  it('#14: DB-Helper -> Save store opcua group values', async () => {

    const fakes = loCloneDeep(fakeNormalize());
    // Get opcua values 
    const opcuaTags = fakes['opcuaTags'];
    if (isDebug && opcuaTags.length) inspector('fakes.opcuaTags.length', opcuaTags.length);

    // Save fakes to services
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    // Get group tag
    const groupTag = await findItem(app, 'opcua-tags', { group: true, store: { $ne: undefined } });
    if (isDebug && groupTag) inspector('Save store opcua group values.storeTag:', groupTag);
    if (groupTag) {
      const groupBrowseName = groupTag.browseName;
      // Get store tags
      const storeTags = await findItems(app, 'opcua-tags', { ownerGroup: groupBrowseName });
      if (isDebug && storeTags.length) inspector('Save store opcua group values.storeTags:', storeTags);
      if (storeTags.length) {
        // Get opcua tag values from store 
        const opcuaTagValues = await getOpcuaTagValuesFromStores(app, storeTags.map(t => t.browseName));
        if (isDebug && opcuaTagValues.length) inspector('Save store opcua group values.opcuaTagValues:', opcuaTagValues);
        
        // Get new opcua tag value 
        const opcuaTagValue = { ['!value']: { dateTime: '2022-01-04' } };
        for (let index = 0; index < storeTags.length; index++) {
          const storeTag = storeTags[index];
          const storeBrowseName = storeTag.browseName;
          const unitsRange = storeTag.valueParams.engineeringUnitsRange;
          const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
          opcuaTagValue[storeBrowseName] = storeTagValue;
        }

        // Get store items from opcua tag values
        opcuaTagValues.push(opcuaTagValue);
        const savedValues = await saveStoreOpcuaGroupValues(app, groupBrowseName, opcuaTagValues);
        if (isDebug && savedValues) inspector('Save store opcua group values.savedValues:', savedValues);
        const length1 = savedValues.length;
        assert.ok(length1, `length1 must be equal to 2  - (${length1}) === 2`);
      }
    }
  });
});
