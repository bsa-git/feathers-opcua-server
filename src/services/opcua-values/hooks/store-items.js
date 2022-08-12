/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const loConcat = require('lodash/concat');

const {
  inspector,
  HookHelper,
  sortByStringField,
  objectHash,
  getStorePeriod
} = require('../../../plugins');

const debug = require('debug')('app:hook.store-items');
const isDebug = false;

module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Add items
    const addItems = async record => {
      let values, valueHash = '', valueHashes = [], period;
      //-----------------------------------------------
      
      // Set tagId
      if (!record.tagId) {
        const servicePath = 'opcua-tags';
        const tags = await hh.findItems(servicePath, { browseName: record.tagName });
        if (tags.length) {
          const tag = tags[0];
          const idField = 'id' in tag ? 'id' : '_id';
          const tagId = tag[idField].toString();
          record.tagId = tagId;
        }
        if (isDebug && record) inspector('"hook."opcua-values.create.before".record:', record);
      }
      
      // Operation for "opcua-values" store data
      if (!record.storeStart) return;
      if (!record.opcuaData.length) return;

      if (isDebug && record) inspector('hook.store-items.addItems.record:', record);

      const contextId = hh.getContextId();
      if (contextId) {// Patch service

        // Get store value
        const storeValue = await hh.getItem('opcua-values', contextId);
        if (isDebug && storeValue) inspector('hook.store-items.addItems.storeValue:', storeValue);

        // Get keys from record.opcuaData
        const keys = record.opcuaData.map(v => v.key);

        // Get filter values from storeValue.opcuaData
        values = storeValue.opcuaData.filter(v => !keys.includes(v.key));

        for (let index = 0; index < record.opcuaData.length; index++) {
          const opcuaDataItem = record.opcuaData[index];
          // Set hash value
          if (opcuaDataItem.value !== undefined) {
            valueHash = objectHash(opcuaDataItem.value);
          } else {
            valueHash = objectHash(opcuaDataItem.values);
          }
          if (opcuaDataItem.hash && opcuaDataItem.hash !== valueHash) {
            throw new errors.BadRequest(`A "opcua-values" service have not a record with record.opcuaData#hash === ${valueHash}`);
          } else {
            if (!opcuaDataItem.hash) opcuaDataItem.hash = valueHash;
          }

          const isRemove = opcuaDataItem.params && opcuaDataItem.params.action === 'remove';
          if (!isRemove) {
            values = loConcat(values, [opcuaDataItem]);
          } else {
            if (isDebug && isRemove) console.log('hook.store-items.addItems.opcuaData.params:', record.opcuaData[0].params);
          }
        }

        // Ascending sort by string field 
        values = sortByStringField(values, 'key', true);
        if (isDebug && values.length) console.log('hook.store-items.addItems.values.length:', values.length);

        // Set range of stored values
        record.storeStart = values[0].key;
        record.storeEnd = values[values.length - 1].key;
        // Descending sort values by string field 'key'
        record.opcuaData = sortByStringField(values, 'key', false);

        // Set record.store.hash value
        valueHashes = record.opcuaData.map(v => v.hash);
        record.store = Object.assign(storeValue.store, { count: valueHashes.length, hash: objectHash(valueHashes) });
        if (isDebug && record) inspector('hook.store-items.addItems.UpdateRecord:', record);
      
      } else {// Create service

        // Set hash, record.store, record.store.count, record.store.period, record.store.hash
        for (let index = 0; index < record.opcuaData.length; index++) {
          const opcuaDataItem = record.opcuaData[index];
          let valueHash = '';
          if (opcuaDataItem.value !== undefined) {
            valueHash = objectHash(opcuaDataItem.value);
          } else {
            valueHash = objectHash(opcuaDataItem.values);
          }
          if (opcuaDataItem.hash && opcuaDataItem.hash !== valueHash) {
            throw new errors.BadRequest(`A "opcua-values" service have record.opcuaData#hash('${opcuaDataItem.hash}') !== '${valueHash}'`);
          } else {
            if (!opcuaDataItem.hash) opcuaDataItem.hash = valueHash;
            valueHashes.push(opcuaDataItem.hash);
          }
        }

        if (record.store && record.store.hash !== objectHash(valueHashes)) {
          throw new errors.BadRequest(`A "opcua-values" service have record.store.hash('${record.store.hash}') !== '${objectHash(valueHashes)}'`);
        } else {
          
          if (record.store && record.store.period) {
            period = await getStorePeriod(hh.app, record.tagId, record.storeStart);
            const periodHash = objectHash(period);
            if (objectHash(record.store.period) !== periodHash) {
              throw new errors.BadRequest(`A "opcua-values" service have record.store.period([${record.store.period}]) !== [${period}]`);
            }
          }
          
          if ((record.store && !record.store.period) || !record.store) {
            period = await getStorePeriod(hh.app, record.tagId, record.storeStart);
            if (!record.store) {
              record.store = { count: valueHashes.length, period, hash: objectHash(valueHashes) };
            } else {
              record.store.period = period;
            }
          }
        }
        if (isDebug && record) inspector('hook.opcua-values.create.before.record:', record);
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('opcua-values.patch', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
