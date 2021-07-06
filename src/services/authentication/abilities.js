/* eslint-disable no-unused-vars */
const { AbilityBuilder, createAliasResolver, makeAbilityFromRules } = require('feathers-casl');
const { inspector } = require('../../plugins/lib');

const isLog = false;

// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch',       // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove'       // use 'delete' or 'remove'
});

const defineRulesFor = (user) => {
  // also see https://casl.js.org/v5/en/guide/define-rules
  const { can, cannot, rules } = new AbilityBuilder();

  if(isLog) inspector('abilities.defineRulesFor.user:', user);

  if (user.roleAlias === 'isAdministrator') {
    // Administrator can do all
    can('manage', 'all');
    // cannot('create', 'messages');
    return rules;
  }

  if (user.roleAlias === 'isGuest') {
    // Guest can do all
    can('manage', 'all');
    // Cannot 'users' actions
    cannot('update', 'users', ['roleId', 'profileId']);
    cannot('delete', 'users');
    // Cannot 'user-profiles' actions
    cannot('update', 'user-profiles', {id: {$ne: user.profileId} });
    cannot('delete', 'user-profiles');

    // Cannot 'roles' actions
    cannot('create', 'roles');
    cannot('update', 'roles');
    cannot('remove', 'roles');
    // Cannot 'teams' actions
    cannot('create', 'teams');
    cannot('update', 'teams');
    cannot('remove', 'teams');
    // Cannot 'user-teams' actions
    cannot('create', 'user-teams');
    cannot('remove', 'user-teams');
    return rules;
  }

  return rules;
};

const defineAbilitiesFor = (user) => {
  const rules = defineRulesFor(user);

  return makeAbilityFromRules(rules, { resolveAction });
};

module.exports = {
  defineRulesFor,
  defineAbilitiesFor
};