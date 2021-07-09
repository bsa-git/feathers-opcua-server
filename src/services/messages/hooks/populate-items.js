/* eslint-disable no-unused-vars */
module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, method, result, params } = context;
    // Function that adds the user to a single message object
    const addItems = async message => {
      // Get the user based on their id, pass the `params` along so
      // that we get a safe version of the user data
      if (message.userId) {
        const user = await app.service('users').get(message.userId);

        // Merge the message content to include the `user` object
        return {
          ...message,
          user
        };
      }
      return message;
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
