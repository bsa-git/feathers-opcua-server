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
  pause,
  isDeepEqual,
  isDeepStrictEqual,
  getInt,
  getStartOfPeriod,
  getEndOfPeriod,
  sortByStringField
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
const loOrderBy = require('lodash/orderBy');
const loReduce = require('lodash/reduce');
const loCloneDeep = require('lodash/cloneDeep');


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

//================ Save opcua group value ==============//

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
          savedValue = await saveOpcuaValues(appRestClient, tag.browseName, data);
        } else {
          savedValue = await createItem(appRestClient, 'opcua-values', data);
        }
      }
    } else {
      if (isUpdateOpcuaToDB()) {
        savedValue = await saveOpcuaValues(app, tag.browseName, data);
      } else {
        savedValue = await createItem(app, 'opcua-values', data);
      }
    }
    if (isDebug && savedValue) inspector('db-helper.saveOpcuaValue.savedValue:', savedValue);
  }
  return savedValue;
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

//================ Save store opcua group value ==============//

/**
 * @method saveStoreOpcuaGroupValue
 * @async
 * 
 * @param {Object} app
 * @param {String} groupBrowseName 
 * e.g. 'CH_M51_ACM::ValueFromFile'
 * @param {String|Object} value 
 * e.g. {
    '!value': { dateTime: '2022-01-01' },
    'CH_M51_ACM::23N2O:23QN2O': [334,...,1997],
    'CH_M51_ACM::23VSG:23FVSG': [262644,...,90642],
    'CH_M51_ACM::23N2O:23QN2O_CORR': [0,...,1],
    'CH_M51_ACM::23VSG:23FVSG_CORR': [1,...,0],
    'CH_M51_ACM::23HNO3:23F105_IS': [1,...,1]
  }
 * @param {Boolean} changeStore 
 * @returns {Object[]}
 */
const saveStoreOpcuaGroupValue = async function (app, groupBrowseName, value, changeStore = false) {
  let opcuaValue = null, savedValues = [];
  let savedValue = null;
  //----------------------------------------------------------

  // Normalize opcuaValue
  if (loIsString(value)) {
    opcuaValue = JSON.parse(value);
  }

  if (loIsObject(value)) {
    opcuaValue = value;
  }

  // Find groupTag for browseName
  const groupTag = await findItem(app, 'opcua-tags', { browseName: groupBrowseName });
  if (opcuaValue && groupTag && groupTag.store) {
    const store = Object.assign({}, groupTag.store);
    // Get store tags
    const storeTags = await findItems(app, 'opcua-tags', { ownerGroup: groupBrowseName });

    // Save store opcua values for hook
    const keys = Object.keys(opcuaValue);
    for (let index = 0; index < keys.length; index++) {
      const storeBrowseName = keys[index];
      let storeValue = opcuaValue[storeBrowseName];
      // Get groupTag
      const findedStoreTag = storeTags.find(tag => (tag.browseName === storeBrowseName));
      if (findedStoreTag) {

        // const idField = getIdField(findedStoreTag);
        // const tagId = findedStoreTag[idField];
        // store['idField'] = idField;

        const opcuaValues = [];
        // Set key to dateTime
        const key = opcuaValue['!value'].dateTime;
        if (storeValue === null) {
          storeValue = getInt(storeValue);
        }
        // Get values
        opcuaValues.push(Array.isArray(storeValue) ? { key, items: storeValue, value: opcuaValue['!value'] } : { key, value: storeValue });

        // Get data
        const data = {
          // tagId: tagId.toString(),
          tagName: storeBrowseName,
          storeStart: key,
          storeEnd: key,
          values: opcuaValues
        };

        // Save opcua values to local store
        savedValue = await saveStoreOpcuaValues4Hook(app, storeBrowseName, loCloneDeep(data), store);
        if (isDebug && savedValue) inspector('saveStoreOpcuaGroupValue.local.savedValue:', savedValue);
        savedValues.push(savedValue);

        // Save opcua values to remote store
        if (isRemoteOpcuaToDB() && !changeStore) {
          const remoteDbUrl = getOpcuaRemoteDbUrl();
          const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
          if (appRestClient) {
            savedValue = await saveStoreOpcuaValues4Hook(appRestClient, storeBrowseName, loCloneDeep(data), store);
            if (isDebug && savedValue) inspector('saveStoreOpcuaGroupValue.remote.savedValue:', savedValue);
            savedValues.push(savedValue);
          }
        }
      }
    }
  }
  if (isDebug && savedValues.length) inspector('saveStoreOpcuaGroupValue.savedValues:', savedValues);
  return savedValues;
};

