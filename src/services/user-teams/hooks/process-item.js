/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
const debug = require('debug')('app:hook.process-item');

const isLog = false;
const isDebug = false;

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

    // Get IdField
    const idField = HookHelper.getIdField(data);
    if (data[idField]) {
      updateData[idField] = data[idField];
    }

    // Update the original data (so that people can't submit additional stuff)
    updateData.teamId = data.teamId;
    updateData.userId = data.userId;
    updateData.createdAt = context.data.createdAt;
    updateData.updatedAt = context.data.updatedAt;


    context.data = updateData;

    return context;
  };
};
