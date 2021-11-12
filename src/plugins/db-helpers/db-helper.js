/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const logger = require('../../logger');
const {
  getOpcuaTags,
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
const loConcat = require('lodash/concat');
const loOmit = require('lodash/omit');
const loIsObject = require('lodash/isObject');
const loIsString = require('lodash/isString');
const loIsInteger = require('lodash/isInteger');
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
  return getOpcuaSaveModeToDB() !== 'no';
};

/**
 * @name isRemoteOpcuaToDB
 * @returns {Boolean}
 */
const isRemoteOpcuaToDB = function () {
  const saveMode = getOpcuaSaveModeToDB();
  return (saveMode === 'remoteAdd') || (saveMode === 'remoteUpdate');
};

/**
 * @name isUpdateOpcuaToDB
 * @returns {Boolean}
 */
const isUpdateOpcuaToDB = function () {
  const saveMode = getOpcuaSaveModeToDB();
  return (saveMode === 'localUpdate') || (saveMode === 'remoteUpdate');
};

/**
 * @method getOpcuaSaveModeToDB
 * @returns {String}
 * e.g. (localAdd|localUpdate|remoteAdd|remoteUpdate|no)
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
 * @method saveOpcuaGroupValue
 * @async
 * 
 * @param {Object} app
 * @param {String} browseName 
 * @param {String|Object} value 
 * @returns {Object}
 */
const saveOpcuaGroupValue = async function (app, browseName, value) {
  let tags, opcuaValue, opcuaValues = [], groupItems = [];
  let savedValue = null, findedItem, idField, itemId;
  //----------------------------------------------------------

  if (!isSaveOpcuaToDB()) return;

  if (loIsString(value)) {
    opcuaValue = JSON.parse(value);
  }

  if (loIsObject(value)) {
    opcuaValue = value;
  }

  tags = await findItems(app, 'opcua-tags', { browseName });
  if (tags.length) {
    const tag = tags[0];
    // Exit else tag is disable
    if (tag.isEnable === false) return savedValue;
    // Get group items
    groupItems = await findItems(app, 'opcua-tags', { ownerGroup: browseName });
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

    if (isLog) inspector('db-helper.saveOpcuaGroupValue.data:', data);

    if (isRemoteOpcuaToDB()) {
      const remoteDbUrl = getOpcuaRemoteDbUrl();
      const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
      if (appRestClient) {
        if (isUpdateOpcuaToDB()) {
          findedItem = await findItem(appRestClient, 'opcua-values', { tagName: tag.browseName, $sort: { updatedAt: -1 }, });
          if (!findedItem) {
            savedValue = await createItem(appRestClient, 'opcua-values', data);
          } else {
            idField = getIdField(findedItem);
            itemId = findedItem[idField];
            savedValue = await patchItem(appRestClient, 'opcua-values', itemId, data);
          }
        } else {
          savedValue = await createItem(appRestClient, 'opcua-values', data);
        }
      }
    } else {
      if (isUpdateOpcuaToDB()) {
        findedItem = await findItem(app, 'opcua-values', { tagName: tag.browseName, $sort: { updatedAt: -1 }, });
        if (!findedItem) {
          savedValue = await createItem(app, 'opcua-values', data);
        } else {
          idField = getIdField(findedItem);
          itemId = findedItem[idField];
          savedValue = await patchItem(app, 'opcua-values', itemId, data);
        }
      } else {
        savedValue = await createItem(app, 'opcua-values', data);
      }
    }
    if (isLog) inspector('db-helper.saveOpcuaValue.savedValue:', savedValue);
  }
  return savedValue;
};

/**
 * @method removeOpcuaValues
 * @async
 * 
 * @param {Object} app 
 * @param {Boolean} isRemote 
 * @returns {Number}
 */
const removeOpcuaValues = async function (app, isRemote = false) {
  let count = 0, removedItems;
  //-------------------------
  if (isRemote) {
    // Get opcua tags 
    const opcuaTags = getOpcuaTags();
    if (isLog) inspector('db-helper.removeOpcuaValues.opcuaTags:', opcuaTags);
    for (let index = 0; index < opcuaTags.length; index++) {
      const tag = opcuaTags[index];
      if (tag.type !== 'object') {
        removedItems = await removeItems(app, 'opcua-values', { tagName: tag.browseName });
        if (removedItems.length) {
          count = count + removedItems.length;
        }
      }
    }
  } else {
    removedItems = await removeItems(app, 'opcua-values');
    if (removedItems.length) {
      count = count + removedItems.length;
    }
  }
  return count;
};

