/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;
const { validateCreate, validateUpdate, validatePatch } = require('./roles.validate');
const processItem = require('./hooks/process-item');

const loConcat = require('lodash/concat');

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
    all: [],
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
