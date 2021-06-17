/* eslint-disable no-unused-vars */
const schema = require('../user-teams.validate').schema;

module.exports = function (options = {}) {
  return async context => {
    let updateData = {};
    //--------------------
    const { data } = context;

    // Throw an error if we didn't get a teamId
    if (!data.teamId) {
      throw new Error('A item must have a teamId');
    }

    // Throw an error if we didn't get a userId
    if (!data.userId) {
      throw new Error('A item must have a userId');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if(data[key] !== undefined){
        updateData[key] = data[key];
      }
    });

    context.data = updateData;

    return context;
  };
};
