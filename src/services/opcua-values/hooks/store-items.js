/* eslint-disable no-unused-vars */
const loConcat = require('lodash/concat');

const { 
  inspector,
  HookHelper,
  sortByStringField 
} = require('../../../plugins');


module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Add items
    const addItems = async value => {
      let values;
      //----------------------
      
      if(!value.storeStart) return;
      
      const contextId = hh.getContextId();
      if (contextId) {
        // Get store value
        const storeValue = await hh.getItem('opcua-values', contextId);
        // Get storeStart 
        const storeStart = storeValue.storeStart;
        // Get values
        values = storeValue.values.filter(v => v.key !== storeStart);
        values = loConcat(values, value.values);
        values = sortByStringField(values, 'key', true);
        // Set range of stored values
        value.storeStart = values[0].key;
        value.storeEnd = values[values.length - 1].key;
        value.values = sortByStringField(values, 'key', false);
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('opcua-values.patch', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
