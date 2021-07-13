/* eslint-disable no-unused-vars */
const { replaceItems } = require('feathers-hooks-common');
const { HookHelper } = require('../../../plugins/hook-helpers');
const isDebug = false;

module.exports = function (options = {}) {
  return async context => {
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app } = context;
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Add items
    const addItems = async value => {
      if (value.tagId) {
        const service = app.service('opcua-tags');
        const tag = await service.get(value.tagId);
        value.tag = tag;
      }
    };
    await hh.forEachRecords(addItems);
    // Place the modified records back in the context.
    replaceItems(context, hh.contextRecords);
    return context;
  };
};
