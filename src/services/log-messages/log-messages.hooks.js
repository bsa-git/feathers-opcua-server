/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const commonHooks = require('feathers-hooks-common');
const { validateCreate, validateUpdate, validatePatch } = require('./log-messages.validate');
const { HookHelper } = require('../../plugins/hook-helpers');
const { getEnvAdapterDB } = require('../../plugins/db-helpers');
const processItem = require('./hooks/process-item');
const populateItems = require('./hooks/populate-items');

const loConcat = require('lodash/concat');

const { iff } = commonHooks;

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
    all: [authorizeHook, iff(HookHelper.isPopulateItems, populateItems())],
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
