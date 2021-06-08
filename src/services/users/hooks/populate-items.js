/* eslint-disable no-unused-vars */
const { inspector } = require('../../../plugins');
const isLog = false;

module.exports = function (options = {}) {
  return async context => {
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, method, result, params } = context;
    // Function that adds the items to a single user object
    const addItems = async data => {
      const role = await app.service('roles').get(data.roleId, params);
      const userProfile = await app.service('user-profiles').get(data.profileId, params);
      // Merge the data content to include the `role` and `userProfile` objects
      return {
        ...data,
        role,
        userProfile
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
