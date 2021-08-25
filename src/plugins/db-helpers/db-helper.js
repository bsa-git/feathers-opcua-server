/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const logger = require('../../logger');
const {
  getOpcuaConfigsForMe,
} = require('../opcua/opcua-helper');
const {
  inspector,
  isDeepEqual,
  isDeepStrictEqual,
  getInt,
  urlExists
} = require('../lib');
const {
  localStorage,
  loginLocal,
  feathersClient,
  AuthServer
} = require('../auth');

const loMerge = require('lodash/merge');
const loOmit = require('lodash/omit');
const loIsObject = require('lodash/isObject');
const loIsString = require('lodash/isString');
const loForEach = require('lodash/forEach');
const loIsEqual = require('lodash/isEqual');

const chalk = require('chalk');

const debug = require('debug')('app:db-helper');
const isLog = false;
const isDebug = false;

/**
 * @method getMssqlDatasetForProvider
 * @param {MssqlTedious} db 
 * @returns {Object}
 */
const getMssqlDatasetForProvider = (db) => {
  return {
    db: {
      currentState: db.getCurrentState()
    }
  };
};

/**
 * @method isMssqlDatasetInList
 * @param {MssqlDatasets} service 
 * @param {String} id 
 * @returns {Boolean}
 */
const isMssqlDatasetInList = (service, id) => {
  const mssqlDataset = service.mssqlDatasets.find(obj => obj.id === id);
  return !!mssqlDataset;
};

/**
 * @method getIdFromMssqlConfig
 * @param {Object} config 
 * @returns {String}
 */
const getIdFromMssqlConfig = (config) => {
  const id = config.server +
    `${config.options.instanceName ? '.' + config.options.instanceName : ''}` +
    `.${config.options.database}`;
  return id;
};

/**
 * @method getMssqlConfigFromEnv
 * @param {Object} config 
 * @param {String} prefix 
 * @returns {Object}
 */
const getMssqlConfigFromEnv = (config, prefix) => {
  let idParts = [], server = '', instanceName = '', database = '';
  //---------------------------------------------------------------
  let _config = loMerge({}, config);
  const id = process.env[`${prefix}_ID`];
  const user = process.env[`${prefix}_USER`];
  const pass = process.env[`${prefix}_PASS`];
  idParts = id.split('.');
  if (idParts.length === 3) {
    server = idParts[0];
    instanceName = idParts[1];
    database = idParts[2];
    _config.options.instanceName = instanceName;
  } else {
    _config = loOmit(_config, ['options.instanceName']);
    server = idParts[0];
    database = idParts[1];
  }

  _config.server = server;
  _config.options.database = database;
  _config.authentication.options.userName = user;
  _config.authentication.options.password = pass;
  if (isLog) inspector('getMssqlConfigFromEnv._config:', _config);
  return _config;
};

/**
 * Get dbNullIdValue
 * e.g. for mongodb -> '000000000000000000000000'
 * e.g. for nedb -> '0000000000000000'
 * @return {*}
 */
const dbNullIdValue = function () {
  let result = null;
  if (getEnvTypeDB() === 'mongodb') result = '000000000000000000000000';
  if (getEnvTypeDB() === 'nedb') result = '0000000000000000';
  return result;
};

/**
 * @name getEnvTypeDB
 * Get DB type from env and host config
 * @returns {String}
 * e.g. 'nedb'|'mongodb'
 */
const getEnvTypeDB = function () {
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.hostTypeDB);
  return myConfig ? myConfig.hostTypeDB : process.env.DEFAULT_TYPE_DB;
};

/**
 * @name isSaveOpcuaToDB
 * @returns {Boolean}
 */
const isSaveOpcuaToDB = function () {
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.opcuaSaveModeToDB === 'no');
  return !myConfig;
};

/**
 * @method getOpcuaSaveModeToDB
 * @returns {String}
 * e.g. (local|remote|no)
 */
const getOpcuaSaveModeToDB = function () {
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.opcuaSaveModeToDB);
  return myConfig ? myConfig.opcuaSaveModeToDB : process.env.DEFAULT_OPCUA_SAVEMODE_TODB;
};

/**
 * @method getOpcuaRemoteDbUrl
 * @returns {String}
 * e.g. http://localhost:3131
 */
const getOpcuaRemoteDbUrl = function () {
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.opcuaRemoteDbUrl);
  return myConfig ? myConfig.opcuaRemoteDbUrl : process.env.DEFAULT_OPCUA_REMOTE_DB_URL;
};

/**
 * @name getEnvTypeDB
 * Get DB adapter from env and host config
 * @returns {String}
 * e.g. 'feathers-nedb'|'feathers-mongoose'
 */
const getEnvAdapterDB = function () {
  let envAdapterDB = 'feathers-nedb';
  const envTypeDB = getEnvTypeDB();
  switch (envTypeDB) {
  case 'nedb':
    envAdapterDB = 'feathers-nedb';
    break;
  case 'mongodb':
    envAdapterDB = 'feathers-mongoose';
    break;
  default:
    break;
  }
  return envAdapterDB;
};

