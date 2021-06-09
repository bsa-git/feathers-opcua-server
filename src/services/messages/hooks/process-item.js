/* eslint-disable no-unused-vars */
const { dbNullIdValue, HookHelper } = require('../../../plugins');

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    let updateData = {};
    //-------------------------
    const { data } = context;

    // Get IdField
    const idField = HookHelper.getIdField(data);
    if (data[idField]) {
      updateData[idField] = data[idField];
    }

    // Throw an error if we didn't get a text
    if (!data.text) {
      throw new Error('A message must have a text');
    }

    // The logged in user
    const { user } = context.params;
    // The actual message text
    // Make sure that messages are no longer than 400 characters
    const text = context.data.text.substring(0, 400);

    // Update the original data (so that people can't submit additional stuff)
    updateData.text = text;
    // Set the user id
    updateData.userId = data.userId ? data.userId : user ? user[idField] : dbNullIdValue();
    updateData.createdAt = context.data.createdAt;
    updateData.updatedAt = context.data.updatedAt;

    context.data = updateData;

    return context;
  };
};
