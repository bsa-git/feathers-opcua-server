/* eslint-disable no-unused-vars */
const schema = require('../teams.validate').schema;
const { HookHelper } = require('../../../plugins');

module.exports = function (options = {}) { 
  return async context => {
    let updateData = {};
    //---------------------
    const { data } = context;

    // Throw an error if we didn't get a name
    if (!data.name) {
      throw new Error('A item must have a name');
    }
    // Throw an error if we didn't get a alias
    if (!data.alias) {
      throw new Error('A item must have a alias');
    }

    // Get IdField
    const idField = HookHelper.getIdField(data);

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