/**
 * @method saveOpcuaTags
 * @async
 * 
 * @param {Object} app 
 * @param {Boolean} isRemote 
 * @returns {Object}
 * e.g. { added: 123, updated: 32, deleted: 12, total: 125}
 */
const saveOpcuaTags = async function (app, isRemote = false) {
  let idField, tagId, query = {};
  let tagFromDB = null, tagsFromDB = [], tagBrowseNames = [], objTagBrowseNames = [];
  let addedBrowseNames = [], updatedBrowseNames = [], deletedBrowseNames = [];
  let added = 0, updated = 0, deleted = 0, total = 0;
  //------------------------------------------------------------
  // Get opcua tags 
  const opcuaTags = getOpcuaTags();
  if (isLog) inspector('db-helper.saveOpcuaTags.opcuaTags:', opcuaTags);
  for (let index = 0; index < opcuaTags.length; index++) {
    const tag = opcuaTags[index];
    tagBrowseNames.push(tag.browseName);
    if (tag.type === 'object') {
      objTagBrowseNames.push(tag.browseName);
    }
    tagsFromDB = await findItems(app, 'opcua-tags', { browseName: tag.browseName });
    if (tagsFromDB.length) {
      tagFromDB = tagsFromDB[0];
      idField = getIdField(tagFromDB);
      tagId = tagFromDB[idField];
      const omit = [idField, 'createdAt', 'updatedAt', '__v'];
      let equalTags = isDeepEqual(tag, tagFromDB, omit, isRemote);
      // Update db tag
      if (!equalTags) {
        tagFromDB = await patchItem(app, 'opcua-tags', tagId, tag);
        if (tagFromDB) {
          updatedBrowseNames.push(tag.browseName);
          updated = updated + 1;
        }
        // Check equal tags again
        equalTags = isDeepStrictEqual(tag, tagFromDB, omit);
        // Else equalTags = false, then delete tag
        if (!equalTags) {
          tagFromDB = await removeItem(app, 'opcua-tags', tagId);
          if (tagFromDB) {
            deletedBrowseNames.push(tagFromDB.browseName);
            deleted = deleted + 1;
            // Add tag
            tagFromDB = await createItem(app, 'opcua-tags', tag);
            if (tagFromDB) {
              addedBrowseNames.push(tagFromDB.browseName);
              added = added + 1;
            }

          }
        }
      }
    } else {
      tagFromDB = await createItem(app, 'opcua-tags', tag);
      if (tagFromDB) {
        addedBrowseNames.push(tagFromDB.browseName);
        added = added + 1;
      }
    }
  }

  // --- Delete all tags from local or remote DB ---
  if (isRemote) {
    // Find all tags that are not in `tagBrowseNames` list 
    // and are in `objTagBrowseNames` list
    // e.g. query = { ownerName: { $in: objTagBrowseNames } }
    query = { ownerName: { $in: objTagBrowseNames } };
  } else {
    // Find all tags that are not in `tagBrowseNames` list
    // e.g. query = { browseName: { $nin: tagBrowseNames } }
    query = { browseName: { $nin: tagBrowseNames } };
  }
  tagsFromDB = await findItems(app, 'opcua-tags', query);
  if (tagsFromDB.length) {
    idField = getIdField(tagsFromDB[0]);
    if (isRemote) {
      tagsFromDB = tagsFromDB.filter(tag => !tagBrowseNames.includes(tag.browseName));
    }
    for (let index = 0; index < tagsFromDB.length; index++) {
      const tag = tagsFromDB[index];
      tagId = tag[idField];
      tagFromDB = await removeItem(app, 'opcua-tags', tagId);
      if (tagFromDB) {
        deleted++;
        deletedBrowseNames.push(tag.browseName);
      }
    }
  }

  // Get total rows
  total = await getCountItems(app, 'opcua-tags');

  if (added) {
    if (isLog) inspector('db-helper.saveOpcuaTags.addedTags:', addedBrowseNames);
  }
  if (updated) {
    if (isLog) inspector('db-helper.saveOpcuaTags.updatedTags:', updatedBrowseNames);
  }
  if (deleted) {
    if (isLog) inspector('db-helper.saveOpcuaTags.deletedTags:', deletedBrowseNames);
  }

  return { added, updated, deleted, total };
};

/**
 * @name integrityCheckOpcua
 * @async
 * 
 * @param {Object} app 
 * @param {Boolean} isRemote 
 * @returns {Boolean}
 */
