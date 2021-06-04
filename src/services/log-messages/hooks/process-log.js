/* eslint-disable no-unused-vars */
const { inspector, dbNullIdValue, HookHelper } = require('../../../plugins');
const debug = require('debug')('app:hook.process-log');

const isLog = false;
const isDebug = false;

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    let updateData = {};
    //--------------------
    const { data } = context;

    // Get IdField
    const idField = HookHelper.getIdField(data);
    if (data[idField]) {
      updateData[idField] = data[idField];
    }

    // Throw an error if we didn't get a text
    if (!data.msg) {
      throw new Error('A log message must have a msg');
    }

    // The logged in user
    const { user } = context.params;

    // Update the original data (so that people can't submit additional stuff)
    updateData.gr = data.gr;
    updateData.pr = data.pr;
    updateData.name = data.name;
    updateData.msg = data.msg;
    // Set the user id
    updateData.ownerId = data.ownerId ? data.ownerId : user ? user[idField] : dbNullIdValue();
    updateData.userId = data.userId ? data.userId : dbNullIdValue();
    updateData.createdAt = context.data.createdAt;
    updateData.updatedAt = context.data.updatedAt;


    context.data = updateData;

    return context;
  };
};
