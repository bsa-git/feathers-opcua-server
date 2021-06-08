/* eslint-disable no-unused-vars */
const { inspector, dbNullIdValue } = require('../../../plugins');
const isLog = false;

module.exports = function (options = {}) {
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
