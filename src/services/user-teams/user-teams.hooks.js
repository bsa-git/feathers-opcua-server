const { authenticate } = require('@feathersjs/authentication').hooks;
const commonHooks = require('feathers-hooks-common');
const { validateCreate, validateUpdate, validatePatch } = require('./user-teams.validate');
const { HookHelper } = require('../../plugins');
const processItem = require('./hooks/process-item');
const populateItems = require('./hooks/populate-items');

const loConcat = require('lodash/concat');

const { iff } = commonHooks;

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
    all: [iff(HookHelper.isPopulateItems, populateItems())],
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

// Add schema validate
moduleExports.before.create = loConcat([validateCreate()], moduleExports.before.create);
moduleExports.before.update = loConcat([validateUpdate()], moduleExports.before.update);
moduleExports.before.patch = loConcat([validatePatch()], moduleExports.before.patch);

module.exports = moduleExports;
