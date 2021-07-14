/* eslint-disable no-unused-vars */
const { dbNullIdValue, HookHelper } = require('../../../plugins');

module.exports = function (options = {}) {
  return async context => {
    let user = null, owner = null, team = null, role = null;
    //-----------------------
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the items
    const addItems = async message => {
      // Get owner
      if(message.ownerId && message.ownerId !== dbNullIdValue()){
        owner = await hh.getItem('users', message.ownerId);
        if(owner){
          message.owner = owner;
        }
      }
      // Get user
      if(message.userId && message.userId !== dbNullIdValue()){
        user = await hh.getItem('users', message.userId);
        if(user){
          message.user = user;          
        }
      }
      // Get team
      if(message.teamId && message.teamId !== dbNullIdValue()){
        team = await hh.getItem('teams', message.teamId);
        if(team){
          message.team = team;          
        }
      }
      // Get role
      if(message.roleId && message.roleId !== dbNullIdValue()){
        role = await hh.getItem('roles', message.roleId);
        if(role){
          message.role = role;          
        }
      }
    };

    await hh.forEachRecords(addItems);
    hh.showDebugInfo('chat-messages.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
