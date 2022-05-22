/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const moment = require('moment');
const logger = require('../../logger');
const {
  getOpcuaTags,
  getOpcuaConfigsForMe,
  getOpcuaSaveModeToDB,
  convertAnyToValue
} = require('../opcua/opcua-helper');
const {
  inspector,
  isDeepEqual,
  isDeepStrictEqual,
  getInt,
  getStartOfPeriod,
  getEndOfPeriod,
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
const loToInteger = require('lodash/toInteger');


const chalk = require('chalk');

const debug = require('debug')('app:db-helper');
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
  if (isDebug) inspector('getMssqlConfigFromEnv._config:', _config);
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
  let tags, opcuaValue = null, opcuaValues = [], groupItems = [];
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
  if (opcuaValue && tags.length) {
    const tag = tags[0];
    // Exit else tag is disable
    if (tag.isEnable === false) return savedValue;
    // Get group items
    groupItems = await findItems(app, 'opcua-tags', { ownerGroup: browseName });
    // Normalize opcuaValue
    loForEach(opcuaValue, (value, key) => {
      const findedKey = groupItems.find(item => (item.browseName === key) || (item.aliasName === key));
      if (findedKey) {
        const tagDataType = findedKey.dataType;
        key = findedKey.browseName;
        if (value === null) {
          value = getInt(value);
        }
        opcuaValues.push(Array.isArray(value) ? opcuaValue['!value'] ? { key, items: value, value: opcuaValue['!value'] } : { key, items: value } : { key, value });
      }
    });
    const data = {
      tagName: tag.browseName,
      values: opcuaValues
    };

    if (isDebug) inspector('db-helper.saveOpcuaGroupValue.data:', data);

    if (isRemoteOpcuaToDB()) {
      const remoteDbUrl = getOpcuaRemoteDbUrl();
      const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
      if (appRestClient) {
        if (isUpdateOpcuaToDB()) {
          savedValue = saveOpcuaValues(appRestClient, tag.browseName, data);
        } else {
          savedValue = await createItem(appRestClient, 'opcua-values', data);
        }
      }
    } else {
      if (isUpdateOpcuaToDB()) {
        savedValue = saveOpcuaValues(app, tag.browseName, data);
      } else {
        savedValue = await createItem(app, 'opcua-values', data);
      }
    }
    if (isDebug && savedValue) inspector('db-helper.saveOpcuaValue.savedValue:', savedValue);
  }
  return savedValue;
};

/**
 * @method saveStoreOpcuaGroupValue
 * @async
 * 
 * @param {Object} app
 * @param {String} browseName 
 * @param {String|Object} value 
 * @returns {Object}
 */
const saveStoreOpcuaGroupValue = async function (app, browseName, value) {
  let tag, opcuaValue = null, values = [], savedValues = [];
  let savedValue = null;
  //----------------------------------------------------------

  if (!isSaveOpcuaToDB()) return;

  // Normalize opcuaValue
  if (loIsString(value)) {
    opcuaValue = JSON.parse(value);
  }

  if (loIsObject(value)) {
    opcuaValue = value;
  }

  // Find tag for browseName
  tag = await findItem(app, 'opcua-tags', { browseName });
  if (opcuaValue && tag && tag.store) {
    const store = tag.store;
    // Get group tags
    const groupTags = await findItems(app, 'opcua-tags', { ownerGroup: browseName });
    // Normalize opcuaValue
    loForEach(opcuaValue, (tagValue, tagBrowseName) => {
      const findedGroupTag = groupTags.find(tag => (tag.browseName === tagBrowseName));
      if (findedGroupTag) {
        values = [];
        // Set key to dateTime
        const key = opcuaValue['!value'] ? opcuaValue['!value'].dateTime : moment.utc().format('YYYY-MM-DDTHH:mm:ss');
        if (tagValue === null) {
          tagValue = getInt(tagValue);
        }
        // Get values
        values.push(Array.isArray(tagValue) ? opcuaValue['!value'] ? { key, items: tagValue, value: opcuaValue['!value'] } : { key, items: tagValue } : { key, value: tagValue });
        
        // Set storeEnd
        const storeEnd = key;
        // Get data
        data = {
          tagName: tagBrowseName,
          storeBegin: storeEnd,
          storeEnd,
          values
        };

        // Save store opcua values
        if (isRemoteOpcuaToDB()) {
          const remoteDbUrl = getOpcuaRemoteDbUrl();
          const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
          if (appRestClient) {
            savedValue = saveStoreOpcuaValues(appRestClient, tagBrowseName, data, store);
          }
        } else {
          savedValue = saveStoreOpcuaValues(app, tagBrowseName, data, store);
        }
        if (isDebug && savedValue) inspector('db-helper.saveStoreOpcuaGroupValue.savedValue:', savedValue);
        savedValues.push(savedValue);
      }
    });
  }
  return savedValues;
};

