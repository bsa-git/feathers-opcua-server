/* eslint-disable no-unused-vars */
const assert = require('assert');
const storeItems = require('../../../src/services/opcua-values/hooks/store-items');

const {
  inspector,
  appRoot,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize
} = require('../../../src/plugins');

const app = require(`${appRoot}/src/app`);
const debug = require('debug')('app:store-items.unit.test');

const isDebug = false;

// Get generated fake data
const fakes = fakeNormalize();
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

  it('#3: Test "store-items" hook', async () => {
    // Get store tag 
    const storeTag = opcuaTags.find(t => !!t.store);
    if (isDebug && storeTag) inspector('Test "store-items" hook.storeTag:', storeTag);
    if (storeTag) {
      const browseName = storeTag.browseName;
      // Find group store tags
      const storeTags = opcuaTags.filter(t => t.ownerGroup === browseName);
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
          values: [
            {
              key: '2022-01-03',
              value: storeTagValue
            }
          ]
        };
        // Run "storeItems" hook  
        await storeItems()(contextBefore);
        if (isDebug && contextBefore.data) inspector('Get contextBefore.data:', contextBefore);
        const length1 = contextBefore.data.values.length;
        const length2 = storeValue.values.length;
        assert.ok(length1 > length2, `length1 must be greater than length2  - (${length1}) > (${length2})`);
      }
    }
  });
});
