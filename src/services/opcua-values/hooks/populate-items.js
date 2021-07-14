/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');

module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Add items
    const addItems = async value => {
      if (value.tagId) {
        const tag = await hh.getItem('opcua-tags', value.tagId);
        if (tag) {
          value.tag = tag;
        }
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('opcua-values.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
