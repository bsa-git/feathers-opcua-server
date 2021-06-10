const { authenticate } = require('@feathersjs/authentication').hooks;
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const { validateCreate, validateUpdate, validatePatch } = require('./users.validate');
const commonHooks = require('feathers-hooks-common');
const { HookHelper } = require('../../plugins');
const processItem = require('./hooks/process-item');
const populateItems = require('./hooks/populate-items');

const loConcat = require('lodash/concat');

const { iff } = commonHooks;

let moduleExports = {
  before: {
    all: [],
    find: [ authenticate('jwt') ],
    get: [ authenticate('jwt') ],
    create: [ processItem(), hashPassword('password') ],
    update: [ hashPassword('password'),  authenticate('jwt') ],
    patch: [ hashPassword('password'),  authenticate('jwt') ],
    remove: [ authenticate('jwt') ]
  },

  after: {
    all: [
      iff(HookHelper.isPopulateItems, populateItems()), 
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect('password')
    ],
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
