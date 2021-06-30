/* eslint-disable no-unused-vars */
const schema = require('../roles.validate').schema;
const { inspector } = require('../../../plugins');
const isLog = false;

module.exports = function (options = {}) { 
  return async context => {
    let updateData = {};
    //---------------------
    const { data } = context;

    // Throw an error if we didn't get a name
    if (!data.name) {
      throw new Error('A role must have a name');
    }
    // Throw an error if we didn't get a alias
    if (!data.alias) {
      throw new Error('A role must have a alias');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if(data[key] !== undefined){
        updateData[key] = data[key];
      }
    });

    // inspector('roles.hook.data:', data);
    // inspector('roles.hook.updateData:', updateData);

    context.data = updateData;


    return context;
  };
};
