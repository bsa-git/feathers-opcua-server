/* eslint-disable no-unused-vars */
const { defineAbilitiesFor } = require('./abilities');

const debug = require('debug')('app:services.authentication.hooks');
const isDebug = false;

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
        if (isDebug && user) debug('after.create.user:', user);
        if (!user) return context;
        // Set roleAlias for user
        if (!user.roleAlias) {
          const service = app.service('roles');
          const idField = 'id' in user ? 'id' : '_id';
          let role = await service.find({ query: { [idField]: user.roleId } });
          role = role.data;
          if (!role.length) return context;
          role = role[0];
          if (isDebug && role) debug('after.create.role:', role);
          user.roleAlias = role.alias;
        }
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