/**
   * Get id field
   * @param {Array|Object} items
   * @return {string}
   */
const getIdField = function (items) {
  let idField = '';
  if (Array.isArray(items) && items.length) {
    idField = 'id' in items[0] ? 'id' : '_id';
  }
  if (loIsObject(items) && Object.keys(items).length) {
    idField = 'id' in items ? 'id' : '_id';
  }
  return idField ? idField : new Error('Items argument is not an array or object');
};

/**
 * @name saveOpcuaGroupValue
 * @async
 * 
 * @param {Object} app
 * @param {String} browseName 
 * @param {String|Object} value 
 * @returns {Object}
 */
const saveOpcuaGroupValue = async function (app, browseName, value) {
  let tags, opcuaValue, opcuaValues = [], groupItems = [], savedValue = null;
  //----------------------------------------------------------

  if (loIsString(value)) {
    opcuaValue = JSON.parse(value);
  }
  tags = await findItems(app, 'opcua-tags', { browseName });
  if (tags.length) {
    const tag = tags[0];
    // Exit else tag is disable
    if (tag.isDisable) return savedValue;
    // Get group items
    groupItems = await findAllItems(app, 'opcua-tags', { ownerGroup: browseName });
    // Normalize opcuaValue
    loForEach(opcuaValue, (value, key) => {
      const findedKey = groupItems.find(item => (item.browseName === key) || (item.aliasName === key));
      if (findedKey) {
        key = findedKey.browseName;
        if (value === null) {
          value = getInt(value);
        }
        opcuaValues.push({ key, value });
      }
    });
    const data = {
      tagName: tag.browseName,
      values: opcuaValues
    };

    const isRemote = (getOpcuaSaveModeToDB() === 'remote');
    if (isRemote) {
      const remoteDbUrl = getOpcuaRemoteDbUrl();
      try {
        // await urlExists(remoteDbUrl);
        const appRestClient = feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
        savedValue = await createItem(appRestClient, 'opcua-values', data);
      } catch (error) {
        if(error.code === 'ENOTFOUND'){
          console.log(chalk.red('error:'), 'db-helper.saveOpcuaGroupValue.remoteDB:', chalk.cyan(`Remote DB url "${error.hostname}" does not exist!`));
        } else {
          console.log(chalk.red('error:'), 'db-helper.saveOpcuaGroupValue.remoteDB:', chalk.cyan(`${error.message}!`));
        }
      }
    } else {
      savedValue = await createItem(app, 'opcua-values', data);
    }
    if (isLog) inspector('db-helper.saveOpcuaValue.savedValue:', savedValue);
  }
  return savedValue;
};

/**
 * @name saveOpcuaTags
 * @async
 * 
 * @param {Object} app 
 * @param {Object[]} tags 
 * @param {Boolean} isRemote 
 * @returns {Object}
 * e.g. { added: 123, updated: 32, deleted: 12, total: 125}
 */
const saveOpcuaTags = async function (app, tags, isRemote = false) {
  let tagFromDB = null, tagBrowseNames = [], added = 0, updated = 0, deleted = 0, total = 0;
  //------------------------------------------------------------
  for (let index = 0; index < tags.length; index++) {
    const tag = tags[index];
    tagBrowseNames.push(tag.browseName);
    tagFromDB = await findItems(app, 'opcua-tags', { browseName: tag.browseName });
    if (tagFromDB.length) {
      tagFromDB = tagFromDB[0];
      const idField = getIdField(tagFromDB);
      const tagId = tagFromDB[idField];
      tagFromDB = loOmit(tagFromDB, [idField, 'createdAt', 'updatedAt', '__v']);
      let equalTags = isDeepEqual(tag, tagFromDB);
      // Update db tag
      if (!equalTags) {
        tagFromDB = await patchItem(app, 'opcua-tags', tagId, tag);
        if (tagFromDB) updated = updated + 1;

        // Check equal tags again
        equalTags = isDeepStrictEqual(tag, tagFromDB);
        // Else equalTags = false, then delete tag
        if (!equalTags) {
          // inspector('db-helper.saveOpcuaTags.tagFromDB:', tagFromDB);
          // inspector('db-helper.saveOpcuaTags.tag:', tag);
          tagFromDB = await removeItem(app, 'opcua-tags', tagId);
          if (tagFromDB) {
            deleted = deleted + 1;
            // Add tag
            tagFromDB = await createItem(app, 'opcua-tags', tag);
            if (tagFromDB) added = added + 1;
          }
        }
      }
    } else {
      tagFromDB = await createItem(app, 'opcua-tags', tag);
      if (tagFromDB) added = added + 1;
    }
  }
  // Delete all tags that are not in `tagBrowseNames` list
  if (!isRemote) {
    tagFromDB = await removeItems(app, 'opcua-tags', { browseName: { $nin: tagBrowseNames } });
    if (tagFromDB.length) deleted = deleted + tagFromDB.length;
  }

  // Get total rows
  total = await getCountItems(app, 'opcua-tags');

  return { added, updated, deleted, total };
};

