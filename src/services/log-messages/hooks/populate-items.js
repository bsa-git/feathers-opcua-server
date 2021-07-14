/* eslint-disable no-unused-vars */
const { dbNullIdValue, HookHelper } = require('../../../plugins');

module.exports = function (options = {}) {
  return async context => {
    let user = null, owner = null;
    //-----------------------
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the user to a single message object
    const addItems = async message => {
      // Get owner
      if(message.ownerId && message.ownerId !== dbNullIdValue()){
        owner = await hh.getItem('users', message.ownerId);
        if(owner){
          message.owner = owner;
        }
      }
      // Get user
      if(message.userId && message.userId !== dbNullIdValue()){
        user = await hh.getItem('users', message.userId);
        if(user){
          message.user = user;
        }
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('log-messages.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
