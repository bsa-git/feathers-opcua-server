/* eslint-disable no-unused-vars */
const commonHooks = require('feathers-hooks-common');
const { iff } = commonHooks;
const { authenticate } = require('@feathersjs/authentication').hooks;

const { authorize } = require('feathers-casl').hooks;
const { getEnvAdapterDB } = require('../../plugins/db-helpers');
const authorizeHook = authorize({ adapter: getEnvAdapterDB() });

const isAction = (...args) => hook => args.includes(hook.data.action);


module.exports = {
  before: {
    all: [authorizeHook],
    find: [],
    get: [],
    create: [iff(isAction('passwordChange', 'identityChange'), authenticate('jwt'))],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [authorizeHook],
    find: [],
    get: [],
    create: [],
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
