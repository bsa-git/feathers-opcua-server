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
      if (!record.values.length) return;
      if (record.values.length > 1) {
        record.values = [record.values[0]];
      }
      if (isDebug && record) inspector('hook.store-items.addItems.record:', record);

      const contextId = hh.getContextId();
      if (contextId) {
        // Set hash value
        if (record.values[0].items && record.values[0].items.length) {
          valueHash = objectHash(record.values[0].items);
        } else {
          valueHash = objectHash(record.values[0].value);
        }
        if (record.values[0].hash && record.values[0].hash !== valueHash) {
          throw new Error(`A "opcua-values" service have not a record with record.values#value.hash === ${valueHash}`);
        } else {
          if (!record.values[0].hash) record.values[0].hash = valueHash;
        }

        // Get store value
        const storeValue = await hh.getItem('opcua-values', contextId);
        if (isDebug && storeValue) inspector('hook.store-items.addItems.storeValue:', storeValue);
        // Get storeStart 
        const storeStart = record.storeStart;
        // Get values
        values = storeValue.values.filter(v => v.key !== storeStart);
        // if record.values.items -> empty [] then -> not loConcat(values, record.values)
        
        // if(record.values.items && record.values.items.length > 0){
        //   values = loConcat(values, record.values);
        // } else {
        //   if (isDebug && record.values) console.log('hook.store-items.addItems.recordValues:', storeValue.values.length);
        // }

        values = loConcat(values, record.values);

        // Ascending sort by string field 
        values = sortByStringField(values, 'key', true);
        // Set range of stored values
        record.storeStart = values[0].key;
        record.storeEnd = values[values.length - 1].key;
        // Descending sort values by string field 'key'
        record.values = sortByStringField(values, 'key', false);

        // Set record.store.hash value
        const valueHashes = record.values.map(v => v.hash);
        record.store = { count: valueHashes.length, hash: objectHash(valueHashes) };
        if (isDebug && record) inspector('hook.store-items.addItems.UpdateRecord:', record);
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('opcua-values.patch', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