const integrityCheckOpcua = async function (app, isRemote = false) {
  let idField, tagId, tagFromDB, tagsFromDB, _tagsFromDB, valuesFromDB, query, result = true;
  let deleted = 0, deletedBrowseNames = [], objTagBrowseNames = [], tagBrowseNames = [];
  //---------------------------------------------------------------
  // Get opcua tags 
  const opcuaTags = getOpcuaTags();
  if (isLog) inspector('db-helper.integrityCheckOpcua.opcuaTags:', opcuaTags);

  objTagBrowseNames = opcuaTags.filter(tag => tag.type === 'object').map(tag => tag.browseName);
  tagBrowseNames = opcuaTags.map(tag => tag.browseName);

  /** 
  
  */

  // Get 'object' tags
  if (isRemote) {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: 'object', browseName: { $in: objTagBrowseNames } });
  } else {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: 'object' });
  }
  // Remove 'object' tags that have no child tags
  if (tagsFromDB.length) {
    const idField = getIdField(tagsFromDB[0]);
    for (let index = 0; index < tagsFromDB.length; index++) {
      const tag = tagsFromDB[index];
      const tagId = tag[idField];
      _tagsFromDB = await findItems(app, 'opcua-tags', { ownerName: tag.browseName });
      if (!_tagsFromDB.length) {
        const tagFromDB = await removeItem(app, 'opcua-tags', tagId);
        if (tagFromDB) {
          deletedBrowseNames.push(tagFromDB.browseName);
          deleted++;
        }
      }
    }
    if (deleted) {
      logger.error(`db-helper.integrityCheckOpcua.Remove 'object' tags that have no child tags: ${deleted}`);
      if (isLog) inspector('db-helper.integrityCheckOpcua.Remove \'object\' tags that have no child tags:', deletedBrowseNames);
      deleted = 0;
      deletedBrowseNames = [];
      result = false;
    }
  }
  // Get all 'variables' tags
  if (isRemote) {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: { $ne: 'object' }, ownerName: { $in: objTagBrowseNames } });
  } else {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: { $ne: 'object' } });
  }
  // Remove 'variables' tags that have no owner tags
  if (tagsFromDB.length) {
    const idField = getIdField(tagsFromDB[0]);
    for (let index = 0; index < tagsFromDB.length; index++) {
      const tag = tagsFromDB[index];
      const tagId = tag[idField];
      _tagsFromDB = await findItems(app, 'opcua-tags', { type: 'object', browseName: tag.ownerName });
      if (!_tagsFromDB.length) {
        const tagFromDB = await removeItem(app, 'opcua-tags', tagId);
        if (tagFromDB) {
          deletedBrowseNames.push(tagFromDB.browseName);
          deleted++;
        }
      }
    }
    if (deleted) {
      logger.error(`db-helper.integrityCheckOpcua.Remove 'variables' tags that have no owner tags: ${deleted}`);
      if (isLog) inspector('db-helper.integrityCheckOpcua.Remove \'variables\' tags that have no owner tags:', deletedBrowseNames);
      deleted = 0;
      deletedBrowseNames = [];
      result = false;
    }
  }

  // Get all 'ownerGroup' tags
  if (isRemote) {
    tagsFromDB = await findItems(app, 'opcua-tags', { group: true, ownerName: { $in: objTagBrowseNames } });
  } else {
    tagsFromDB = await findItems(app, 'opcua-tags', { group: true });
  }

  // Remove 'ownerGroup' tags that have no 'childGroup' tags
  if (tagsFromDB.length) {
    const idField = getIdField(tagsFromDB[0]);
    for (let index = 0; index < tagsFromDB.length; index++) {
      const tag = tagsFromDB[index];
      const tagId = tag[idField];
      _tagsFromDB = await findItems(app, 'opcua-tags', { ownerGroup: tag.browseName });
      if (!_tagsFromDB.length) {
        const tagFromDB = await removeItem(app, 'opcua-tags', tagId);
        if (tagFromDB) {
          deletedBrowseNames.push(tagFromDB.browseName);
          deleted++;
        }
      }
    }
    if (deleted) {
      logger.error(`db-helper.integrityCheckOpcua.Remove 'ownerGroup' tags that have no 'childGroup' tags: ${deleted}`);
      if (isLog) inspector('db-helper.integrityCheckOpcua.Remove \'ownerGroup\' tags that have no \'childGroup\' tags:', deletedBrowseNames);
      deleted = 0;
      deletedBrowseNames = [];
      result = false;
    }
  }

  // Get all 'childGroup' tags
  if (isRemote) {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: { $ne: 'object' }, group: { $ne: true }, ownerName: { $in: objTagBrowseNames } });
  } else {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: { $ne: 'object' }, group: { $ne: true } });
  }
  // Remove 'childGroup' tags that have no 'ownerGroup' tags
  if (tagsFromDB.length) {
    const idField = getIdField(tagsFromDB[0]);
    for (let index = 0; index < tagsFromDB.length; index++) {
      const tag = tagsFromDB[index];
      const tagId = tag[idField];
      _tagsFromDB = await findItems(app, 'opcua-tags', { group: true, browseName: tag.ownerGroup });
      if (!_tagsFromDB.length) {
        const tagFromDB = await removeItem(app, 'opcua-tags', tagId);
        if (tagFromDB) {
          deletedBrowseNames.push(tagFromDB.browseName);
          deleted++;
        }
      }
    }
    if (deleted) {
      logger.error(`db-helper.integrityCheckOpcua.Remove 'childGroup' tags that have no 'ownerGroup' tags: ${deleted}`);
      if (isLog) inspector('db-helper.integrityCheckOpcua.Remove \'childGroup\' tags that have no \'ownerGroup\' tags:', deletedBrowseNames);
      deleted = 0;
      deletedBrowseNames = [];
      result = false;
    }
  }
  /** 
  // Remove opcua values that have no 'owner' tags
  const cb = async function (data, app) {
    const idField = getIdField(data[0]);
    for (let index = 0; index < data.length; index++) {
      const value = data[index];
      const valueId = value[idField];
      const tagName = value['tagName'];
      const tag = await findItem(app, 'opcua-tags', { browseName: tagName });
      if (!tag) {
        const removedItem = await removeItem(app, 'opcua-values', valueId);
        deleted++;
        deletedBrowseNames.push(removedItem.tagName);
      }
    }
  };
  await handleFoundItems(app, 'opcua-values', {}, cb);
  if (deleted) {
    logger.error(`db-helper.integrityCheckOpcua.Remove 'OpcuaValues' that have no 'owner' tags: ${deleted}`);
    if (isLog) inspector('db-helper.integrityCheckOpcua.Remove \'childGroup\' tags that have no \'ownerGroup\' tags:', deletedBrowseNames);
    deleted = 0;
    deletedBrowseNames = [];
    result = false;
  }
  */
  /** 
  if (!isRemote) {
    const removedItems = await removeItems(app, 'opcua-values');
    if (removedItems.length) {
      deleted = removedItems.length;
      deletedBrowseNames = removedItems.map(item => item.browseName);
      logger.error(`db-helper.integrityCheckOpcua.Remove all opcua values if !isRemote: ${deleted}`);
      if (isLog) inspector('db-helper.integrityCheckOpcua.Remove all opcua values if !isRemote:', deletedBrowseNames);
      deleted = 0;
      deletedBrowseNames = [];
      result = false;
    }
  }
  */

  // Remove opcua values that have no 'ownerGroup' tags
  // tagsFromDB = await findItems(app, 'opcua-tags', { type: { $ne: 'object' } });
  if (isRemote) {
    tagsFromDB = await findItems(app, 'opcua-tags', { group: true, ownerName: { $in: objTagBrowseNames } });
  } else {
    tagsFromDB = await findItems(app, 'opcua-tags', { group: true });
  }

  tagsFromDB = tagsFromDB.map(tag => tag.browseName);
  valuesFromDB = await findItems(app, 'opcua-values', { tagName: { $nin: tagsFromDB } });
  for (let index = 0; index < valuesFromDB.length; index++) {
    let value = valuesFromDB[index];
    const idField = getIdField(value);
    const valueId = value[idField];
    const removedItem = await removeItem(app, 'opcua-values', valueId);
    deleted++;
    deletedBrowseNames.push(removedItem.tagName);
  }
  if (deleted) {
    logger.error(`db-helper.integrityCheckOpcua.Remove opcua values that have no 'ownerGroup' tags: ${deleted}`);
    if (isLog) inspector('db-helper.integrityCheckOpcua.Remove opcua values that have no \'ownerGroup\' tags:', deletedBrowseNames);
    deleted = 0;
    deletedBrowseNames = [];
    result = false;
  }

  return result;
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
  let newQuery, findResults;
  //--------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      newQuery = loMerge({}, query, { query: { $limit: 0 } });
    } else {
      newQuery = loMerge({}, query, { $limit: 0 });
      newQuery = { query: newQuery };
    }
    findResults = await service.find(newQuery);
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
 * Find item
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} query
 * @return {Object}
 */
