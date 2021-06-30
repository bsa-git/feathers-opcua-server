/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const { validateCreate, validateUpdate, validatePatch } = require('./users.validate');
const commonHooks = require('feathers-hooks-common');
const { HookHelper, AuthServer } = require('../../plugins');
const processItem = require('./hooks/process-item');
const populateItems = require('./hooks/populate-items');
const accountsProfileData = require('./hooks/accounts-profile-data');

const loConcat = require('lodash/concat');

const { iff } = commonHooks;
const {preventChanges, discard, disallow, isProvider} = commonHooks;

const isTest = AuthServer.isTest();

const discardFields = iff(!isTest && isProvider('external'), discard(
  // 'isVerified',
  'verifyToken',
  'verifyShortToken',
  'verifyExpires',
  'verifyChanges',
  'resetToken',
  'resetShortToken',
  'resetExpires',
  // 'googleId',
  // 'githubId',
  'googleAccessToken',
  'googleRefreshToken',
  'githubAccessToken',
  'githubRefreshToken'
));

let moduleExports = {
  before: {
    all: [],
    find: [ authenticate('jwt') ],
    get: [ authenticate('jwt') ],
    create: [ processItem(), hashPassword('password') ],
    update: [ authenticate('jwt') ],
    // update: [ hashPassword('password'),  authenticate('jwt') ],
    patch: [ authenticate('jwt') ],
    // patch: [ hashPassword('password'),  authenticate('jwt') ],
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

//---- BEFORE ---
// moduleExports.before.create = loConcat([accountsProfileData(),validateCreate()], moduleExports.before.create);
// moduleExports.before.update = loConcat(iff(!isTest, disallow('external')), [validateUpdate()], moduleExports.before.update);
// moduleExports.before.patch = loConcat(iff(!isTest && isProvider('external'), preventChanges(true,
//   'isVerified',
//   'verifyToken',
//   'verifyShortToken',
//   'verifyExpires',
//   'verifyChanges',
//   'resetToken',
//   'resetShortToken',
//   'resetExpires',
//   'googleId',
//   'githubId',
// )), [accountsProfileData(), validatePatch()], moduleExports.before.patch);


moduleExports.before.create = loConcat([validateCreate()], moduleExports.before.create);
moduleExports.before.update = loConcat([validateUpdate()], moduleExports.before.update);
moduleExports.before.patch = loConcat([validatePatch()], moduleExports.before.patch);

//---- AFTER ---
// moduleExports.after.create = loConcat(moduleExports.after.create);
// moduleExports.after.find = loConcat(discardFields, moduleExports.after.find);
// moduleExports.after.get = loConcat(discardFields, moduleExports.after.get);
// moduleExports.after.update = loConcat(discardFields, moduleExports.after.update);
// moduleExports.after.patch = loConcat(discardFields, moduleExports.after.patch);
// moduleExports.after.remove = loConcat(discardFields, moduleExports.after.remove);


module.exports = moduleExports;
