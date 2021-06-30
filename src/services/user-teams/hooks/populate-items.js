/* eslint-disable no-unused-vars */
const { inspector } = require('../../../plugins');
const isLog = false;

module.exports = function (options = {}) {
  return async context => {
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, method, result, params } = context;
    // Function that adds the team and user to a single user-teams object
    const addItems = async data => {
      const team = await app.service('teams').get(data.teamId);
      const user = await app.service('users').get(data.userId);
      
      // Merge the data content to include the `team` and `user` objects
      return {
        ...data,
        team,
        user
      };
    };

    // In a find method we need to process the entire page
    if (method === 'find') {
      // Map all data to include the team and user information
      context.result.data = await Promise.all(result.data.map(addItems));
    } else {
      // Otherwise just update the single result
      context.result = await addItems(result);
    }

    return context;
  };
};
