/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
module.exports = function (options = {}) {
  return async context => {
    // Get `app`, `method`, `params` and `result` from the hook context
    const { app, method, result, params } = context;
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the items to a single user object
    const addItems = async data => {
      if (data.roleId && data.profileId) {
        const role = await hh.getItem('roles', data.roleId);
        if(role){
          data.role = role;
        }
        const userProfile = await hh.getItem('user-profiles', data.profileId);
        if(userProfile){
          data.userProfile = userProfile;
        }
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('users.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
