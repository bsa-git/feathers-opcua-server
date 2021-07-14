/* eslint-disable no-unused-vars */
const { HookHelper } = require('../../../plugins');
module.exports = function (options = {}) {
  return async context => {
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds items
    const addItems = async data => {
      if (data.teamId && data.userId) {
        const team = await hh.getItem('teams', data.teamId);
        if(team){
          data.team = team;
        }
        const user = await hh.getItem('users', data.userId);
        if(user){
          data.user = user;
        }
      }};
    await hh.forEachRecords(addItems);
    hh.showDebugInfo('user-teams.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
