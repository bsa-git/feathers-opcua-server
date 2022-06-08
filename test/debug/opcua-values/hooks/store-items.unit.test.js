/* eslint-disable no-unused-vars */
const assert = require('assert');
const storeItems = require('../../../../src/services/opcua-values/hooks/store-items');

const {
  inspector,
  appRoot,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize
} = require('../../../../src/plugins');

const app = require(`${appRoot}/src/app`);
const debug = require('debug')('app:store-items.unit.test');

const isDebug = false;

// Get generated fake data
const fakes = fakeNormalize();

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

  describe('--- Save fake data to services ---', function () {
    it('#1: check registered "opcua-tags"  service', () => {
      const errPath = checkServicesRegistered(app, 'opcua-tags');
      assert.ok(errPath === '', `Service '${errPath}' not registered`);
    });

    it('#2: check registered "opcua-values"  service', () => {
      const errPath = checkServicesRegistered(app, 'opcua-values');
      assert.ok(errPath === '', `Service '${errPath}' not registered`);
    });

    it('#3: Save fakes to "opcua-tags" service', async () => {
      const errPath = await saveFakesToServices(app, 'opcuaTags');
      assert.ok(errPath === '', `Not save fakes to service - '${errPath}'`);
    });

    it('#4: Save fakes to "opcua-values" service', async () => {
      const errPath = await saveFakesToServices(app, 'opcuaValues');
      assert.ok(errPath === '', `Not save fakes to service - '${errPath}'`);
    });
  });

  describe('--- Run store-items.unit.test ---', function () {
    it('#5: Hook exists', () => {
      assert(typeof storeItems === 'function', 'Hook is not a function.');
    });

    it('#6: Test "store-items" hook', async () => {
      // Get opcuaTag
      const index = fakes['opcuaTags'].length - 1;
      const opcuaTag = fakes['opcuaTags'][index];
      const idField = 'id' in opcuaTag ? 'id' : '_id';
      const tagId = opcuaTag[idField];

      const service = app.service('opcua-values');
      contextBefore.app = app;
      contextBefore.path = 'opcua-values';
      contextBefore.method = 'patch';
      contextBefore.service = service;

      // Get opcuaValue
      const opcuaValues = fakes['opcuaValues'];
      const opcuaValue = opcuaValues.find(v => (v.tagId === tagId) && !!v.storeStart);
      if (isDebug && opcuaValue) inspector('hook.store-items.opcuaValue:', opcuaValue);

      contextBefore.id = opcuaValue[idField];
      contextBefore.data = {
        tagId,
        tagName: opcuaTag.browseName,
        storeStart: '2022-01-03',
        storeEnd: '2022-01-03',
        values: [
          {
            key: '2022-01-03',
            value: 5.555
          }
        ]
      };

      await storeItems()(contextBefore);
      if (isDebug && contextBefore.data) inspector('Get contextBefore.data:', contextBefore);
      assert.ok(contextBefore.data.values.length > opcuaValue.values.length, 'Protection did not work to write the data to service');
    });
  });
});
