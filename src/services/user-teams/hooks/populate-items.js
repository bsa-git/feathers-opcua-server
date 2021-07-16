/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds items
    const addItems = async data => {
      const fieldId = HookHelper.getIdField(data);
      if (data.teamId && data.userId) {
        const teams = await hh.findItems('teams', { [fieldId]: data.teamId });
        if(teams.length){
          data.team = teams[0];
        }
        const users = await hh.findItems('users', { [fieldId]: data.userId });
        if(users.length){
          data.user = users[0];
        }
      }};
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('user-teams.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
