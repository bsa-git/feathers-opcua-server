/* eslint-disable no-unused-vars */
const { loginCheck, abilityExtension, setLoginAt } = require('../../hooks/auth');
const { defineAbilitiesFor } = require('./abilities');

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
    create: [loginCheck(), abilityExtension(), setLoginAt()],
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