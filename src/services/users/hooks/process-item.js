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
    if (!data.email) {
      throw new Error('A item must have a email');
    }

    // Get IdField
    const idField = HookHelper.getIdField(data);
    if (data[idField]) {
      updateData[idField] = data[idField];
    }

    // Update the original data (so that people can't submit additional stuff)
    updateData.email = data.email;
    if(data.password){
      updateData.password = data.password;
    }
    if(data.firstName){
      updateData.firstName = data.firstName;
    }
    if(data.lastName){
      updateData.lastName = data.lastName;
    }
    if(data.roleId){
      updateData.roleId = data.roleId;
    }
    if(data.profileId){
      updateData.profileId = data.profileId;
    }
    if(data.active !== undefined){
      updateData.active = data.active;
    }
    if(data.isVerified !== undefined){
      updateData.isVerified = data.isVerified;
    }
    if(data.googleId){
      updateData.googleId = data.googleId;
    }
    if(data.githubId){
      updateData.githubId = data.githubId;
    }
    if(data.loginAt){
      updateData.loginAt = data.loginAt;
    }
    if(data.avatar){
      updateData.avatar = data.avatar;
    }
    updateData.createdAt = context.data.createdAt;
    updateData.updatedAt = context.data.updatedAt;


    context.data = updateData;

    return context;
  };
};
