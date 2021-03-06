/* eslint-disable no-unused-vars */
const { authorize } = require('feathers-casl').hooks;
const { authenticate } = require('@feathersjs/authentication').hooks;
const { validateCreate, validateUpdate, validatePatch } = require('./roles.validate');
const processItem = require('./hooks/process-item');
const { getEnvAdapterDB } = require('../../plugins/db-helpers');

const loConcat = require('lodash/concat');

const authorizeHook = authorize({ adapter: getEnvAdapterDB() });

let moduleExports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [processItem()],
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

moduleExports.before.find = loConcat(moduleExports.before.find, authorizeHook);
moduleExports.before.create = loConcat([validateCreate()], moduleExports.before.create, authorizeHook);
moduleExports.before.update = loConcat([validateUpdate()], moduleExports.before.update, authorizeHook);
moduleExports.before.patch = loConcat([validatePatch()], moduleExports.before.patch, authorizeHook);
moduleExports.before.remove = loConcat(moduleExports.before.remove, authorizeHook);

module.exports = moduleExports;
