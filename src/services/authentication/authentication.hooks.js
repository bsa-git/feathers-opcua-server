const { defineAbilitiesFor } = require('./abilities');
const { inspector } = require('../../plugins/lib');

const isLog = false;

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [
      async context => {
        const { app } = context;
        const { user } = context.result;
        if (isLog) inspector('authentication.hooks.user:', user);
        if (!user) return context;
        // Set roleAlias for user
        if (!user.roleAlias) {
          const service = app.service('roles');
          const idField = 'id' in user ? 'id' : '_id';
          let role = await service.find({ query: { [idField]: user.roleId } });
          role = role.data;
          if (!role.length) return context;
          role = role[0];
          if (isLog) inspector('authentication.hooks.role:', role);
          user.roleAlias = role.alias;
        }
        if (isLog) inspector('authentication.hooks.user:', user);
        // Set ability and rules properties
        const ability = defineAbilitiesFor(user);
        context.result.ability = ability;
        context.result.rules = ability.rules;
        return context;
      }
    ],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};