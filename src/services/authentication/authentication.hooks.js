/* eslint-disable no-unused-vars */
const { loginCheck, authorizeExtension, setLoginAt } = require('../../hooks/auth');

const debug = require('debug')('app:services.authentication.hooks');
const isDebug = false;

module.exports = {
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
    create: [loginCheck(), authorizeExtension(), setLoginAt()],
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