/**
 * @method saveOpcuaValues
 * @param {Object} app 
 * @param {String} browseName 
 * @param {Object} data 
 * @returns {Object}
 */
const saveOpcuaValues = async function (app, browseName, data) {
  let savedValue;
  //--------------------------------------
  const findedItem = await findItem(app, 'opcua-values', { tagName: browseName });
  if (!findedItem) {
    savedValue = await createItem(app, 'opcua-values', data);
  } else {
    const idField = getIdField(findedItem);
    const itemId = findedItem[idField];
    savedValue = await patchItem(app, 'opcua-values', itemId, data);
  }
  return savedValue;
};

/**
 * @method saveStoreOpcuaValues
 * @param {Object} app 
 * @param {String} browseName 
 * @param {Object} data
 * @param {Object} store 
 * e.g. store: {
        numberOfValuesInDoc: [1, 'years'],
        numberOfDocsForTag: [5, 'years']
      }
 * @returns {Object}
 */
const saveStoreOpcuaValues = async function (app, browseName, data, store) {
  let savedValue;
  //--------------------------------------
  const numberOfValuesInDoc = store.numberOfValuesInDoc;
  const numberOfDocsForTag = store.numberOfDocsForTag;
  
  const findedItems = await findItems(app, 'opcua-values', { tagName: browseName, $sort: { createdAt: -1 } });
  if (!findedItems.length) {
    savedValue = await createItem(app, 'opcua-values', data);
  } else {
    const idField = getIdField(findedItems);
    const itemId = findedItems[0][idField];
    let storeBegin =  findedItems[0]['storeBegin'];
    const startOfPeriod =  getStartOfPeriod(storeBegin, numberOfValuesInDoc[1]).format();
    const endOfPeriod =  getEndOfPeriod(startOfPeriod, numberOfValuesInDoc).format();
    if(isDebug && startOfPeriod) console.log('saveStoreOpcuaValues.startAndEndPeriod:', startOfPeriod, endOfPeriod);
    let storeEnd = findedItems[0]['storeEnd'];

    
    /**
     getStartOfPeriod,
  getEndOfPeriod,
     */

    storeEnd = moment.utc(storeEnd);
    
    savedValue = await patchItem(app, 'opcua-values', itemId, data);
  }
  return savedValue;
};

/**
 * @async
 * @method removeOpcuaGroupValues
 * @param {Object} app 
 * @returns {Number}
 */
