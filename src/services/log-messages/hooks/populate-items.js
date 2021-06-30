/* eslint-disable no-unused-vars */
const { inspector, dbNullIdValue } = require('../../../plugins');
const isLog = false;

module.exports = function (options = {}) {
  return async context => {
    let user = null, owner = null;
    //-----------------------
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, method, result, params } = context;
    // Function that adds the user to a single message object
    const addItems = async message => {
      // Get owner
      if(message.ownerId && message.ownerId !== dbNullIdValue()){
        owner = await app.service('users').get(message.ownerId);
      }
      // Get user
      if(message.userId && message.userId !== dbNullIdValue()){
        user = await app.service('users').get(message.userId);
      }
      
      // Merge the message content to include the `owner` and `user` objects
      return {
        ...message,
        owner,
        user
      };
    };

    // In a find method we need to process the entire page
    if (method === 'find') {
      // Map all data to include the `user` information
      context.result.data = await Promise.all(result.data.map(addItems));
    } else {
      // Otherwise just update the single result
      context.result = await addItems(result);
    }

    return context;
  };
};
