/* eslint-disable no-unused-vars */
module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, method, result, params } = context;
    // Function that adds the user to a single message object
    const addItems = async value => {
      // Get the user based on their id, pass the `params` along so
      // that we get a safe version of the user data
      const tag = await app.service('opcua-tags').get(value.tagId);

      // Merge the `opcua-value` content to include the `tag` object
      return {
        ...value,
        tag
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
