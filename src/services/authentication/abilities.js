/* eslint-disable no-unused-vars */
const { AbilityBuilder, createAliasResolver, makeAbilityFromRules } = require('feathers-casl');

const debug = require('debug')('app:serveces.authentication.abilities');
const isDebug = false;

// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch',       // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove'       // use 'delete' or 'remove'
});

const defineRulesFor = (user) => {
  // also see https://casl.js.org/v5/en/guide/define-rules
  const { can, cannot, rules } = new AbilityBuilder();

  if (isDebug && user) debug('abilities.defineRulesFor.user:', user);

  //-------------------------------------------------------------------
  // can('manage', 'users');
  // can('create', 'users');
  // can('read', 'users');
  // can('update', 'users');
  // can('remove', 'users');


  // Define public rules
  const definePublicRules = () => {

    // Can 'authentication' actions
    can('create', 'authentication');

    // Can 'users' actions
    can('create', 'users');

    // Can 'mailer' actions
    can('create', 'mailer');

    // Can 'auth-management' actions
    can('create', 'auth-management');

    // Can 'data-management' actions
    can('create', 'data-management');

    // Can 'log-messages' actions
    can('create', 'log-messages');

    return rules;
  };

  // Define rules for guest
  const defineRulesForGuest = () => {

    // Can 'users' actions
    can('read', 'users');
    can('update', 'users', ['active', 'email', 'password', 'firstName', 'lastName', 'avatar'], { id: user.id });

    // Can 'user-profiles' actions
    can('create', 'user-profiles');
    can('read', 'user-profiles');
    can('update', 'user-profiles', { id: user.profileId });

    // Can 'roles' actions
    can('read', 'roles');

    // Can 'teams' actions
    can('read', 'teams');

    // Can 'user-teams' actions
    can('read', 'user-teams');

    // Can 'log-messages' actions
    can('read', 'log-messages');

    // Can 'chat-messages' actions
    can('create', 'chat-messages');
    can('read', 'chat-messages');
    can('update', 'chat-messages', ['msg'], { ownerId: user.id });
    can('remove', 'chat-messages', { ownerId: user.id });

    // Can 'opcua-tags' actions
    can('read', 'opcua-tags');

    // Can 'opcua-values' actions
    can('read', 'opcua-values');

    // Can 'messages' actions
    can('create', 'messages');
    can('read', 'messages');
    can('update', 'messages', ['text'], { userId: user.id });
    can('remove', 'messages', { userId: user.id });

    return rules;
  };

  // Define rules for guest
  const defineRulesForGuest_ = () => {

    // Can 'users' actions
    can('create', 'users');
    can('read', 'users');
    can('update', 'users', ['active', 'email', 'password', 'firstName', 'lastName', 'avatar'], { id: user.id });
    // can('delete', 'users', {id: user.id});

    // Can 'user-profiles' actions
    can('create', 'user-profiles');
    can('read', 'user-profiles');
    can('update', 'user-profiles', { id: user.profileId });

    // Can 'roles' actions
    can('read', 'roles');

    // Can 'teams' actions
    can('read', 'teams');

    // Can 'user-teams' actions
    can('read', 'user-teams');

    // Can 'log-messages' actions
    can('read', 'log-messages');

    // Can 'chat-messages' actions
    can('create', 'chat-messages');
    can('read', 'chat-messages');
    can('update', 'chat-messages', ['msg'], { ownerId: user.id });
    can('remove', 'chat-messages', { ownerId: user.id });

    // Can 'opcua-tags' actions
    can('read', 'opcua-tags');
    // can('manage', 'opcua-tags');
    // can('create', 'opcua-tags');
    // can('read', 'opcua-tags');
    // can('update', 'opcua-tags');
    // can('remove', 'opcua-tags');

    // Can 'opcua-values' actions
    can('read', 'opcua-values');
    // can('manage', 'opcua-values');
    // can('create', 'opcua-values');
    // can('read', 'opcua-values');
    // can('update', 'opcua-values');
    // can('remove', 'opcua-values');

    // Can 'messages' actions
    can('create', 'messages');
    can('read', 'messages');
    can('update', 'messages', ['text'], { userId: user.id });
    can('remove', 'messages', { userId: user.id });

    return rules;
  };

  // Define rules for administrator
  const defineRulesForAdmin = () => {
    // Administrator can do all
    can('manage', 'all');
    return rules;
  };

  //--------------------------------------------------------------

  // Role is public
  if (!user) {
    return definePublicRules();
  }

  // Role is guest
  if (user && user.roleAlias === 'isGuest') {
    const publicRules = definePublicRules();
    const guestRules = defineRulesForGuest();
    const roles = publicRules.concat(guestRules);
    if (isDebug && roles.length) debug('allRoles:', roles);
    return roles;
  }

  // Role is Administrator
  if (user && user.roleAlias === 'isAdministrator') {
    return defineRulesForAdmin();
  }


};

const defineAbilitiesFor = (user) => {
  const rules = defineRulesFor(user);

  return makeAbilityFromRules(rules, { resolveAction });
};

module.exports = {
  defineRulesFor,
  defineAbilitiesFor
};