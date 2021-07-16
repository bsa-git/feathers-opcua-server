/* eslint-disable no-unused-vars */
const { dbNullIdValue, HookHelper } = require('../../../plugins');

module.exports = function (options = {}) {
  return async context => {
    let users = null, owners = null;
    //-----------------------
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the user to a single message object
    const addItems = async message => {
      const fieldId = HookHelper.getIdField(message);
      // Get owner
      if(message.ownerId && message.ownerId !== dbNullIdValue()){
        owners = await hh.findItems('users', { [fieldId]: message.ownerId });
        if(owners.lendth){
          message.owner = owners[0];
        }
      }
      // Get user
      if(message.userId && message.userId !== dbNullIdValue()){
        users = await hh.findItems('users', { [fieldId]: message.userId });
        if(users.lendth){
          message.user = users[0];
        }
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('log-messages.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