const findItem = async function (app, path = '', query = {}) {
  let newParams, findResults;
  //----------------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      newParams = loMerge({}, query, { query: { $limit: 1 } });
    } else {
      newParams = loMerge({}, { query }, { query: { $limit: 1 } });
    }
    findResults = await service.find(newParams);
    if (isLog) inspector(`findItems(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
    // inspector(`findItems(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
    return findResults.data.length ? findResults.data[0] : null;
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
  let newParams, findResults, findData = [];
  //----------------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      newParams = loMerge({}, query);
    } else {
      newParams = loMerge({}, { query });
    }
    findResults = await service.find(newParams);
    if (isLog) inspector(`findItems(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
    if (findResults.data.length) {
      const total = findResults.total;
      const limit = findResults.limit;
      const cyclesNumber = Math.trunc(total / limit);
      findData = loConcat(findData, findResults.data);
      for (let index = 1; index <= cyclesNumber; index++) {
        const skip = index * limit;
        newParams = loMerge({}, newParams, { query: { $skip: skip } });
        findResults = await service.find(newParams);
        findData = loConcat(findData, findResults.data);
      }
    }
    return findData;
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
  let newParams, findResults, findData = [];
  //--------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      newParams = loMerge({}, query, { paginate: false });
    } else {
      newParams = loMerge({}, { query }, { paginate: false });
    }
    findResults = await service.find(newParams);
    if (isLog) inspector(`findItems(path='${path}', query=${JSON.stringify(newParams)}).findResults:`, findResults);
    if (!Array.isArray(findResults) && findResults.data.length) {
      const total = findResults.total;
      const limit = findResults.limit;
      const cyclesNumber = Math.trunc(total / limit);
      findData = loConcat(findData, findResults.data);
      for (let index = 1; index <= cyclesNumber; index++) {
        const skip = index * limit;
        newParams = loMerge({}, newParams, { query: { $skip: skip } });
        findResults = await service.find(newParams);
        findData = loConcat(findData, findResults.data);
      }
    }
    return Array.isArray(findResults) ? findResults : findData;
  } else {
    throw new errors.BadRequest(`There is no service for the path - '${path}'`);
  }
};

/**
 * Process found items
 * @async
 * 
 * @param {Object} app
 * @param {String} path
 * @param {Object} query
 * @param {Function} cb
 * @return {Object[]}
 */
const handleFoundItems = async function (app, path = '', query = {}, cb = null) {
  let newParams, findResults, findData = [], handledData = [], handledResult;
  //----------------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      newParams = loMerge({}, query);
    } else {
      newParams = loMerge({}, { query });
    }
    findResults = await service.find(newParams);
    if (isLog) inspector(`findItems(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
    if (findResults.data.length) {
      const total = findResults.total;
      const limit = findResults.limit;
      const cyclesNumber = Math.trunc(total / limit);
      if (cb) {
        handledResult = await cb(findResults.data, app);
        if (handledResult !== undefined) handledData.push(handledResult);
      } else {
        findData = loConcat(findData, findResults.data);
      }
      for (let index = 1; index <= cyclesNumber; index++) {
        const skip = index * limit;
        newParams = loMerge({}, newParams, { query: { $skip: skip } });
        findResults = await service.find(newParams);
        if (cb) {
          handledResult = await cb(findResults.data, app);
          if (handledResult !== undefined) handledData.push(handledResult);
        } else {
          findData = loConcat(findData, findResults.data);
        }
      }
    }
    return cb ? handledData : findData;
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
  let deleteResults = [];
  const service = app.service(path);
  if (service) {
    if (query.query) {
      deleteResults = await service.remove(null, query);
    } else {
      deleteResults = await service.remove(null, { query });
    }
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
  let patchResults;
  //-------------------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      patchResults = await service.patch(null, data, query);
    } else {
      patchResults = await service.patch(null, data, { query });
    }
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
  isRemoteOpcuaToDB,
  isUpdateOpcuaToDB,
  getOpcuaSaveModeToDB,
  getOpcuaRemoteDbUrl,
  getIdField,
  saveOpcuaGroupValue,
  removeOpcuaValues,
  saveOpcuaTags,
  integrityCheckOpcua,
  //-------------------
  getCountItems,
  getItem,
  findItem,
  findItems,
  findAllItems,
  handleFoundItems,
  removeItem,
  removeItems,
  patchItem,
  patchItems,
  createItem,
  createItems
};
