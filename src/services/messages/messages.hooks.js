const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const commonHooks = require('feathers-hooks-common');
const { validateCreate, validateUpdate, validatePatch } = require('./messages.validate');
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
    all: [authorize({ adapter: 'feathers-mongoose' }), iff(HookHelper.isPopulateItems, populateItems())],
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
moduleExports.before.find = loConcat(moduleExports.before.create, authorize({ adapter: 'feathers-mongoose' }));
moduleExports.before.create = loConcat([validateCreate()], moduleExports.before.create, authorize({ adapter: 'feathers-mongoose' }));
moduleExports.before.update = loConcat([validateUpdate()], moduleExports.before.update, authorize({ adapter: 'feathers-mongoose' }));
moduleExports.before.patch = loConcat([validatePatch()], moduleExports.before.patch, authorize({ adapter: 'feathers-mongoose' }));
moduleExports.before.remove = loConcat(moduleExports.before.create, authorize({ adapter: 'feathers-mongoose' }));

module.exports = moduleExports;
