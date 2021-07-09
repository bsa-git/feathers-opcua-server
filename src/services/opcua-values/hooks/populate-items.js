/* eslint-disable no-unused-vars */

const isDebug = false;

module.exports = function (options = {}) { 
  return async context => {
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, path, method, type, result, params } = context;
    // Function that adds the user to a single message object
    const addItems = async value => {
      // Get the user based on their id, pass the `params` along so
      // that we get a safe version of the user data
      if(isDebug) console.log('populate-items.path-method-type:', `${path}.${method}.${type}`);
      if(isDebug) console.log('populate-items.value:', value);
      if (value.tagId) {
        if(isDebug) console.log('populate-items.tagId:', value.tagId);
        const service = app.service('opcua-tags');
        const tag = await service.get(value.tagId);
        if(isDebug) console.log('populate-items.tag:', tag);
        // Merge the `opcua-value` content to include the `tag` object
        return {
          ...value,
          tag
        };
      }
      return value;
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
