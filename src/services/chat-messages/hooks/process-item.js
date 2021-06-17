/* eslint-disable no-unused-vars */
const schema = require('../chat-messages.validate').schema;
const { dbNullIdValue, HookHelper } = require('../../../plugins');

const isLog = false;

module.exports = function (options = {}) {
  return async context => {
    let updateData = {};
    //--------------------
    const { data } = context;

    // Throw an error if we didn't get a text
    if (!data.msg) {
      throw new Error('A chat message must have a msg');
    }

    Object.keys(schema.properties).forEach(key => {
      if(data[key] !== undefined){
        updateData[key] = data[key];
      }
    });

    // The logged in user
    const { user } = context.params;

    // Get IdField
    const idField = HookHelper.getIdField(user);

    if(!updateData.ownerId){
      updateData.ownerId = user[idField];
    }

    if(!updateData.userId){
      updateData.userId = dbNullIdValue();
    }
    if(!updateData.teamId){
      updateData.teamId = dbNullIdValue();
    }
    if(!updateData.roleId){
      updateData.roleId = dbNullIdValue();
    }

    context.data = updateData;

    return context;
  };
};
