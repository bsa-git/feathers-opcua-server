/* eslint-disable no-unused-vars */
const loConcat = require('lodash/concat');

const { 
  inspector,
  HookHelper,
  sortByStringField 
} = require('../../../plugins');

const debug = require('debug')('app:hook.store-items');
const isDebug = false;

module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Add items
    const addItems = async record => {
      let values;
      //----------------------
      
      if(!record.storeStart) return;
      if (!record.values.length > 1) return;
      if(isDebug && record) inspector('hook.store-items.addItems.record:', record);
      
      const contextId = hh.getContextId();
      if (contextId) {
        // Get store value
        const storeValue = await hh.getItem('opcua-values', contextId);
        if(isDebug && storeValue) inspector('hook.store-items.addItems.storeValue:', storeValue);
        // Get storeStart 
        const storeStart = record.storeStart;
        // Get values
        values = storeValue.values.filter(v => v.key !== storeStart);
        values = loConcat(values, record.values);
        values = sortByStringField(values, 'key', true);
        // Set range of stored values
        record.storeStart = values[0].key;
        record.storeEnd = values[values.length - 1].key;
        record.values = sortByStringField(values, 'key', false);
        if(isDebug && record) inspector('hook.store-items.addItems.UpdateRecord:', record);
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('opcua-values.patch', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
