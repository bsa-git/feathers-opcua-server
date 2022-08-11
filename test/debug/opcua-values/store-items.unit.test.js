/* eslint-disable no-unused-vars */
const assert = require('assert');
const loOmit = require('lodash/omit');
const storeItems = require('../../../src/services/opcua-values/hooks/store-items');

const {
  inspector,
  appRoot,
  logger,
  cloneObject,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize,
  getStorePeriod,
  objectHash
} = require('../../../src/plugins');

const app = require(`${appRoot}/src/app`);
const debug = require('debug')('app:store-items.unit.test');

const isDebug = false;

// Get generated fake data
const fakes = cloneObject(fakeNormalize());
const opcuaTags = fakes['opcuaTags'];
const opcuaValues = fakes['opcuaValues'];

describe('Test opcua-values/hooks/store-items.unit.test.js', () => {

  // eslint-disable-next-line no-unused-vars
  let contextBefore, contextAfterPaginated,
    // eslint-disable-next-line no-unused-vars
    contextAfter, contextAfterMultiple;

  beforeEach(() => {
    contextBefore = {
      type: 'before',
      params: { provider: 'socketio' },
      data: {

      }
    };

    contextAfter = {
      type: 'after',
      params: { provider: 'socketio' },
      result: {

      }
    };

    contextAfterMultiple = {
      type: 'after',
      params: { provider: 'socketio' },
      result: [

      ]
    };

    contextAfterPaginated = {
      type: 'after',
      method: 'find',
      params: { provider: 'socketio' },
      result: {
        data: [

        ]
      }
    };
    contextAfterPaginated.result.total = contextAfterPaginated.result.data.length;
  });

  it('#1: Save fake data to services', async () => {
    let errPath = checkServicesRegistered(app, 'opcua-tags');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);

    errPath = checkServicesRegistered(app, 'opcua-values');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);

    errPath = await saveFakesToServices(app, 'opcuaTags');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);

    errPath = await saveFakesToServices(app, 'opcuaValues');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });


  it('#2: Hook exists', () => {
    assert(typeof storeItems === 'function', 'Hook is not a function.');
  });

  it('#3: Test "store-items" hook. Add new item.', async () => {
    // Get store tag 
    const groupTag = opcuaTags.find(t => !!t.store && t.group);
    if (isDebug && groupTag) inspector('Test "store-items" hook.groupTag:', groupTag);
    if (groupTag) {
      const groupBrowseName = groupTag.browseName;
      // Find group store tags
      const storeTags = opcuaTags.filter(t => t.ownerGroup === groupBrowseName);
      if (isDebug && storeTags.length) inspector('Test "store-items" hook.storeTags:', storeTags);
      for (let index = 0; index < storeTags.length; index++) {
        const storeTag = storeTags[index];
        const idField = 'id' in storeTag ? 'id' : '_id';
        const tagId = storeTag[idField];
        const unitsRange = storeTag.valueParams.engineeringUnitsRange;
        const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
        // Get store value 
        const storeValue = opcuaValues.find(v => (v.tagId === storeTag[idField]) && (v.storeStart !== undefined));
        if (isDebug && storeValue) inspector('Test "store-items" hook.storeValue:', storeValue);
        // Set contextBefore properties 
        const service = app.service('opcua-values');
        contextBefore.app = app;
        contextBefore.path = 'opcua-values';
        contextBefore.method = 'patch';
        contextBefore.service = service;
        contextBefore.id = storeValue[idField];
        contextBefore.data = {
          tagId,
          tagName: storeTag.browseName,
          storeStart: '2022-01-03',
          storeEnd: '2022-01-03',
          opcuaData: [
            {
              key: '2022-01-03',
              value: storeTagValue
            }
          ]
        };
        // Run "storeItems" hook  
        await storeItems()(contextBefore);
        if (isDebug && contextBefore.data) inspector('Get contextBefore.data:', loOmit(contextBefore, ['app', 'service']));
        const length1 = contextBefore.data.opcuaData.length;
        const length2 = storeValue.opcuaData.length;
        assert.ok(length1 > length2, `Test "store-items" hook. Add new item. Length1 must be greater than length2  - (${length1}) > (${length2})`);
      }
    } else {
      assert(false, 'Test "store-items" hook. Add new item.');
    }
  });

  it('#4: Test "store-items" hook. Update existing item.', async () => {
    // Get store tag 
    const groupTag = opcuaTags.find(t => !!t.store && t.group);
    if (isDebug && groupTag) inspector('Test "store-items" hook.groupTag:', groupTag);
    if (groupTag) {
      const groupBrowseName = groupTag.browseName;
      // Find group store tags
      const storeTags = opcuaTags.filter(t => t.ownerGroup === groupBrowseName);
      if (isDebug && storeTags.length) inspector('Test "store-items" hook.storeTags:', storeTags);
      for (let index = 0; index < storeTags.length; index++) {
        const storeTag = storeTags[index];
        const idField = 'id' in storeTag ? 'id' : '_id';
        const tagId = storeTag[idField];
        const unitsRange = storeTag.valueParams.engineeringUnitsRange;
        const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
        // Get store value 
        const storeOpcuaValue = opcuaValues.find(v => (v.tagId === storeTag[idField]) && (v.storeStart !== undefined));
        if (isDebug && storeOpcuaValue) inspector('Test "store-items" hook.storeValue:', storeOpcuaValue);
        const storeLastValue = storeOpcuaValue.opcuaData[0];
        // Set contextBefore properties 
        const service = app.service('opcua-values');
        contextBefore.app = app;
        contextBefore.path = 'opcua-values';
        contextBefore.method = 'patch';
        contextBefore.service = service;
        contextBefore.id = storeOpcuaValue[idField];
        contextBefore.data = {
          tagId,
          tagName: storeTag.browseName,
          storeStart: storeLastValue.key,
          storeEnd: storeLastValue.key,
          opcuaData: [
            {
              key: storeLastValue.key,
              value: storeTagValue
            }
          ]
        };
        // Run "storeItems" hook  
        await storeItems()(contextBefore);
        if (isDebug && contextBefore.data) inspector('Get contextBefore.data:', loOmit(contextBefore, ['app', 'service']));
        const length1 = contextBefore.data.opcuaData.length;
        const length2 = storeOpcuaValue.opcuaData.length;
        const contextBeforeValue = contextBefore.data.opcuaData[0].value;
        const storeOpcuaLastValue = storeOpcuaValue.opcuaData[0].value;
        assert.ok(length1 === length2 && contextBeforeValue !== storeOpcuaLastValue, `Test "store-items" hook. Update existing item. Length1 must be greater than length2  - (${length1}) > (${length2})`);
      }
    } else {
      assert(false, 'Test "store-items" hook. Update existing item.');
    }
  });

  it('#5: Test "store-items.patch" hook. Remove existing item.', async () => {
    // Get store tag 
    const groupTag = opcuaTags.find(t => !!t.store && t.group);
    if (isDebug && groupTag) inspector('Test "store-items" hook.groupTag:', groupTag);
    if (groupTag) {
      const groupBrowseName = groupTag.browseName;
      // Find group store tags
      const storeTags = opcuaTags.filter(t => t.ownerGroup === groupBrowseName);
      if (isDebug && storeTags.length) inspector('Test "store-items" hook.storeTags:', storeTags);
      for (let index = 0; index < storeTags.length; index++) {
        const storeTag = storeTags[index];
        const idField = 'id' in storeTag ? 'id' : '_id';
        const tagId = storeTag[idField];
        const unitsRange = storeTag.valueParams.engineeringUnitsRange;
        const storeTagValue = (unitsRange.high - unitsRange.low) / 2;
        // Get store value 
        const storeOpcuaValue = opcuaValues.find(v => (v.tagId === storeTag[idField]) && (v.storeStart !== undefined));
        if (isDebug && storeOpcuaValue) inspector('Test "store-items" hook.storeValue:', storeOpcuaValue);
        const storeLastValue = storeOpcuaValue.opcuaData[0];
        // Set contextBefore properties 
        const service = app.service('opcua-values');
        contextBefore.app = app;
        contextBefore.path = 'opcua-values';
        contextBefore.method = 'patch';
        contextBefore.service = service;
        contextBefore.id = storeOpcuaValue[idField];
        contextBefore.data = {
          tagId,
          tagName: storeTag.browseName,
          storeStart: storeLastValue.key,
          storeEnd: storeLastValue.key,
          opcuaData: [
            {
              key: storeLastValue.key,
              value: storeTagValue,
              params: { action: 'remove' }
            }
          ]
        };
        // Run "storeItems" hook  
        await storeItems()(contextBefore);
        if (isDebug && contextBefore.data) inspector('Get contextBefore.data:', loOmit(contextBefore, ['app', 'service']));
        const length1 = contextBefore.data.opcuaData.length;
        const length2 = storeOpcuaValue.opcuaData.length;
        const contextBeforeValue = contextBefore.data.opcuaData[0].value;
        const storeOpcuaLastValue = storeOpcuaValue.opcuaData[0].value;
        assert.ok(length1 < length2, `Test "store-items.patch" hook. Remove existing item. Length2 must be greater than length1  - (${length1}) < (${length2})`);
      }
    } else {
      assert(false, 'Test "store-items" hook. Update existing item.');
    }
  });

  it('#6: Set contextBefore.tagId while creating record for \'opcua-values\' service', async () => {

    // Save 'opcuaTags' and 'opcuaValues' to DB
    await saveFakesToServices(app, 'opcuaTags');
    await saveFakesToServices(app, 'opcuaValues');

    // Get opcuaTag
    const groupTag = fakes['opcuaTags'].find(t => t.browseName === 'CH_M51::ValueFromFile');
    const storeTag = fakes['opcuaTags'].find(t => t.ownerGroup === groupTag.browseName);
    const idField = 'id' in groupTag ? 'id' : '_id';
    const tagId = storeTag[idField];

    const service = app.service('opcua-values');
    contextBefore.app = app;
    contextBefore.path = 'opcua-values';
    contextBefore.method = 'create';
    contextBefore.service = service;
    contextBefore.data = {
      tagName: storeTag.browseName,
      opcuaData: [
        {
          key: storeTag.browseName,
          value: 123
        }
      ]
    };
    await storeItems()(contextBefore);
    if (true && contextBefore) debug('Set contextBefore.tagId while creating record for \'opcua-values\' service.contextBefore:', contextBefore.data);
    assert.ok(contextBefore.data.tagId === tagId, 'Protection did not work to write the data to service');
  });

  it('#7: Set contextBefore.store and contextBefore.opcuaData[0].hash while creating record for \'opcua-values\' service', async () => {
    // Get opcuaTag
    const groupTag = fakes['opcuaTags'].find(t => t.browseName === 'CH_M51::ValueFromFile');
    const storeTag = fakes['opcuaTags'].find(t => t.ownerGroup === groupTag.browseName);
    const idField = 'id' in storeTag ? 'id' : '_id';
    const tagId = storeTag[idField];

    const service = app.service('opcua-values');
    contextBefore.app = app;
    contextBefore.path = 'opcua-values';
    contextBefore.method = 'create';
    contextBefore.service = service;
    contextBefore.data = {
      tagName: storeTag.browseName,
      storeStart: '2022-01-01',
      opcuaData: [
        {
          key: '2022-01-01',
          value: 123
        }
      ]
    };

    const period = await getStorePeriod(app, tagId, contextBefore.data.storeStart);
    const periodHash = objectHash(period);
    const valueHash = objectHash(contextBefore.data.opcuaData[0].value);
    const storeHash = objectHash([valueHash]);
    await storeItems()(contextBefore);
    if (isDebug && contextBefore) inspector(
      'Set contextBefore.store and contextBefore.opcuaData[0].hash while creating record for \'opcua-values\' service.contextBefore:',
      contextBefore.data
    );
    assert.ok(contextBefore.data.store.count === 1, 'Protection did not work to write the data to service');
    assert.ok(objectHash(contextBefore.data.store.period) === periodHash, 'Protection did not work to write the data to service');
    assert.ok(contextBefore.data.store.hash === storeHash, 'Protection did not work to write the data to service');
    assert.ok(contextBefore.data.opcuaData[0].hash === valueHash, 'Protection did not work to write the data to service');
  });

  it('#8: Set ERROR contextBefore.opcuaData[0].hash while creating record for \'opcua-values\' service', async () => {
    // Get opcuaTag
    const groupTag = fakes['opcuaTags'].find(t => t.browseName === 'CH_M51::ValueFromFile');
    const storeTag = fakes['opcuaTags'].find(t => t.ownerGroup === groupTag.browseName);

    const service = app.service('opcua-values');
    contextBefore.app = app;
    contextBefore.path = 'opcua-values';
    contextBefore.method = 'create';
    contextBefore.service = service;
    contextBefore.data = {
      tagName: storeTag.browseName,
      storeStart: '2022-01-01',
      opcuaData: [
        {
          key: '2022-01-01',
          value: 123,
          hash: '7d37103e1c4d22de8f7b4096b4be8c2ddf_error'
        }
      ]
    };
    if (isDebug && contextBefore) inspector(
      'Set ERROR contextBefore.opcuaData[0].hash while creating record for \'opcua-values\' service.contextBefore:',
      contextBefore.data
    );
    try {
      await storeItems()(contextBefore);
      assert.ok(false, 'Protection did not work to write the data to service');
    } catch (error) {
      logger.error(error.message);
      assert.ok(true, 'Protection did not work to write the data to service');
    }
  });

  it('#9: Set ERROR contextBefore.store.hash while creating record for \'opcua-values\' service', async () => {
    // Get opcuaTag
    const groupTag = fakes['opcuaTags'].find(t => t.browseName === 'CH_M51::ValueFromFile');
    const storeTag = fakes['opcuaTags'].find(t => t.ownerGroup === groupTag.browseName);

    const service = app.service('opcua-values');
    contextBefore.app = app;
    contextBefore.path = 'opcua-values';
    contextBefore.method = 'create';
    contextBefore.service = service;
    contextBefore.data = {
      tagName: storeTag.browseName,
      storeStart: '2022-01-01',
      store: {
        count: 1,
        period: ['2022-01-01T00:00:00', '2022-01-03T23:59:59'],
        hash: 'e6123520ffc6e6b9962b3f1934926a0d55_error'
      },
      opcuaData: [
        {
          key: '2022-01-01',
          value: 123,
          hash: '7d37103e1c4d22de8f7b4096b4be8c2ddfa4caa0'
        }
      ]
    };
    if (isDebug && contextBefore) inspector(
      'Set ERROR contextBefore.store.hash while creating record for \'opcua-values\' service.contextBefore:',
      contextBefore.data
    );
    try {
      await storeItems()(contextBefore);
      assert.ok(false, 'Protection did not work to write the data to service');
    } catch (error) {
      logger.error(error.message);
      assert.ok(true, 'Protection did not work to write the data to service');
    }
  });

  it('#10: Set ERROR contextBefore.store.period while creating record for \'opcua-values\' service', async () => {
    // Get opcuaTag
    const groupTag = fakes['opcuaTags'].find(t => t.browseName === 'CH_M51::ValueFromFile');
    const storeTag = fakes['opcuaTags'].find(t => t.ownerGroup === groupTag.browseName);

    const service = app.service('opcua-values');
    contextBefore.app = app;
    contextBefore.path = 'opcua-values';
    contextBefore.method = 'create';
    contextBefore.service = service;
    contextBefore.data = {
      tagName: storeTag.browseName,
      storeStart: '2022-01-01',
      store: {
        count: 1,
        period: ['2022-01-01T00:00:00', '2022-01-01T00:00:00'],// ERROR
        hash: 'e6123520ffc6e6b9962b3f1934926a0d554cc28d'
      },
      opcuaData: [
        {
          key: '2022-01-01',
          value: 123,
          hash: '7d37103e1c4d22de8f7b4096b4be8c2ddfa4caa0'
        }
      ]
    };
    if (isDebug && contextBefore) inspector(
      'Set ERROR contextBefore.store.period while creating record for \'opcua-values\' service.contextBefore:',
      contextBefore.data
    );
    try {
      await storeItems()(contextBefore);
      assert.ok(false, 'Protection did not work to write the data to service');
    } catch (error) {
      logger.error(error.message);
      assert.ok(true, 'Protection did not work to write the data to service');
    }
  });
});
