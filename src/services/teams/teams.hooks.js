const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { validateCreate, validateUpdate, validatePatch } = require('./teams.validate');
const processItem = require('./hooks/process-item');
const { getEnvAdapterDB } = require('../../plugins/db-helpers');
const { authorizeNormalize } = require('../../plugins/hook-helpers');

const loConcat = require('lodash/concat');

const authorizeHook = authorize({ adapter: getEnvAdapterDB() });

let moduleExports = {
  before: {
    all: [ authenticate('jwt') ],
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

moduleExports.before.find = loConcat(moduleExports.before.find, authorizeNormalize, authorizeHook);
moduleExports.before.get = loConcat(moduleExports.before.get, authorizeNormalize, authorizeHook);
moduleExports.before.create = loConcat([validateCreate()], moduleExports.before.create, authorizeNormalize, authorizeHook);
moduleExports.before.update = loConcat([validateUpdate()], moduleExports.before.update, authorizeNormalize, authorizeHook);
moduleExports.before.patch = loConcat([validatePatch()], moduleExports.before.patch, authorizeNormalize, authorizeHook);
moduleExports.before.remove = loConcat(moduleExports.before.remove, authorizeNormalize, authorizeHook);

module.exports = moduleExports;
