/* eslint-disable no-unused-vars */
const schema = require('../users.validate').schema;

module.exports = function (options = {}) {
  return async context => {
    let updateData = {};
    //--------------------
    const { data } = context;

    // Throw an error if we didn't get a email
    if (!data.email) {
      throw new Error('A user must have a email');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if(data[key] !== undefined){
        updateData[key] = data[key];
      }
      if(schema.properties[key]['setDefault'] !== undefined){
        updateData[key] = schema.properties[key]['setDefault'];
      }
    });



    context.data = updateData;

    return context;
  };
};
