/* eslint-disable no-unused-vars */
const { getItems, replaceItems } = require('feathers-hooks-common');
const { inspector, HookHelper, servicesConstraint } = require('../plugins');
const debug = require('debug')('app:hooks.constraints');

const isDebug = false;

// eslint-disable-next-line no-unused-vars
module.exports = function (isTest = false) {

  // Return the actual hook
  return async (context) => {
    // Get the record(s) from context.data (before), context.result.data or context.result (after).
    // getItems always returns an array to simplify your processing.
    let records = getItems(context);

    /*
    Modify records and/or context.
     */
    const isCheck = isTest ? true : !HookHelper.isTest();
    if (isDebug) debug('isCheck:', isCheck);

    if (isCheck) {
      // Create HookHelper object
      const hh = new HookHelper(context);
      // Show debug info
      hh.showDebugInfo('', isDebug);
      hh.showDebugRecords('', isDebug);

      // hookHelper.showDebugInfo('authentication.create.after', true);

      records = await servicesConstraint(context);
      if (isDebug && records.length) inspector('hooks.constraints.records:', records);
    }

    // Place the modified records back in the context.
    replaceItems(context, records);
    // Best practice: hooks should always return the context.
    return context;
  };
};

// Throw to reject the service call, or on an unrecoverable error.
// eslint-disable-next-line no-unused-vars
function error(msg) {
  throw new Error(msg);
}
