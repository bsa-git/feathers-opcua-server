/* eslint-disable no-unused-vars */
const schema = require('../messages.validate').schema;
const { HookHelper } = require('../../../plugins');

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    let updateData = {};
    //-------------------------
    const { data } = context;

    // Throw an error if we didn't get a text
    if (!data.text) {
      throw new Error('A message must have a text');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if(data[key] !== undefined){
        updateData[key] = data[key];
      }
    });

    // The logged in user
    const { user } = context.params;

    // Get IdField
    const idField = HookHelper.getIdField(user);

    // The actual message text
    // Make sure that messages are no longer than 400 characters
    updateData.text = updateData.text.substring(0, 400);
    // Set the user id
    if(!updateData.userId && user){
      updateData.userId = user[idField];
    }

    context.data = updateData;

    return context;
  };
};