/**
 * @method saveStoreOpcuaValues4Hook
 * @param {Object} app 
 * e.g. app | appRestClient
 * @param {String} storeBrowseName 
 * e.g. 'CH_M51_ACM::23N2O:23QN2O'
 * @param {Object} data
 * e.g. const data = {
          tagName: 'CH_M51_ACM::23N2O:23QN2O',
          storeStart: '2022-01-01',
          storeEnd: '2022-01-01',
          values: [
            { key: '2022-01-01', items: [334,...,1997], value: { dateTime: '2022-01-01' } }
          ]
        };
  @param {Object} store 
 * e.g. store: {
        numberOfValuesInDoc: [1, 'years'],
        numberOfDocsForTag: [5, 'years'],
        idField: '_id'
      }      
 * @returns {Object}
 */
const saveStoreOpcuaValues4Hook = async function (app, storeBrowseName, data, store) {
  let savedValue;
  //--------------------------------------
  const numberOfValuesInDoc = store.numberOfValuesInDoc;

  // Find store "opcua-tag" for storeBrowseName
  const storeTag = await findItem(app, 'opcua-tags', { browseName: storeBrowseName });
  if (isDebug && storeTag) inspector('saveStoreOpcuaValues4Hook.storeTag:', storeTag);
  if (!storeTag) {
    throw new Error(`A "opcua-tags" service must have a record with "browseName" = ${storeBrowseName}`);
  }
  const idField = 'id' in storeTag ? 'id' : '_id';
  const tagId = storeTag[idField].toString();
  // Set data.tagId
  data.tagId = tagId;

  // Find store "opcua-values" for storeBrowseName
  const findedStoreValues = await findItems(app, 'opcua-values', { tagName: storeBrowseName, $select: [idField, 'storeStart', 'storeEnd'] });
  if (!findedStoreValues.length) {
    savedValue = await createItem(app, 'opcua-values', data);
    if (isDebug && savedValue) inspector('saveStoreOpcuaValues4Hook.createItem.savedValue:', savedValue);
  } else {
    // Get range of stored values
    const storeStart = data.storeStart;
    const startOfPeriod = getStartOfPeriod(storeStart, numberOfValuesInDoc);
    const endOfPeriod = getEndOfPeriod(storeStart, numberOfValuesInDoc);
    if (isDebug && startOfPeriod) console.log('saveStoreOpcuaValues4Hook.startAndEndPeriod:', startOfPeriod, endOfPeriod);
    // Find opcua value for store period
    const findedStoreValue = findedStoreValues.find(item => {
      const storeStart = moment.utc(item.storeStart).format('YYYY-MM-DDTHH:mm:ss');
      const storeEnd = moment.utc(item.storeEnd).format('YYYY-MM-DDTHH:mm:ss');
      return (storeStart >= startOfPeriod && storeEnd <= endOfPeriod);
    });

    if (findedStoreValue) {
      // Get valueId 
      const valueId = findedStoreValue[idField];
      // Patch service item and run "store-items" hook
      savedValue = await patchItem(app, 'opcua-values', valueId, data);// Run "store-items" hook
      if (isDebug && savedValue) inspector('saveStoreOpcuaValues4Hook.patchItem.savedValue:', savedValue);
    } else {
      savedValue = await createItem(app, 'opcua-values', data);
      if (isDebug && savedValue) inspector('saveStoreOpcuaValues4Hook.createItem.savedValue:', savedValue);
    }

  }
  if (isDebug && savedValue) inspector('saveStoreOpcuaValues4Hook.savedValue:', savedValue);
  return savedValue;
};

//================ Functions for  opcua bootstrap ==============//

/**
 * @method saveOpcuaTags
 * @async
 * 
 * @param {Object} app 
 * @param {Object[]} opcuaTags 
 * @param {Boolean} isRemote 
 * @returns {Object}
 * e.g. { added: 123, updated: 32, deleted: 12, total: 125}
 */