const removeOpcuaGroupValues = async function (app) {
  let count = 0, removedItems;
  //-------------------------
  // Get opcua tags 
  let opcuaTags = getOpcuaTags();
  opcuaTags = opcuaTags.filter(tag => !!tag.group);
  const browseNames = opcuaTags.map(tag => tag.browseName);
  if (isDebug && browseNames.length) inspector('db-helper.removeOpcuaValues.browseNames:', browseNames);
  removedItems = await removeItems(app, 'opcua-values', { tagName: { $in: browseNames } });
  if (removedItems.length) {
    if (isDebug && removedItems) inspector('db-helper.removeOpcuaValues.removedItems:', removedItems.map(item => item.tagName));
    count = count + removedItems.length;
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
  if (isDebug && opcuaTags.length) inspector('db-helper.saveOpcuaTags.opcuaTags:', opcuaTags);
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
      let equalTags = isDeepEqual(tag, tagFromDB, omit);
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
    if (isDebug) inspector('db-helper.saveOpcuaTags.addedTags:', addedBrowseNames);
  }
  if (updated) {
    if (isDebug) inspector('db-helper.saveOpcuaTags.updatedTags:', updatedBrowseNames);
  }
  if (deleted) {
    if (isDebug) inspector('db-helper.saveOpcuaTags.deletedTags:', deletedBrowseNames);
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
  if (isDebug && opcuaTags) inspector('db-helper.integrityCheckOpcua.opcuaTags:', opcuaTags);

  objTagBrowseNames = opcuaTags.filter(tag => tag.type === 'object').map(tag => tag.browseName);
  tagBrowseNames = opcuaTags.map(tag => tag.browseName);

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
      if (isDebug && deletedBrowseNames.length) inspector('db-helper.integrityCheckOpcua.Remove \'object\' tags that have no child tags:', deletedBrowseNames);
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
      if (isDebug && deletedBrowseNames.length) inspector('db-helper.integrityCheckOpcua.Remove \'variables\' tags that have no owner tags:', deletedBrowseNames);
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
      if (isDebug && deletedBrowseNames.length) inspector('db-helper.integrityCheckOpcua.Remove \'ownerGroup\' tags that have no \'childGroup\' tags:', deletedBrowseNames);
      deleted = 0;
      deletedBrowseNames = [];
      result = false;
    }
  }

  // Get all 'childGroup' tags 
  if (isRemote) {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: { $nin: ['object', 'method'] }, group: { $ne: true }, ownerName: { $in: objTagBrowseNames } });
  } else {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: { $nin: ['object', 'method'] }, group: { $ne: true } });
  }

  // Remove 'childGroup' tags that have no 'ownerGroup' tags
  if (tagsFromDB.length) {
    tagsFromDB = tagsFromDB.filter(tag => !!tag.ownerGroup);
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
      if (isDebug && deletedBrowseNames.length) inspector('db-helper.integrityCheckOpcua.Remove \'childGroup\' tags that have no \'ownerGroup\' tags:', deletedBrowseNames);
      deleted = 0;
      deletedBrowseNames = [];
      result = false;
    }
  }
  // Remove opcua values that have no 'ownerGroup' tags
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
    if (isDebug && deletedBrowseNames.length) inspector('db-helper.integrityCheckOpcua.Remove opcua values that have no \'ownerGroup\' tags:', deletedBrowseNames);
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
    if (isDebug) inspector(`db-helper.getCountItems(path='${path}', query=${JSON.stringify(newQuery)}).findResults:`, findResults);
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
    if (isDebug) inspector(`db-helper.getItem(path='${path}', id='${id}').getResult:`, getResult);
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
    if (isDebug && findResults) inspector(`db-helper.findItem(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
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
    if (isDebug) inspector(`db-helper.findItems(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
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
    if (isDebug) inspector(`db-helper.findItems(path='${path}', query=${JSON.stringify(newParams)}).findResults:`, findResults);
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
    if (isDebug) inspector(`db-helper.findItems(path='${path}', query=${JSON.stringify(query)}).findResults:`, findResults);
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
    if (isDebug) inspector(`db-helper.removeItem(path='${path}', id=${id}).removeResult:`, removeResult);
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
    if (isDebug && deleteResults.length) inspector(`db-helper.removeItems(path='${path}', query=${JSON.stringify(query)}).removeResults:`, deleteResults);
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
    if (isDebug) inspector(`db-helper.patchItems(path='${path}', data=${JSON.stringify(data)}, patchResults:`, patchResults);
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
    if (isDebug) inspector(`patchItems(path='${path}', data=${JSON.stringify(data)}, query=${JSON.stringify(query)}).patchResults:`, patchResults);
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
    if (isDebug) inspector(`createItem(path='${path}', createResults:`, createResult);
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
    if (isDebug) inspector(`createItems(path='${path}', createResults.length:`, createResults.length);
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
  saveOpcuaValues,
  saveStoreOpcuaValues,
  saveOpcuaGroupValue,
  saveStoreOpcuaGroupValue,
  removeOpcuaGroupValues,
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
