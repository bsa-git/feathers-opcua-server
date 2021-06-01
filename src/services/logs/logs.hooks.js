/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;

// const processMessage = require('../../hooks/process-message');
// const populateUser = require('../../hooks/populate-user');

module.exports = {
  before: {
    // all: [ authenticate('jwt') ],
    all: [],
    find: [],
    get: [],
    // create: [processMessage()],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    // all: [populateUser()],
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
