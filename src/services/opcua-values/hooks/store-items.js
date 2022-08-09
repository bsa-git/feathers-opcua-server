/* eslint-disable no-unused-vars */
const loConcat = require('lodash/concat');

const {
  inspector,
  HookHelper,
  sortByStringField,
  objectHash
} = require('../../../plugins');

const debug = require('debug')('app:hook.store-items');
const isDebug = false;

module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Add items
    const addItems = async record => {
      let values, valueHash = '';
      //-----------------------------------------------
      if (!record.storeStart) return;
      if (!record.opcuaData.length) return;
      if (record.opcuaData.length > 1) {
        record.opcuaData = [record.opcuaData[0]];
      }
      if (isDebug && record) inspector('hook.store-items.addItems.record:', record);

      const contextId = hh.getContextId();
      if (contextId) {
        // Set hash value
        if (record.opcuaData[0].value !== undefined) {
          valueHash = objectHash(record.opcuaData[0].value);
        } else {
          valueHash = objectHash(record.opcuaData[0].values);          
        }
        if (record.opcuaData[0].hash && record.opcuaData[0].hash !== valueHash) {
          throw new Error(`A "opcua-values" service have not a record with record.values#value.hash === ${valueHash}`);
        } else {
          if (!record.opcuaData[0].hash) record.opcuaData[0].hash = valueHash;
        }

        // Get store value
        const storeValue = await hh.getItem('opcua-values', contextId);
        if (isDebug && storeValue) inspector('hook.store-items.addItems.storeValue:', storeValue);
        // Get storeStart 
        const storeStart = record.storeStart;
        // Get values
        values = storeValue.opcuaData.filter(v => v.key !== storeStart);
        const isRemove = record.opcuaData[0].params && record.opcuaData[0].params.action === 'remove';
        if(!isRemove){
          values = loConcat(values, record.opcuaData);
        } else {
          if (isDebug && isRemove) console.log('hook.store-items.addItems.opcuaData.params:', record.opcuaData[0].params);
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
        const valueHashes = record.opcuaData.map(v => v.hash);
        record.store = Object.assign(storeValue.store, { count: valueHashes.length, hash: objectHash(valueHashes) });
        if (isDebug && record) inspector('hook.store-items.addItems.UpdateRecord:', record);
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('opcua-values.patch', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
