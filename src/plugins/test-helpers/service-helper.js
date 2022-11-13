/* eslint-disable no-unused-vars */
const { join } = require('path');
const errors = require('@feathersjs/errors');
const seedService = require('./seed-service');
const fakeNormalize = require('./fake-normalize');
const { appRoot, typeOf } = require('../lib');
const debug = require('debug')('app:plugin.service-helper');

const isLog = false;
const isDebug = false;

// Get fake data
const fakeData = fakeNormalize();
// Get feathers-gen-specs.json
const specsPath = join(appRoot, '/config/feathers-specs.json');
const genSpecs = require(specsPath);
const appPath = join(appRoot, genSpecs.app.src, 'app');

/**
 * Clear cache app
 * @method clearCacheApp
 * @return {Object}
 */
const clearCacheApp = function() {
  // Restarting app.*s is required if the last mocha test did REST calls on its server.
  delete require.cache[require.resolve(appPath)];
  const app = require(appPath);
  return app;
};


/**
 * Get fake data
 * e.g. {users: [{id: 1234, email: 'my@test.com', ...}, {id: 1235, email: 'my2@test.com', ...}], ...}
 * @return {Object}
 */
const getFakeData = function(){
  return  fakeData;
};

/**
 * Get service fields
 * @param serviceName
 * @param isId
 * @return {Array.<*>}
 */
const serviceFields = function(serviceName = '', isId = false) {
  const serviceFakeData = fakeData[serviceName][0];
  const idField = 'id' in serviceFakeData ? 'id' : '_id';
  const fields = Object.keys(serviceFakeData).filter(key => isId ? true : key !== idField);
  if (isLog) debug('serviceFields.fields:', fields);
  return fields;
};

/**
 * Get service paths
 * @return {Array}
 */
const getServicePaths = function() {
  const loKebabCase = require('lodash/kebabCase');
  const paths = Object.keys(fakeData).map(key => loKebabCase(key).toLowerCase());
  if (isDebug) debug('getServicePaths:', paths);
  return paths;
};

/**
 * Get fake paths
 * @return {Array}
 */
const getFakePaths = function() {
  const paths = Object.keys(fakeData);
  if (isDebug) debug('getFakePaths:', paths);
  return paths;
};

/**
 * Get id field
 * @param items {Array || Object}
 * @return {string}
 */
const getIdField = function(items) {
  let idField = '';
  if (Array.isArray(items) && items.length) {
    idField = 'id' in items[0] ? 'id' : '_id';
  }
  if (typeOf.isObject(items) && Object.keys(items).length) {
    idField = 'id' in items ? 'id' : '_id';
  }
  if(!idField){
    throw new errors.GeneralError('Items argument is not an array or object');
  }
  return idField ;
};


/**
 * Check services registered
 * @param app {Object}
 * @param path {String}
 * @return {string}
 */
const checkServicesRegistered = function (app, path = '') {
  let errPath = '';
  let result = false;
  let paths = getServicePaths();
  if(path && paths.findIndex(p => p === path) === -1)
    throw new errors.GeneralError(`The path '${path}' is not in the path list`);
  if(path) paths = paths.filter(p => p === path);
  paths.forEach(path => {
    const service = app.service(path);
    result = !!service;
    if(!result) {
      errPath = path;
      return;
    }
  });
  return errPath;
};

/**
 * Save fake data to services
 * @param app {Object}
 * @param path {String}
 * @return {Promise.<string>}
 */
const saveFakesToServices = async function (app, path = '') {
  let errPath = '';
  let result = false;
  let isValid = true;
  let paths = getFakePaths();
  if(path && paths.findIndex(p => p === path) === -1)
    throw new errors.GeneralError(`The path '${path}' is not in the path list`);
  if(path) paths = paths.filter(p => p === path);
  // Run seed service
  const _seedService = async function (path) {
    let result = false;
    const results = await seedService(app, path);
    if (Array.isArray(results) && (results.length === fakeData[path].length)) {
      result = true;
    }
    return result;
  };

  for (let i = 0; isValid && i < paths.length; i++) {
    const path = paths[i];
    result = await _seedService(path);
    if(result === false){
      errPath = path;
      isValid = false;
    }
  }
  return errPath;
};

/**
 * Remove data from services
 * @param app {Object}
 * @param path {String}
 * @return {Promise.<string>}
 */
const removeDataFromServices = async function (app, path = '') {
  let errPath = '';
  let result = false;
  let isValid = true;
  let paths = getFakePaths();
  if(path && paths.findIndex(p => p === path) === -1)
    throw new errors.GeneralError(`The path '${path}' is not in the path list`);
  if(path) paths = paths.filter(p => p === path);
  // Run seed service
  const _seedService = async function (path) {
    let result = false;
    const results = await seedService(app, path, false);
    if (Array.isArray(results) && (results.length === fakeData[path].length)) {
      result = true;
    }
    return result;
  };

  for (let i = 0; isValid && i < paths.length; i++) {
    const path = paths[i];
    result = await _seedService(path);
    if(result === false){
      errPath = path;
      isValid = false;
    }
  }
  return errPath;
};

module.exports = {
  clearCacheApp,
  getFakeData,
  serviceFields,
  getServicePaths,
  getFakePaths,
  getIdField,
  checkServicesRegistered,
  saveFakesToServices,
  removeDataFromServices
};
