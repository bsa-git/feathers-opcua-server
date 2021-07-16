/* eslint-disable no-unused-vars */
const { dbNullIdValue, HookHelper } = require('../../../plugins');

module.exports = function (options = {}) {
  return async context => {
    let users = null, owners = null, teams = null, roles = null;
    //-----------------------
    // Create HookHelper object
    const hh = new HookHelper(context);
    // Function that adds the items
    const addItems = async message => {
      const fieldId = HookHelper.getIdField(message);
      // Get owner
      if (message.ownerId && message.ownerId !== dbNullIdValue()) {
        owners = await hh.findItems('users', { [fieldId]: message.ownerId });
        if (owners.length) {
          message.owner = owners[0];
        }
      }
      // Get user
      if (message.userId && message.userId !== dbNullIdValue()) {
        users = await hh.findItems('users', { [fieldId]: message.userId });
        if (users.length) {
          message.user = users[0];
        }
      }
      // Get team
      if (message.teamId && message.teamId !== dbNullIdValue()) {
        teams = await hh.findItems('teams', { [fieldId]: message.teamId });
        if (teams.length) {
          message.team = teams[0];
        }
      }
      // Get role
      if (message.roleId && message.roleId !== dbNullIdValue()) {
        roles = await hh.findItems('roles', { [fieldId]: message.roleId });
        if (roles.length) {
          message.role = roles[0];
        }
      }
    };

    await hh.forEachRecords(addItems);
    hh.showDebugInfo('chat-messages.create', false);
    // Place the modified records back in the context.
    return hh.replaceRecordsForContext(context);
  };
};
