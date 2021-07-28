/* eslint-disable no-unused-vars */
const { defineAbilitiesFor } = require('../../services/authentication/abilities');
const { inspector } = require('../lib');

const isLog = false;

/**
 * Authorize normalize
 * @param context
 * @return {Object}
 */
module.exports = async context => {
  const { app } = context;
  const { user, ability, rules } = context.params;
  if (isLog) inspector('authorize-normalize.user:', user);
  if (!user) return context;
  if (ability && rules) return context;

  // Set roleAlias for user
  if (!user.roleAlias) {
    const service = app.service('roles');
    const idField = 'id' in user ? 'id' : '_id';
    let role = await service.find({ query: { [idField]: user.roleId } });
    role = role.data;
    if (!role.length) return context;
    role = role[0];
    if (isLog) inspector('authorize-normalize.role:', role);
    user.roleAlias = role.alias;
  }
  // Set ability and rules properties
  const _ability = defineAbilitiesFor(user);
  context.params.ability = _ability;
  context.params.rules = _ability.rules;
  return context;
};
