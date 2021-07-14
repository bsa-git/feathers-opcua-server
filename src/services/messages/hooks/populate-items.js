/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the items
    const addItems = async message => {
      if (message.userId) {
        const user = await hh.getItem('users', message.userId);
        if(user){
          message.user = user;
        }
      }};
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('messages.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
