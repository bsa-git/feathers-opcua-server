/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the items
    const addItems = async data => {
      const fieldId = HookHelper.getIdField(data);
      if (data.roleId && data.profileId) {
        const roles = await hh.findItems('roles', { [fieldId]: data.roleId });
        if(roles.length){
          data.role = roles[0];
        }
        const userProfiles = await hh.findItems('user-profiles', { [fieldId]: data.profileId });
        if(userProfiles.length){
          data.userProfile = userProfiles[0];
        }
      }
    };
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('users.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
