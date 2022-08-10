/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const commonHooks = require('feathers-hooks-common');
const { validateCreate, validateUpdate, validatePatch } = require('./opcua-values.validate');
const { HookHelper, authorizeNormalize } = require('../../plugins/hook-helpers');
const { getEnvAdapterDB } = require('../../plugins/db-helpers');
const processItem = require('./hooks/process-item');
const populateItems = require('./hooks/populate-items');
const storeItems = require('./hooks/store-items');

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

moduleExports.before.find = loConcat(moduleExports.before.find, authorizeNormalize, authorizeHook);
moduleExports.before.get = loConcat(moduleExports.before.get, authorizeNormalize, authorizeHook);
moduleExports.before.create = loConcat([validateCreate()], moduleExports.before.create, authorizeNormalize, authorizeHook, storeItems());
moduleExports.before.update = loConcat([validateUpdate()], moduleExports.before.update, authorizeNormalize, authorizeHook);
moduleExports.before.patch = loConcat([validatePatch()], moduleExports.before.patch, authorizeNormalize, authorizeHook, storeItems());
moduleExports.before.remove = loConcat(moduleExports.before.remove, authorizeNormalize, authorizeHook);

module.exports = moduleExports;
