/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
const isLog = false;

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
    if (data[idField]) {
      updateData[idField] = data[idField];
    }

    // Update the original data (so that people can't submit additional stuff)
    updateData.name = data.name;
    updateData.alias = data.alias;
    updateData.description = data.description ? data.description : '';
    updateData.createdAt = context.data.createdAt;
    updateData.updatedAt = context.data.updatedAt;

    context.data = updateData;

    return context;
  };
};
