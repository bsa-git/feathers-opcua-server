// Application hooks that run for every service
const normalize = require('./hooks/normalize');
const log = require('./hooks/log');

let moduleExports = {
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
  },
};

const loConcat = require('lodash/concat');
// Add hooks
moduleExports.before.all = loConcat([log(), normalize()]);
moduleExports.after.all = loConcat([normalize(), log()]);
moduleExports.error.all = loConcat([log()]);

module.exports = moduleExports;
