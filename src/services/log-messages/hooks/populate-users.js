/* eslint-disable no-unused-vars */
const { inspector, dbNullIdValue } = require('../../../plugins');
const debug = require('debug')('app:hook.populate-users');

const isLog = false;
const isDebug = false;

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    let user = null;
    //-----------------------
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, method, result, params } = context;
    // Function that adds the user to a single message object
    const addUsers = async message => {
      // Get the user based on their id, pass the `params` along so
      // that we get a safe version of the user data
      const owner = await app.service('users').get(message.ownerId, params);
      if(message.userId !== dbNullIdValue()){
        user = await app.service('users').get(message.userId, params);
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
      context.result.data = await Promise.all(result.data.map(addUsers));
    } else {
      // Otherwise just update the single result
      context.result = await addUsers(result);
    }

    return context;
  };
};
