/* eslint-disable no-unused-vars */
const schema = require('../log-messages.validate').schema;
const { dbNullIdValue, HookHelper } = require('../../../plugins');

const isLog = false;

module.exports = function (options = {}) {
  return async context => {
    let updateData = {};
    //--------------------
    const { data } = context;

    // Throw an error if we didn't get a text
    if (!data.msg) {
      throw new Error('A log message must have a msg');
    }

    Object.keys(schema.properties).forEach(key => {
      if(data[key] !== undefined){
        updateData[key] = data[key];
      }
      if(schema.properties[key]['default'] !== undefined && !updateData[key]){
        updateData[key] = schema.properties[key]['default'];
      }
    });

    // The logged in user
    const { user } = context.params;

    // Get IdField
    const idField = HookHelper.getIdField(user);

    if(!updateData.ownerId){
      updateData.ownerId = user[idField];
    }

    context.data = updateData;

    return context;
  };
};
