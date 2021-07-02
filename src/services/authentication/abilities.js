/* eslint-disable no-unused-vars */
const { AbilityBuilder, createAliasResolver, makeAbilityFromRules } = require('feathers-casl');

// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch',       // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove'       // use 'delete' or 'remove'
});

const defineRulesFor = (user) => {
  // also see https://casl.js.org/v5/en/guide/define-rules
  const { can, cannot, rules } = new AbilityBuilder();

  if (user.role && user.roleAlias === 'isAdministrator') {
    // Administrator can do evil
    can('manage', 'all');
    cannot('create', 'messages');
    return rules;
  }

  // authentication.create; users.create; log-messages.create;

  can('read', 'users');
  can('update', 'users', { id: user.id });
  cannot('update', 'users', ['roleId'], { id: user.id });
  cannot('delete', 'users', { id: user.id });

  can('create', 'authentication');
  can('delete', 'authentication');
  can('create', 'user-profiles');
  can('delete', 'log-messages');
  can('delete', 'log-messages');
  can('create', 'chat-messages');
  can('create', 'opcua-tags');

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