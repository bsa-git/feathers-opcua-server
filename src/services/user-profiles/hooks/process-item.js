/* eslint-disable no-unused-vars */
const schema = require('../user-profiles.validate').schema;
const { inspector, dbNullIdValue } = require('../../../plugins');
const isLog = false;

module.exports = function (options = {}) {
  return async context => {
    let updateData = {};
    //-------------------------
    const { data } = context;

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    });

    updateData.createdAt = data.createdAt;
    updateData.updatedAt = data.updatedAt;

    context.data = updateData;

    return context;
  };
};
