/* eslint-disable no-unused-vars */
const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const { validateCreate, validateUpdate, validatePatch } = require('./users.validate');
const commonHooks = require('feathers-hooks-common');
const { HookHelper, authorizeNormalize } = require('../../plugins/hook-helpers');
const { getEnvAdapterDB } = require('../../plugins/db-helpers');
const processItem = require('./hooks/process-item');
const populateItems = require('./hooks/populate-items');
const accountsProfileData = require('./hooks/accounts-profile-data');

const loConcat = require('lodash/concat');

const authorizeHook = authorize({ adapter: getEnvAdapterDB() });

const { iff } = commonHooks;
const {preventChanges, discard, disallow, isProvider} = commonHooks;

const isTest = HookHelper.isTest();

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
      authorizeHook,
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


moduleExports.before.find = loConcat(moduleExports.before.find, authorizeNormalize, authorizeHook);
moduleExports.before.get = loConcat(moduleExports.before.get, authorizeNormalize, authorizeHook);
moduleExports.before.create = loConcat([validateCreate()], moduleExports.before.create, authorizeNormalize, authorizeHook);
moduleExports.before.update = loConcat([validateUpdate()], moduleExports.before.update, authorizeNormalize, authorizeHook);
moduleExports.before.patch = loConcat([validatePatch()], moduleExports.before.patch, authorizeNormalize, authorizeHook);
moduleExports.before.remove = loConcat(moduleExports.before.remove, authorizeNormalize, authorizeHook);

//---- AFTER ---
// moduleExports.after.create = loConcat(moduleExports.after.create);
// moduleExports.after.find = loConcat(discardFields, moduleExports.after.find);
// moduleExports.after.get = loConcat(discardFields, moduleExports.after.get);
// moduleExports.after.update = loConcat(discardFields, moduleExports.after.update);
// moduleExports.after.patch = loConcat(discardFields, moduleExports.after.patch);
// moduleExports.after.remove = loConcat(discardFields, moduleExports.after.remove);


module.exports = moduleExports;