//================================================================================

/**
 * Get count items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} query
 * @return {Number}
 */
const getCountItems = async function (app, path = '', query = {}) {
  const service = app.service(path);
  if (service) {
    const newQuery = loMerge({}, query, { $limit: 0 });
    let findResults = await service.find({ query: newQuery });
    findResults = findResults.total;
    if (isDebug) inspector(`getCountItems(path='${path}', query=${JSON.stringify(newQuery)}).findResults:`, findResults);
    return findResults;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
   * Get item
   * @async
   * 
   * @param {Object} app
   * @param {String} path
   * @param {String} id
   * @return {Object}
   */
const getItem = async function (app, path = '', id = null) {
  const service = app.service(path);
  if (service) {
    const getResult = await service.get(id);
    if (isLog) inspector(`getItem(path='${path}', id='${id}').getResult:`, getResult);
    return getResult;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Find items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} query
 * @return {Object[]}
 */
const findItems = async function (app, path = '', query = {}) {
  const service = app.service(path);
  if (service) {
    let findResults = await service.find({ query });
    findResults = (query['$limit'] === 0) ? findResults.total : findResults.data;
    if (isLog) inspector(`findItems(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
    return findResults;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Find all items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} query
 * @return {Object[]}
 */
const findAllItems = async function (app, path = '', query = {}) {
  const service = app.service(path);
  if (service) {
    const newParams = loMerge({}, { query }, { paginate: false });
    let findResults = await service.find(newParams);
    if (isLog) inspector(`findItems(path='${path}', query=${JSON.stringify(newParams)}).findResults:`, findResults);
    return findResults;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Remove item
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {String} id
 * @return {Object}
 */
const removeItem = async function (app, path = '', id = null) {
  // id = id.toString();
  const service = app.service(path);
  if (service) {
    const removeResult = await service.remove(id);
    if (isLog) inspector(`removeItem(path='${path}', id=${id}).removeResult:`, removeResult);
    return removeResult;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Remove items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} query
 * @return {Object[]}
 */
const removeItems = async function (app, path = '', query = {}) {
  let findResults = [], deleteResults = [];
  const service = app.service(path);
  if (service) {
    deleteResults = await service.remove(null, { query });
    if (isLog) inspector(`removeItems(path='${path}', query=${JSON.stringify(query)}).removeResults:`, deleteResults);
    return deleteResults;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Patch item
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {String} id
 * @param {Object} data
 * @return {Object}
 */
const patchItem = async function (app, path = '', id = '', data = {}) {
  const service = app.service(path);
  if (service) {
    const patchResults = await service.patch(id, data);
    if (isLog) inspector(`patchItems(path='${path}', data=${JSON.stringify(data)}, patchResults:`, patchResults);
    return patchResults;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Patch items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} data
 * @param {Object} query
 * @return {Object[]}
 */
const patchItems = async function (app, path = '', data = {}, query = {}) {
  const service = app.service(path);
  if (service) {
    const patchResults = await service.patch(null, data, { query });
    if (isLog) inspector(`patchItems(path='${path}', data=${JSON.stringify(data)}, query=${JSON.stringify(query)}).patchResults:`, patchResults);
    return patchResults;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Create item
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} data
 * @return {Object}
 */
const createItem = async function (app, path = '', data = {}) {
  const service = app.service(path);
  if (service) {
    const createResult = await service.create(data);
    if (isLog) inspector(`createItem(path='${path}', createResults:`, createResult);
    return createResult;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Create items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object[]} data
 * @return {Object[]}
 */
const createItems = async function (app, path = '', data = []) {
  let createResults = [];
  const service = app.service(path);
  if (service) {
    for (let index = 0; index < data.length; index++) {
      const item = data[index];
      const createdItem = await service.create(item);
      createResults.push(createdItem);
    }
    if (isLog) inspector(`createItems(path='${path}', createResults.length:`, createResults.length);
    return createResults;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

module.exports = {
  getMssqlDatasetForProvider,
  isMssqlDatasetInList,
  getIdFromMssqlConfig,
  getMssqlConfigFromEnv,
  dbNullIdValue,
  getEnvTypeDB,
  getEnvAdapterDB,
  isSaveOpcuaToDB,
  getOpcuaSaveModeToDB,
  getOpcuaRemoteDbUrl,
  getIdField,
  saveOpcuaGroupValue,
  saveOpcuaTags,
  getCountItems,
  getItem,
  findItems,
  findAllItems,
  removeItem,
  removeItems,
  patchItem,
  patchItems,
  createItem,
  createItems
};
