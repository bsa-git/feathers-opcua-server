/* eslint-disable no-unused-vars */
const { dbNullIdValue } = require('../../../plugins');

module.exports = function (options = {}) {
  return async context => {
    let user = null, owner = null, team = null, role = null;
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
      // Get team
      if(message.teamId && message.teamId !== dbNullIdValue()){
        team = await app.service('teams').get(message.teamId);
      }
      // Get role
      if(message.roleId && message.roleId !== dbNullIdValue()){
        role = await app.service('roles').get(message.roleId);
      }
      
      // Merge the message content to include the `owner`, `user`, `team`, `role` objects
      return {
        ...message,
        owner,
        user,
        team,
        role
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
