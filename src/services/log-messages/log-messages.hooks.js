/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;

const processLog = require('./hooks/process-log');
const populateUsers = require('./hooks/populate-users');

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [],
    get: [],
    create: [processLog()],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [populateUsers()],
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