const saveOpcuaTags = async function (app, opcuaTags, isRemote = false) {
  let idField, tagId, query = {};
  let tagFromDB = null, tagsFromDB = [], tagBrowseNames = [], objTagBrowseNames = [];
  let addedBrowseNames = [], updatedBrowseNames = [], deletedBrowseNames = [];
  let added = 0, updated = 0, deleted = 0, total = 0;
  //------------------------------------------------------------
  // Get opcua tags 
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

      // Check is deep strict equal
      const omit = [idField, 'createdAt', 'updatedAt', '__v'];
      const result = isDeepStrictEqual(tag, tagFromDB, omit, false);
      // Remove/Update db tag
      if (!result.isDeepStrictEqual) {
        // Else result.isDeepStrictEqual = false, then delete tag
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
      } else {
        if (!result.isDeepEqual) {
          // Else result.isDeepEqual = false, then update tag
          tagFromDB = await patchItem(app, 'opcua-tags', tagId, tag);
          if (tagFromDB) {
            updatedBrowseNames.push(tag.browseName);
            updated = updated + 1;
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
 * @method checkStoreParameterChanges
 * @param {Object} app 
 * @param {Object[]} opcuaTags 
 * @returns {String[]} 
 */
const checkStoreParameterChanges = async function (app, opcuaTags) {
  let storeBrowseNames = [];
  //-------------------------------------
  const _opcuaTags = opcuaTags.filter(tag => tag.store);
  for (let index = 0; index < _opcuaTags.length; index++) {
    const tag = _opcuaTags[index];
    const tagFromDB = await findItem(app, 'opcua-tags', { browseName: tag.browseName });
    if (tagFromDB && tagFromDB.store && !isDeepEqual(tag.store, tagFromDB.store)) {
      storeBrowseNames.push(tag.browseName);
    }
  }
  if (isDebug && storeBrowseNames.length) inspector('checkStoreParameterChanges.storeBrowseNames:', storeBrowseNames);
  return storeBrowseNames;
};

/**
 * @method saveStoreParameterChanges
 * @param {Object} app 
 * @param {String[]} groupBrowseNames 
 * e.g. ['CH_M51_ACM::ValueFromFile',...,'CH_M52_ACM::ValueFromFile']
 * @param {Object[]} opcuaTags 
 * @returns {Object[]}
 */
const saveStoreParameterChanges = async function (app, groupBrowseNames, opcuaTags) {
  let results = [];
  //-----------------------------------------------

  for (let index = 0; index < groupBrowseNames.length; index++) {
    const groupBrowseName = groupBrowseNames[index];
    const storeBrowseNames = opcuaTags.filter(tag => tag.ownerGroup && tag.ownerGroup === groupBrowseName).map(tag => tag.browseName);
    if (isDebug && storeBrowseNames.length) inspector('saveStoreParameterChanges.storeBrowseNames:', storeBrowseNames);
    // Get tag values from stores
    const resultStoreTagList = await getTagValuesFromStores(app, storeBrowseNames);
    if (isDebug && resultStoreTagList.length) console.log('saveStoreParameterChanges.resultStoreTagList.length:', resultStoreTagList.length);
    if (isDebug && resultStoreTagList.length) inspector('saveStoreParameterChanges.resultStoreTagList:', resultStoreTagList);

    // Remove values from DB
    const removedItems = await removeItems(app, 'opcua-values', {
      tagName: { $in: storeBrowseNames },
      storeStart: { $ne: undefined },
      $select: ['tagName', 'storeStart', 'storeEnd']
    });

    if (isDebug && removedItems.length) console.log('saveStoreParameterChanges.removedItems.length:', removedItems.length);
    if (isDebug && removedItems.length) inspector('saveStoreParameterChanges.removedItems:', removedItems);

    // Save all store opcua group value
    for (let index = 0; index < resultStoreTagList.length; index++) {
      const item = resultStoreTagList[index];
      if (isDebug && item) inspector('saveStoreParameterChanges.item:', item);
      const result = await saveStoreOpcuaGroupValue(app, groupBrowseName, item, true);
      if (isDebug && result.length) console.log(`saveStoreParameterChanges('${groupBrowseName}').result.length:`, result.length);
      if (isDebug && result.length) inspector(`saveStoreParameterChanges('${groupBrowseName}').result:`, result);

      await pause(100);

      results.push(result);
    }
  }
  if (isDebug && results.length) console.log('saveStoreParameterChanges.results.length:', results.length);
  return results;
};

/**
 * @method getTagValuesFromStores
 * @param {Object} app 
 * @param {String[]} storeBrowseNames 
 * e.g ['CH_M51_ACM::23N2O:23QN2O',...,'CH_M51_ACM::23VSG:23FVSG']
 * @returns {Object[]}
 * * e.g. [{
 * "_id":{"$oid":"6290757fee64c60fd813a884"},
 * "tagId":{"$oid":"628f3829cc82902158526b01"},
 * "tagName":"CH_M51_ACM::23N2O:23QN2O",
 * "storeStart":"2022-01-01",
 * "storeEnd":"2022-01-31",
 * "values":[{
 * "items":[525,...,1133],
 * "_id":{"$oid":"629077d8ee64c60fd813dd59"},
 * "key":"2022-01-31",
 * "value":{"dateTime":"2022-01-31"}
 * },
 * ...
 * ,{
 * "items":[1812,...,720],
 * "_id":{"$oid":"629077c4ee64c60fd813daa7"},
 * "key":"2022-01-01",
 * "value":{"dateTime":"2022-01-01"}
 * }],
 * "createdAt":{"$date":"2022-05-27T06:53:51.675Z"},
 * "updatedAt":{"$date":"2022-05-27T07:03:52.120Z"},
 * "__v":0
 * }, ..., {...}] ->
 * e.g. [
 * {
 * '!value': { dateTime: '2022-01-01' },
 * 'CH_M51_ACM::23N2O:23QN2O': [791,...,310],
 * 'CH_M51_ACM::23VSG:23FVSG': [276495,...,297635],
 * 'CH_M51_ACM::23N2O:23QN2O_CORR': [0,...,1],
   'CH_M51_ACM::23VSG:23FVSG_CORR': [1,...,0],
   'CH_M51_ACM::23HNO3:23F105_IS': [1,...,1]
 * }, ... ,
   {
 * '!value': { dateTime: '2022-01-10' },
 * 'CH_M51_ACM::23N2O:23QN2O': [231,...,311],
 * 'CH_M51_ACM::23VSG:23FVSG': [116495,...,557635],
 * 'CH_M51_ACM::23N2O:23QN2O_CORR': [1,...,1],
   'CH_M51_ACM::23VSG:23FVSG_CORR': [0,...,0],
   'CH_M51_ACM::23HNO3:23F105_IS': [0,...,1]
 * } 
 * ]
 */
const getTagValuesFromStores = async function (app, storeBrowseNames) {
  let storeTagList = [], dateTimeList = [], resultStoreTagList = [];
  //---------------------------------------------------------------------------

  // Get store tag list
  for (let index = 0; index < storeBrowseNames.length; index++) {
    const tagName = storeBrowseNames[index];
    // Find store values from DB 
    let stores4TagName = await findItems(app, 'opcua-values', { tagName, storeStart: { $ne: undefined } });
    if (isDebug && stores4TagName.length) console.log('getTagValuesFromStores.storesFromDB.length:', stores4TagName.length);
    if (isDebug && stores4TagName.length) inspector('getTagValuesFromStores.storesFromDB:', stores4TagName.map(item => {
      return {
        tagName: item.tagName,
        storeStart: item.storeStart,
        storeEnd: item.storeEnd
      };
    }));
    stores4TagName = sortByStringField(stores4TagName, 'storeStart', true);
    for (let index2 = 0; index2 < stores4TagName.length; index2++) {
      const store4TagName = stores4TagName[index2].values;
      for (let index3 = 0; index3 < store4TagName.length; index3++) {
        const itemStore4TagName = store4TagName[index3];
        const value = (itemStore4TagName.items && itemStore4TagName.items.length) ? itemStore4TagName.items : itemStore4TagName.value;
        const dateTime = itemStore4TagName.key;
        if (!dateTimeList.includes(dateTime)) dateTimeList.push(dateTime);

        const storeTagValue = {};
        storeTagValue['!value'] = { dateTime };
        storeTagValue[tagName] = value;
        storeTagList.push(storeTagValue);
      }
    }
  }
  // Get result store tag list
  for (let index = 0; index < dateTimeList.length; index++) {
    const dateTime = dateTimeList[index];
    let storeTagValues4DateTime = storeTagList.filter(item => item['!value']['dateTime'] === dateTime);
    storeTagValues4DateTime = Object.assign({}, ...storeTagValues4DateTime);
    resultStoreTagList.push(storeTagValues4DateTime);
  }
  // Sort result store tag list
  resultStoreTagList = loOrderBy(resultStoreTagList, item => item['!value']['dateTime'], ['asc']);
  if (isDebug && resultStoreTagList.length) inspector('saveStoreParameterChanges.resultStoreTagList:', resultStoreTagList);
  return resultStoreTagList;
};

/**
 * @name updateRemoteFromLocalStore
 * @param {Object} app 
 * @param {object} appRestClient 
 * @param {Object[]} opcuaTags 
 * @returns {Object[]}
 */
const updateRemoteFromLocalStore = async function (app, appRestClient, opcuaTags) {
  let results = [], sumResults;
  //---------------------
  // Get group browseNames  
  const groupBrowseNames = opcuaTags.filter(tag => tag.group && tag.store).map(tag => tag.browseName);
  if (isDebug && groupBrowseNames.length) inspector('updateRemoteFromLocalStore.groupBrowseNames:', groupBrowseNames);

  for (let index = 0; index < groupBrowseNames.length; index++) {
    const groupBrowseName = groupBrowseNames[index];
    // Get store browseNames 
    const storeBrowseNames = opcuaTags.filter(tag => tag.ownerGroup && tag.ownerGroup === groupBrowseName).map(tag => tag.browseName);
    if (isDebug && storeBrowseNames.length) inspector('updateRemoteFromLocalStore.storeBrowseNames:', storeBrowseNames);

    for (let index2 = 0; index2 < storeBrowseNames.length; index2++) {
      const storeBrowseName = storeBrowseNames[index2];
      const findedStoreTag = await findItem(appRestClient, 'opcua-tags', { browseName: storeBrowseName });
      if (isDebug && findedStoreTag) inspector('updateRemoteFromLocalStore.findedStoreTag:', findedStoreTag);
      const idField = 'id' in findedStoreTag ? 'id' : '_id';
      const tagId = findedStoreTag[idField].toString();
      // Find store "opcua-values" for storeBrowseName
      let findedStoreValues = await findItems(app, 'opcua-values', { 
        tagName: storeBrowseName, 
        storeStart: { $ne: undefined }, 
        $select: ['tagName', 'storeStart', 'storeEnd', 'values'] 
      });
      findedStoreValues = findedStoreValues.map(v => { 
        v = loOmit(v, [idField]);
        v.tagId = tagId; 
        v.values = v.values.map(item => {
          item = loOmit(item, [idField]);
          return item;
        });
        return v;
      });
      if (isDebug && findedStoreValues.length) inspector('updateRemoteFromLocalStore.findedStoreValues:', findedStoreValues);

      // Remove values from remote DB for storeBrowseName
      const removedItems = await removeItems(appRestClient, 'opcua-values', {
        tagName: storeBrowseName,
        storeStart: { $ne: undefined },
        $select: ['tagName', 'storeStart', 'storeEnd']
      });
      if (isDebug && removedItems.length) console.log('updateRemoteFromLocalStore.removedItems.length:', removedItems.length);
      if (isDebug && removedItems.length) inspector('updateRemoteFromLocalStore.removedItems:', removedItems);

      // Create values to remote DB for findedStoreValues
      const createdItems = await createItems(appRestClient, 'opcua-values', findedStoreValues, { $select: ['tagName', 'storeStart', 'storeEnd'] });
      if (isDebug && createdItems.length) console.log('updateRemoteFromLocalStore.createdItems.length:', createdItems.length);
      if (isDebug && createdItems.length) inspector('updateRemoteFromLocalStore.createdItems:', createdItems);

      results.push(createdItems.length);
    }
  }
  if (isDebug && results.length) console.log('updateRemoteFromLocalStore.results.length:', results.length);
  if (isDebug && results.length) inspector('updateRemoteFromLocalStore.results:', results);
  // Sum results
  sumResults = loReduce(results, function (sum, n) {
    return sum + n;
  }, 0);
  if (isDebug && results.length) inspector('updateRemoteFromLocalStore.sumResults:', sumResults);
  return results;
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
  // Remove local opcua values that have no 'browseName' tags
  if (!isRemote) {
    tagsFromDB = await findItems(app, 'opcua-tags', { type: { $nin: ['object', 'method'] } });
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
 * @param {Object} query
 * e.g query -> { $select: ['userName', 'userType'] }
 * @return {Object}
 */
const createItem = async function (app, path = '', data = {}, query = {}) {
  let createResult;
  //------------------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      createResult = await service.create(data, query);
    } else {
      createResult = await service.create(data, { query });
    }
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
 * @param {Object} query
 * e.g query -> { $select: ['userName', 'userType'] }
 * @return {Object[]}
 */
const createItems = async function (app, path = '', data = [], query = {}) {
  let createdItem, createResults = [];
  //-------------------------
  const service = app.service(path);
  if (service) {
    for (let index = 0; index < data.length; index++) {
      const item = data[index];
      if (query.query) {
        createdItem = await service.create(item, query);
      } else {
        createdItem = await service.create(item, { query });
      }
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
  // saveStoreOpcuaValues,
  saveStoreOpcuaValues4Hook,
  saveOpcuaGroupValue,
  saveStoreOpcuaGroupValue,
  removeOpcuaGroupValues,
  saveOpcuaTags,
  checkStoreParameterChanges,
  getTagValuesFromStores,
  saveStoreParameterChanges,
  updateRemoteFromLocalStore,
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
