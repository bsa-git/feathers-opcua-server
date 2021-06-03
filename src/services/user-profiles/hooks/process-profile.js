/* eslint-disable no-unused-vars */
const { inspector, dbNullIdValue } = require('../../../plugins/lib');
const debug = require('debug')('app:hook.process-log');

const isLog = false;
const isDebug = false;

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    const { data } = context;

    // Get profile data
    let profileData = {};

    Object.keys(data).forEach(key => {
      if(data[key]){
        profileData[key] = data[key];
      }
    });
    
    context.data = profileData;

    return context;
  };
};
