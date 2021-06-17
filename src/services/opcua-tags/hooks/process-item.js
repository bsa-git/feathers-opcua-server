/* eslint-disable no-unused-vars */
const schema = require('../opcua-tags.validate').schema;

module.exports = function (options = {}) {
  return async context => {
    let updateData = {};
    //-------------------------
    const { data } = context;

    // Throw an error if we didn't get a browseName
    if (!data.browseName) {
      throw new Error('A opcuaTag must have a browseName');
    }
    // Throw an error if we didn't get a displayName
    if (!data.displayName) {
      throw new Error('A opcuaTag must have a displayName');
    }
    // Throw an error if we didn't get a type
    if (!data.type) {
      throw new Error('A opcuaTag must have a type');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    });

    // updateData.createdAt = data.createdAt;
    // updateData.updatedAt = data.updatedAt;

    context.data = updateData;

    return context;
  };
};
