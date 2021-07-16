/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the items
    const addItems = async message => {
      const fieldId = HookHelper.getIdField(message);
      if (message.userId) {
        const users = await hh.findItems('users', { [fieldId]: message.userId });
        if(users.length){
          message.user = users[0];
        }
      }};
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('messages.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
