/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Add items
    const addItems = async record => {
      if (record.tagId) {
        const fieldId = HookHelper.getIdField(record);
        const tags = await hh.findItems('opcua-tags', { [fieldId]: record.tagId });
        if (tags.length) {
          record.tag = tags[0];
        }
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('opcua-values.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
