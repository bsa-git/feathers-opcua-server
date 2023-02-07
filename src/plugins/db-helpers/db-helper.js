/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const moment = require('moment');

const {
  getOpcuaTags,
  getOpcuaConfigsForMe,
  getOpcuaSaveModeToDB,
  getOpcuaBootstrapParams
} = require('../opcua/opcua-helper');

const {
  isUrlExists
} = require('../lib/http-operations');

const {
  DataType,
} = require('node-opcua');

const {
  appRoot,
  inspector,
  logger,
  pause,
  cloneObject,
  isTest,
  isFunction,
  getStartEndOfPeriod,
  isDeepEqual,
  isDeepStrictEqual,
  getInt,
  getStartOfPeriod,
  getEndOfPeriod,
  sortByStringField,
  orderByItems,
  readJsonFileSync,
  removeItemsSync,
  toPathWithPosixSep,
  isUncPath
} = require('../lib');

const {
  feathersClient
} = require('../auth');

const MssqlTedious = require('./mssql-tedious.class');
const queryFuncs = require('./lib');

const opcuaMethods = require('../opcua/opcua-methods');

const loMerge = require('lodash/merge');
const loConcat = require('lodash/concat');
const loOmit = require('lodash/omit');
const loIsObject = require('lodash/isObject');
const loIsString = require('lodash/isString');
const loForEach = require('lodash/forEach');
const loReduce = require('lodash/reduce');
const loCloneDeep = require('lodash/cloneDeep');
const loTemplate = require('lodash/template');
const loSize = require('lodash/size');

// Get max rows for opcua-values service
let maxOpcuaValuesRows = process.env.OPCUA_VALUES_MAXROWS;
maxOpcuaValuesRows = Number.isInteger(maxOpcuaValuesRows) ? maxOpcuaValuesRows : Number.parseInt(maxOpcuaValuesRows);
if (isTest()) {
  maxOpcuaValuesRows = 10;
}

const chalk = require('chalk');

const debug = require('debug')('app:db-helper');
const isDebug = false;

//================ Tools for DB  ==============//

let isInitRemoteDB = false;

/**
 * @method setInitRemoteDB
 * @param {Boolean} value 
 */
const setInitRemoteDB = function (value) {
  isInitRemoteDB = value;
  return isInitRemoteDB;
};

/**
 * @method getInitRemoteDB
 * @param {Boolean} value 
 */
const getInitRemoteDB = function () {
  return isInitRemoteDB;
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

//================ DB operations  for storage ==============//

/**
 * @method getMaxValuesStorage
 * @param {Object} app 
 * @param {String} tagId 
 * e.g. valueId -> '60af3870270f24162c049c21'
 * @returns {Number}
 */
const getMaxValuesStorage = async function (app, tagId = '') {
  let result = 0;
  //----------------------
  const tag = await getItem(app, 'opcua-tags', tagId);
  if (isDebug && tag) inspector('getMaxValuesStorage.tag:', tag);
  if (!tag) return result;
  const tagBrowseName = tag.browseName;

  // This is group tag
  //==============================
  if (tag.group) {
    if (!tag.hist) return result;
    if (tag.hist > 1) return tag.hist;
    return maxOpcuaValuesRows;
  }
  //==============================
  // This is store tag
  if (tag.ownerGroup) {
    // Get group tag 
    const groupTag = await findItem(app, 'opcua-tags', { browseName: tag.ownerGroup, $select: ['browseName', 'store'] });
    if (isDebug && groupTag) inspector('getMaxValuesStorage.groupTag:', groupTag);
    const numberOfDocsForTag = groupTag.store.numberOfDocsForTag;


    // Find store values
    let storeValues = await findItems(app, 'opcua-values', {
      tagId,
      storeStart: { $gt: '' },
      $select: ['tagName', 'storeStart', 'storeEnd']
    });
    // Ascending sort by string field
    storeValues = sortByStringField(storeValues, 'storeStart', true);
    if (isDebug && storeValues.length) debug(`getMaxValuesStorage.storeValues.length('${tagBrowseName}'):`, storeValues.length);
    if (storeValues.length) {
      // Get storeStart/storeEnd
      let storeStart = storeValues[0]['storeStart'];
      // Get startOfPeriod/endOfPeriod
      const endOfPeriod = getEndOfPeriod(storeStart, numberOfDocsForTag);

      // Sum results
      const sumResults = loReduce(storeValues, function (sum, storeValue) {
        let storeEnd = storeValue['storeEnd'];
        storeEnd = moment.utc(storeEnd).format('YYYY-MM-DDTHH:mm:ss');
        if (storeEnd <= endOfPeriod) {
          if (isDebug && storeValue) inspector(`getMaxValuesStorage.storeValue('${endOfPeriod}'):`, storeValue);
          return sum + 1;
        }
        return sum;
      }, 0);
      if (isDebug && sumResults) debug('getMaxValuesStorage.sumResults:', sumResults);
      return sumResults;
    }
  }
  return result;
};

/**
 * @method getStorePeriod
 * @param {Object} app 
 * @param {String} tagId 
 * e.g. tagId -> '60af3870270f24162c049c1f'
 * @param {String|Array|Object} dateTime
 * e.g. dateTime -> '2022-07-22T05:06:35'
 * @returns {Array}
 * e.g. ['2022-07-21T00:00:00', '2022-07-23T23:59:59']
 */
const getStorePeriod = async function (app, tagId = '', dateTime) {
  let servicePath = 'opcua-tags', period = [];
  //---------------------------------
  const storeTag = await getItem(app, servicePath, tagId);
  if (isDebug && storeTag) inspector(`getStorePeriod.storeTag(tagId='${tagId}'):`, storeTag);
  if (!storeTag) {
    throw new Error(`A "opcua-tags" service must have a record with 'tagId' = '${tagId}'`);
  }

  const groupTag = await findItem(app, servicePath, { browseName: storeTag.ownerGroup });
  if (isDebug && groupTag) inspector(`getStorePeriod.groupTag(browseName='${storeTag.ownerGroup}'):`, groupTag);
  if (!groupTag) {
    throw new Error(`A "opcua-tags" service must have a record with 'browseName' = '${storeTag.ownerGroup}'`);
  }

  if (!groupTag.store || !groupTag.store.numberOfValuesInDoc) {
    throw new Error('A "opcua-tag" must have a property -> "groupTag.store.numberOfValuesInDoc"');
  }
  period = getStartEndOfPeriod(dateTime, groupTag.store.numberOfValuesInDoc);
  if (isDebug && period.length) debug('getStorePeriod.period:', period);
  return period;
};

/**
 * @method getStoreParams4Data
 * @async
 * 
 * @param {Object} app 
 * @param {String[]} groupBrowseNames 
 * e.g. ['CH_M51_ACM::ValueFromFile', 'CH_M52_ACM::ValueFromFile', 'CH_M52_ACM2::ValueFromFile']
 * @returns {Object[]}
 * e.g. [
 *  { dateTime: '2022-02-22', fileName: 'DayHist01_23F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:42.827Z' },
 *  { dateTime: '2022-02-22', fileName: 'DayHist01_14F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:50.727Z' },
 *  ...
 *  { dateTime: '2022-02-22', fileName: 'DayHist01_57F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:55.927Z' }
 * ]
 */
const getStoreParams4Data = async function (app, groupBrowseNames) {
  let storeParams = [], resultStoreTagList;
  //----------------------------
  // Get store data
  for (let index = 0; index < groupBrowseNames.length; index++) {
    const groupBrowseName = groupBrowseNames[index];
    // Get store items
    const storeTagItems = await findItems(app, 'opcua-tags', { ownerGroup: groupBrowseName });
    const storeBrowseNames = storeTagItems.map(tag => tag.browseName);
    // Get tag values for one store
    resultStoreTagList = await getOpcuaTagValuesFromStores(app, [storeBrowseNames[0]]);
    resultStoreTagList = resultStoreTagList.map(item => item['!value']);
    if (isDebug && resultStoreTagList.length) console.log('saveStoreParameterChanges.resultStoreTagList.length:', resultStoreTagList.length);
    if (isDebug && resultStoreTagList.length) inspector('saveStoreParameterChanges.resultStoreTagList:', resultStoreTagList);
    storeParams = loConcat(storeParams, resultStoreTagList);
  }
  return storeParams;
};

//================ Save opcua group value ==============//

/**
 * @method saveOpcuaGroupValue
 * @async
 * 
 * @param {Object} app
 * @param {String} groupBrowseName 
 * e.g. 'CH_M51_ACM::ValueFromFile'
 * @param {String|Object} value
 * e.g.  {
 * '!value': { dateTime: '2022-01-01' },
 * 'CH_M51_ACM::23N2O:23QN2O': [232,..., 567],
 * ...
 * 'CH_M51_ACM::23VSG:23FVSG': [12345,..., 6789]
 * }
 * @returns {Object}
 */
const saveOpcuaGroupValue = async function (app, groupBrowseName, value) {
  let opcuaValue = null, opcuaValueItem, opcuaValues = [];
  let savedValue = null;
  //----------------------------------------------------------

  if (loIsString(value)) {
    opcuaValue = JSON.parse(value);
  }

  if (loIsObject(value)) {
    opcuaValue = value;
  }

  // Get tag for browseName
  const groupTag = await findItem(app, 'opcua-tags', { browseName: groupBrowseName });
  if (opcuaValue && groupTag) {
    // Get group items
    const groupTagItems = await findItems(app, 'opcua-tags', { ownerGroup: groupBrowseName });
    // Normalize opcuaValue
    loForEach(opcuaValue, (value, key) => {
      const findedKey = groupTagItems.find(item => (item.browseName === key) || (item.aliasName === key));
      if (findedKey) {
        key = findedKey.browseName;
        if (value === null) {
          value = getInt(value);
        }
        opcuaValueItem = { key };
        if (opcuaValue['!value']) opcuaValueItem.params = opcuaValue['!value'];
        if (Array.isArray(value)) {
          opcuaValueItem.values = value;
        } else {
          opcuaValueItem.value = value;
        }
        opcuaValues.push(opcuaValueItem);
      }
    });
    const data = {
      tagName: groupTag.browseName,
      opcuaData: opcuaValues
    };

    if (isDebug && data) inspector('db-helper.saveOpcuaGroupValue.data:', data);

    // Save values for local host 
    if (isUpdateOpcuaToDB()) {
      savedValue = await saveOpcuaValues(app, groupTag.browseName, loCloneDeep(data));
    } else {
      savedValue = await createItem(app, 'opcua-values', loCloneDeep(data));
    }
    if (isDebug && savedValue) inspector('db-helper.saveOpcuaValue.local.savedValue:', savedValue);

    // Save values for remote host  
    let isRemote = isRemoteOpcuaToDB();
    const remoteDbUrl = getOpcuaRemoteDbUrl();
    const isURL = isRemote ? await isUrlExists(remoteDbUrl) : false;
    isRemote = isRemote && isURL && getInitRemoteDB();
    if (isRemote) {
      const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
      if (appRestClient) {
        if (isUpdateOpcuaToDB()) {
          savedValue = await saveOpcuaValues(appRestClient, groupTag.browseName, loCloneDeep(data));
        } else {
          savedValue = await createItem(appRestClient, 'opcua-values', loCloneDeep(data));
        }
        if (isDebug && savedValue) inspector('db-helper.saveOpcuaValue.remote.savedValue:', savedValue);
      }
    }
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
 * @method saveStoreOpcuaGroupValues
 * @async
 * 
 * @param {Object} app
 * @param {String} groupBrowseName 
 * e.g. 'CH_M51_ACM::ValueFromFile'
 * @param {Object[]} values 
 * e.g. [
 * {
    '!value': { dateTime: '2022-01-01' },
    'CH_M51_ACM::23N2O:23QN2O': [334,...,1997],
    'CH_M51_ACM::23VSG:23FVSG': [262644,...,90642],
    'CH_M51_ACM::23N2O:23QN2O_CORR': [0,...,1],
    'CH_M51_ACM::23VSG:23FVSG_CORR': [1,...,0],
    'CH_M51_ACM::23HNO3:23F105_IS': [1,...,1]
  },
  ...,
  {
    '!value': { dateTime: '2022-01-10' },
    'CH_M51_ACM::23N2O:23QN2O': [222,...,997],
    'CH_M51_ACM::23VSG:23FVSG': [262555,...,55642],
    'CH_M51_ACM::23N2O:23QN2O_CORR': [0,...,1],
    'CH_M51_ACM::23VSG:23FVSG_CORR': [1,...,0],
    'CH_M51_ACM::23HNO3:23F105_IS': [0,...,1]
  }
]
 * @param {Boolean} saveRemote // Is save to remote store
 * @returns {Object[]}
 */
const saveStoreOpcuaGroupValues = async function (app, groupBrowseName, values, saveRemote = false) {
  let savedValue = null, savedValues = [];
  //----------------------------------------------------------

  // Normalize values
  let _values = cloneObject(values);

  if (!Array.isArray(_values)) {
    if (loIsString(_values)) {
      _values = [JSON.parse(_values)];
    }
    if (!Array.isArray(_values)) {
      if (loIsObject(_values)) {
        _values = [_values];
      }
    }
  }

  // Find groupTag for browseName
  const groupTag = await findItem(app, 'opcua-tags', { browseName: groupBrowseName });
  if (groupTag && groupTag.store) {
    const store = Object.assign({}, groupTag.store);
    // Get store tags
    const storeTags = await findItems(app, 'opcua-tags', { ownerGroup: groupBrowseName });
    if (storeTags.length) {
      // Get store items from opcua tag values
      storeTags.push(groupTag);
      const storeItems = getStoresFromOpcuaTagValues(storeTags, _values);

      // Save opcua values to remote store
      let isRemote = isRemoteOpcuaToDB();
      const remoteDbUrl = getOpcuaRemoteDbUrl();
      const isURL = isRemote ? await isUrlExists(remoteDbUrl, { showMsg: false }) : false;
      isRemote = isRemote && isURL && saveRemote && !isTest()  && getInitRemoteDB();

      // Save store opcua values for hook
      const keys = Object.keys(storeItems);
      for (let index = 0; index < keys.length; index++) {
        const storeBrowseName = keys[index];
        for (let index2 = 0; index2 < storeItems[storeBrowseName].length; index2++) {
          const storeItem4Tag = storeItems[storeBrowseName][index2];
          // Save opcua values to local store
          savedValue = await saveStoreOpcuaValues4Hook(app, storeBrowseName, loCloneDeep(storeItem4Tag), store);
          if (isDebug && savedValue) inspector('saveStoreOpcuaGroupValues.local.savedValue:', savedValue);
          savedValues.push(savedValue);

          // // Save opcua values to remote store
          if (isRemote) {
            const remoteDbUrl = getOpcuaRemoteDbUrl();
            const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
            if (appRestClient) {
              savedValue = await saveStoreOpcuaValues4Hook(appRestClient, storeBrowseName, loCloneDeep(storeItem4Tag), store);
              if (isDebug && savedValue) inspector('saveStoreOpcuaGroupValues.remote.savedValue:', savedValue);
              savedValues.push(savedValue);
            }
          }
        }
      }
    }
  }

  if (isDebug && savedValues.length) inspector('saveStoreOpcuaGroupValues.savedValues:', savedValues);
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
          storeEnd: '2022-12-31',
          opcuaData: [
            { key: '2022-01-01', values: [334,...,1997], params: { dateTime: '2022-01-01' } },
            ...
            { key: '2022-12-31', values: [554,...,1333], params: { dateTime: '2022-12-31' } }
          ]
        };
  @param {Object} store 
 * e.g. store: {
        numberOfValuesInDoc: [1, 'years'],
        numberOfDocsForTag: [5, 'years']
      }      
 * @returns {Object}
 */
const saveStoreOpcuaValues4Hook = async function (app, storeBrowseName, data, store) {
  let savedValue;
  //--------------------------------------
  const numberOfValuesInDoc = store.numberOfValuesInDoc;
  if (isDebug && data) inspector('saveStoreOpcuaValues4Hook.data:', data);

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
 * e.g. { added: 123, updated: 32, deleted: 12, total: 125 }
 */
const saveOpcuaTags = async function (app, opcuaTags, isRemote = false) {
  let idField, tagId, query = {};
  let tag, tagFromDB = null, tagsFromDB = [], tagBrowseNames = [], objTagBrowseNames = [];
  let addedBrowseNames = [], updatedBrowseNames = [], deletedBrowseNames = [];
  let added = 0, updated = 0, deleted = 0, total = 0, total4ThisHost = 0;
  //------------------------------------------------------------
  // Get opcua tags 
  if (isDebug && opcuaTags.length) inspector('db-helper.saveOpcuaTags.opcuaTags:', opcuaTags);
  for (let index = 0; index < opcuaTags.length; index++) {
    tag = opcuaTags[index];
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
  // 
  if (isRemote) {
    total4ThisHost = await getCountItems(app, 'opcua-tags', query);
    total4ThisHost += objTagBrowseNames.length;
  }

  // For debug - show tag object browse names from database
  if (isDebug && isRemote && total4ThisHost) {
    query = { type: 'object', browseName: { $nin: objTagBrowseNames }, $select: ['browseName'] };
    let tagObjBrowseNamesFromDB = await findItems(app, 'opcua-tags', query);
    tagObjBrowseNamesFromDB = tagObjBrowseNamesFromDB.map(tag => tag.browseName);
    console.log('db-helper.saveOpcuaTags.tagObjBrowseNamesFromDB:', tagObjBrowseNamesFromDB.length ? tagObjBrowseNamesFromDB : chalk.yellow('No Data'));
  }

  return isRemote ? { added, updated, deleted, total4ThisHost, total } : { added, updated, deleted, total };
};

/**
 * @async
 * @method removeOpcuaGroupValues
 * @param {Object} app 
 * @returns {Number}
 */
const removeOpcuaGroupValues = async function (app) {
  let removedItems;
  //-------------------------
  // Get opcua tags 
  let opcuaTags = getOpcuaTags();
  opcuaTags = opcuaTags.filter(tag => !!tag.group);
  const browseNames = opcuaTags.map(tag => tag.browseName);
  if (isDebug && browseNames.length) inspector('db-helper.removeOpcuaValues.browseNames:', browseNames);
  removedItems = await removeItems(app, 'opcua-values', { tagName: { $in: browseNames }, $select: ['tagId', 'tagName'] });
  if (isDebug && removedItems.length) inspector('db-helper.removeOpcuaValues.removedItems:', removedItems.map(item => item.tagName));

  return removedItems.length;
};

/**
 * @async
 * @method removeOpcuaStoreValues
 * @param {Object} app 
 * @returns {Number}
 */
const removeOpcuaStoreValues = async function (app) {
  let count = 0, removedItems;
  //-------------------------
  // Get opcua tags 
  let opcuaTags = getOpcuaTags();
  const groupBrowseNames = opcuaTags.filter(tag => tag.group && tag.store).map(tag => tag.browseName);
  if (isDebug && groupBrowseNames.length) inspector('db-helper.removeOpcuaStoreValues.groupBrowseNames:', groupBrowseNames);
  for (let index = 0; index < groupBrowseNames.length; index++) {
    const groupBrowseName = groupBrowseNames[index];
    const storeBrowseNames = opcuaTags.filter(tag => tag.ownerGroup === groupBrowseName).map(tag => tag.browseName);
    if (isDebug && storeBrowseNames.length) inspector(`db-helper.removeOpcuaStoreValues.storeBrowseNames('${groupBrowseName}'):`, storeBrowseNames);
    for (let index2 = 0; index2 < storeBrowseNames.length; index2++) {
      const storeBrowseName = storeBrowseNames[index2];
      removedItems = await removeItems(app, 'opcua-values', { tagName: storeBrowseName, $select: ['tagId', 'tagName', 'storeStart', 'storeEnd'] });
      if (removedItems.length) {
        if (isDebug && removedItems.length) inspector('db-helper.removeOpcuaValues.removedItems:', removedItems);
        count = count + removedItems.length;
      }
    }
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
    const resultStoreTagList = await getOpcuaTagValuesFromStores(app, storeBrowseNames);
    if (isDebug && resultStoreTagList.length) console.log('saveStoreParameterChanges.resultStoreTagList.length:', resultStoreTagList.length);
    if (isDebug && resultStoreTagList.length) inspector('saveStoreParameterChanges.resultStoreTagList:', resultStoreTagList);

    // Remove values from DB
    const removedItems = await removeItems(app, 'opcua-values', {
      tagName: { $in: storeBrowseNames },
      storeStart: { $gt: '' },
      $select: ['tagName', 'storeStart', 'storeEnd']
    });

    if (isDebug && removedItems.length) console.log('saveStoreParameterChanges.removedItems.length:', removedItems.length);
    if (isDebug && removedItems.length) inspector('saveStoreParameterChanges.removedItems:', removedItems);

    // Save all store opcua group value
    const result = await saveStoreOpcuaGroupValues(app, groupBrowseName, resultStoreTagList, false);
    results = loConcat(results, result);
  }
  if (isDebug && results.length) console.log('saveStoreParameterChanges.results.length:', results.length);
  return results;
};

/**
 * @method getOpcuaTagValuesFromStores
 * @param {Object} app 
 * @param {String[]} storeBrowseNames 
 * e.g ['CH_M51_ACM::23N2O:23QN2O',...,'CH_M51_ACM::23VSG:23FVSG']
 * @returns {Object[]}
 * * e.g. FROM -> [{
 * "_id":{"$oid":"6290757fee64c60fd813a884"},
 * "tagId":{"$oid":"628f3829cc82902158526b01"},
 * "tagName":"CH_M51_ACM::23N2O:23QN2O",
 * "storeStart":"2022-01-01",
 * "storeEnd":"2022-01-31",
 * "opcuaData":[{
 * "values":[525,...,1133],
 * "_id":{"$oid":"629077d8ee64c60fd813dd59"},
 * "key":"2022-01-31",
 * "params":{"dateTime":"2022-01-31"}
 * },
 * ...
 * ,{
 * "values":[1812,...,720],
 * "_id":{"$oid":"629077c4ee64c60fd813daa7"},
 * "key":"2022-01-01",
 * "params":{"dateTime":"2022-01-01"}
 * }],
 * "createdAt":{"$date":"2022-05-27T06:53:51.675Z"},
 * "updatedAt":{"$date":"2022-05-27T07:03:52.120Z"},
 * "__v":0
 * }, ..., {...}] TO ->
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
const getOpcuaTagValuesFromStores = async function (app, storeBrowseNames) {
  let storeTagList = [], dateTimeList = [], resultStoreTagList = [];
  //---------------------------------------------------------------------------

  // Get store tag list
  for (let index = 0; index < storeBrowseNames.length; index++) {
    const storeTagName = storeBrowseNames[index];
    // Find store values from DB 
    let stores4TagName = await findItems(app, 'opcua-values', { tagName: storeTagName, storeStart: { $gt: '' } });
    if (isDebug && stores4TagName.length) console.log('getOpcuaTagValuesFromStores.storesFromDB.length:', stores4TagName.length);
    if (isDebug && stores4TagName.length) inspector('getOpcuaTagValuesFromStores.storesFromDB:', stores4TagName.map(item => {
      return {
        tagName: item.tagName,
        storeStart: item.storeStart,
        storeEnd: item.storeEnd
      };
    }));
    stores4TagName = sortByStringField(stores4TagName, 'storeStart', true);
    for (let index2 = 0; index2 < stores4TagName.length; index2++) {
      const store4TagName = stores4TagName[index2].opcuaData;
      for (let index3 = 0; index3 < store4TagName.length; index3++) {
        const itemStore4TagName = store4TagName[index3];
        const value = (itemStore4TagName.values && itemStore4TagName.values.length) ? itemStore4TagName.values : itemStore4TagName.value;
        const dateTime = itemStore4TagName.key;
        if (!dateTimeList.includes(dateTime)) dateTimeList.push(dateTime);

        const storeTagValue = {};
        storeTagValue['!value'] = itemStore4TagName.params;
        storeTagValue[storeTagName] = value;
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
  resultStoreTagList = orderByItems(resultStoreTagList, item => item['!value']['dateTime'], ['asc']);
  if (isDebug && resultStoreTagList.length) inspector('saveStoreParameterChanges.resultStoreTagList:', resultStoreTagList);
  return resultStoreTagList;
};

/**
 * @method getStoresFromOpcuaTagValues
 * @param {Object[]} opcuaTags
 * @param {Object[]} opcuaValues 
 * e.g [
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
 * @returns {Object[]}
 * * e.g. {
 * "CH_M51_ACM::23N2O:23QN2O": [
 * {
 * "tagName":"CH_M51_ACM::23N2O:23QN2O",
 * "storeStart":"2022-01-01",
 * "storeEnd":"2022-01-10",
 * "opcuaData":[
 * {
 * "values":[525,...,1133],
 * "key":"2022-01-10",
 * "params":{"dateTime":"2022-01-10"}
 * },
 * ...
 * ,{
 * "values":[1812,...,720],
 * "key":"2022-01-01",
 * "params":{"dateTime":"2022-01-01"}
 * }]
 * }, ... {
 * "tagName":"CH_M51_ACM::23N2O:23QN2O",
 * "storeStart":"2023-01-01",
 * "storeEnd":"2023-01-10",
 * "opcuaData":[
 * {
 * "values":[525,...,1133],
 * "key":"2023-01-10",
 * "params":{"dateTime":"2023-01-10"}
 * },
 * ...
 * ,{
 * "values":[1812,...,720],
 * "key":"2023-01-01",
 * "params":{"dateTime":"2023-01-01"}
 * }]
 * }
 * ],
 * ... "CH_M51_ACM::23VSG:23FVSG": [{...}, ..., {...}]
 * }
 */
const getStoresFromOpcuaTagValues = function (opcuaTags, opcuaValues) {
  let storeValue, storeItems = {};
  //---------------------------------------------------------------------------

  let _opcuaValues = cloneObject(opcuaValues);

  // Asc sort opcuaValues list
  _opcuaValues = orderByItems(_opcuaValues, item => item['!value']['dateTime'], ['asc']);
  if (isDebug && _opcuaValues.length) inspector('getStoresFromTagValues._opcuaValues:', _opcuaValues);

  for (let index = 0; index < _opcuaValues.length; index++) {
    const opcuaValue = _opcuaValues[index];
    const keys = Object.keys(opcuaValue);
    for (let index2 = 0; index2 < keys.length; index2++) {
      const storeBrowseName = keys[index2];
      // Find storeTag for storeBrowseName
      const storeTag = opcuaTags.find(t => t.browseName === storeBrowseName);
      if (isDebug && storeTag) inspector('getStoresFromTagValues.storeTag:', storeTag);
      if (storeTag) {
        // Find groupTag for storeTag
        const groupTag = opcuaTags.find(t => t.browseName === storeTag.ownerGroup);
        if (isDebug && groupTag) inspector('getStoresFromTagValues.groupTag:', groupTag);
        if (groupTag && groupTag.store) {
          // Get store
          const store = Object.assign({}, groupTag.store);
          const numberOfValuesInDoc = store.numberOfValuesInDoc;

          const opcuaData = [];
          // Get dateTime
          const dateTime = opcuaValue['!value'].dateTime;

          // Get store value 
          storeValue = opcuaValue[storeBrowseName];
          if (storeValue === null) {
            storeValue = getInt(storeValue);
          }
          // Get opcua value item
          const opcuaValueItem = { key: dateTime };
          opcuaValueItem.params = opcuaValue['!value'];
          if (Array.isArray(storeValue)) {
            opcuaValueItem.values = storeValue;
          } else {
            opcuaValueItem.value = storeValue;
          }
          opcuaData.push(opcuaValueItem);

          // Get data
          const data = {
            tagName: storeBrowseName,
            storeStart: dateTime,
            storeEnd: dateTime,
            opcuaData
          };

          // Create || Update storeItems
          if (!storeItems[storeBrowseName]) {
            storeItems[storeBrowseName] = [data];
          } else {
            // Get range of stored values
            const storeStart = data.storeStart;
            const startOfPeriod = getStartOfPeriod(storeStart, numberOfValuesInDoc);
            const endOfPeriod = getEndOfPeriod(storeStart, numberOfValuesInDoc);
            if (isDebug && startOfPeriod) console.log('getStoresFromTagValues.startAndEndPeriod:', startOfPeriod, endOfPeriod);
            // Find store item for store period
            const findedStoreItem = storeItems[storeBrowseName].find(item => {
              const storeStart = moment.utc(item.storeStart).format('YYYY-MM-DDTHH:mm:ss');
              const storeEnd = moment.utc(item.storeEnd).format('YYYY-MM-DDTHH:mm:ss');
              return (storeStart >= startOfPeriod && storeEnd <= endOfPeriod);
            });

            if (findedStoreItem) {// Update store item
              findedStoreItem.storeEnd = data.storeEnd;
              findedStoreItem.opcuaData = loConcat(findedStoreItem.opcuaData, data.opcuaData);
            } else {// Create new store item
              storeItems[storeBrowseName].push(data);
            }
          }
        }
      }
    }
  }
  if (isDebug && storeItems) inspector('getStoresFromTagValues.storeItems:', storeItems);
  return storeItems;
};

/**
 * @name updateRemoteFromLocalStore
 * @param {Object} app 
 * @param {object} appRestClient 
 * @param {Object[]} opcuaTags 
 * @returns {Object[]}
 */
const updateRemoteFromLocalStore = async function (app, appRestClient, opcuaTags) {
  let results = 0, createdItem, sumResults;
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
        storeStart: { $gt: '' },
        $select: ['tagName', 'store', 'storeStart', 'storeEnd', 'opcuaData']
      });
      findedStoreValues = findedStoreValues.map(v => {
        v = loOmit(v, [idField]);
        v.tagId = tagId;
        v.opcuaData = v.opcuaData.map(item => {
          item = loOmit(item, [idField]);
          return item;
        });
        return v;
      });
      if (isDebug && findedStoreValues.length) inspector('updateRemoteFromLocalStore.findedStoreValues:', findedStoreValues);
      // Check for differences in documents
      for (let index3 = 0; index3 < findedStoreValues.length; index3++) {
        const findedStoreValue = findedStoreValues[index3];
        if (isDebug && findedStoreValue) inspector('updateRemoteFromLocalStore.findedStoreValue:', findedStoreValue);
        const hash = findedStoreValue.store.hash;
        const findedRemoteStoreValue = await findItem(appRestClient, 'opcua-values', {
          tagName: storeBrowseName,
          storeStart: findedStoreValue.storeStart,
          $select: ['tagName', 'store']
        });
        if (isDebug && findedRemoteStoreValue) inspector('updateRemoteFromLocalStore.findedRemoteStoreValue:', findedRemoteStoreValue);

        // Create value for remote DB
        if (!findedRemoteStoreValue) {
          createdItem = await createItem(appRestClient, 'opcua-values', findedStoreValue, { $select: ['tagId', 'tagName', 'store', 'storeStart', 'storeEnd'] });
          if (isDebug && createdItem) inspector('updateRemoteFromLocalStore.createdItem:', createdItem);
          if (createdItem) results++;
        }

        // Remove and create value for remote DB
        if (findedRemoteStoreValue && findedRemoteStoreValue.store.hash !== hash) {
          // const removedItems = await removeItem(appRestClient, 'opcua-values', {
          const removedItems = await removeItems(appRestClient, 'opcua-values', {
            tagName: storeBrowseName,
            storeStart: findedStoreValue.storeStart,
            $select: ['tagName', 'store', 'storeStart', 'storeEnd']
          });
          if (isDebug && removedItems.length) inspector('updateRemoteFromLocalStore.removedItems:', removedItems);
          createdItem = await createItem(appRestClient, 'opcua-values', findedStoreValue, { $select: ['tagId', 'tagName', 'store', 'storeStart', 'storeEnd'] });
          if (isDebug && createdItem) inspector('updateRemoteFromLocalStore.createdItem:', createdItem);
          if (createdItem) results++;
        }
      }
    }
  }
  if (isDebug && results) console.log('updateRemoteFromLocalStore.results:', results);
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

/**
 * @method syncHistoryAtStartup
 * @param {Object} app 
 * @param {Object[]} opcuaTags 
 * @param {String} methodName
 * e.g. -> 'methodAcmDayReportsDataGet'
 * @returns {Object}
 * e.g. { "statusCode": "Good", "savedValuesCount": 30, "removedValuesCount": 5, "methodResultOutputPath": "C:/tmp/report"}
 */
const syncHistoryAtStartup = async function (app, opcuaTags, methodName) {
  let methodResult = null, dataItems = [], savedValues = [], savedValuesCount = 0;
  let removedValuesCount = 0, methodResultOutputPath = '', statusCode;
  //-------------------------------------------------------------
  // Get opcua array valid group store tags for pointID = 0;
  if (!opcuaMethods[methodName]) {
    throw new errors.GeneralError(`There is no opcua method for method name - '${methodName}'`);
  }
  methodResult = await opcuaMethods[methodName]([{ value: 0 }]);
  const arrayOfValidTags = methodResult.params.arrayOfValidTags;
  if (isDebug && arrayOfValidTags.length) inspector('syncHistoryAtStartup.arrayOfValidTags:', arrayOfValidTags);
  const opcuaGroupTags = opcuaTags.filter(t => t.group && t.store && arrayOfValidTags.includes(t.browseName));
  if (isDebug && opcuaGroupTags.length) inspector('syncHistoryAtStartup.opcuaGroupTags:', opcuaGroupTags);

  // Run method for opcuaGroupTags
  for (let index = 0; index < opcuaGroupTags.length; index++) {
    const opcuaGroupTag = opcuaGroupTags[index];
    const pointID = opcuaGroupTag.getterParams.pointID;
    const groupBrowseName = opcuaGroupTag.browseName;
    const storeBrowseNames = opcuaTags.filter(tag => tag.ownerGroup === groupBrowseName).map(tag => tag.browseName);
    // Set dataItemBrowseNames e.g. { "CH_M51::01AMIAK:01T4": [], "CH_M51::01AMIAK:01P4_1": [] }
    // This is needed for remove dataItem from store
    const dataItemBrowseNames = {};
    storeBrowseNames.forEach(browseName => {
      dataItemBrowseNames[browseName] = [];
    });

    // Run metod
    const storeParams = await getStoreParams4Data(app, [groupBrowseName]);
    methodResult = await opcuaMethods[methodName]([{ value: pointID }], { storeParams });
    if (isDebug && methodResult) inspector(`syncHistoryAtStartup.${methodName}.methodResult:`, methodResult);
    statusCode = methodResult.statusCode;

    // Get dataItems
    if (methodResult.params.isSaveOutputFile) {
      let outputFile = methodResult.params.outputFile;
      const currentDate = moment().format('YYYYMMDD');
      outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
      methodResultOutputPath = methodResult.params.outputPath;
      dataItems = readJsonFileSync([appRoot, methodResultOutputPath, outputFile])['dataItems'];
    } else {
      dataItems = methodResult.dataItems;
    }
    if (isDebug && dataItems) inspector(`syncHistoryAtStartup.${methodName}.dataItems:`, dataItems);

    // Add dataItems for storeParams4Remove
    const storeParams4Remove = methodResult.storeParams4Remove;
    removedValuesCount += storeParams4Remove.length;
    for (let index2 = 0; index2 < storeParams4Remove.length; index2++) {
      const storeParam4Remove = storeParams4Remove[index2];
      storeParam4Remove.action = 'remove';
      const dataItem = {};
      dataItem['!value'] = storeParam4Remove;
      Object.assign(dataItem, dataItemBrowseNames);
      if (isDebug && dataItem) inspector(`syncHistoryAtStartup.${methodName}.dataItem:`, dataItem);
      dataItems.push(dataItem);
    }

    // Save store opcua group value
    savedValues = await saveStoreOpcuaGroupValues(app, groupBrowseName, dataItems, false);
    if (isDebug && savedValues.length) inspector('syncHistoryAtStartup.saveStoreOpcuaGroupValues.savedValues:', savedValues);
    savedValuesCount += savedValues.length;
  }
  // Remove files from tmp path
  if (!isUncPath(methodResultOutputPath)) {
    const filePath = toPathWithPosixSep([appRoot, methodResultOutputPath]);
    const deletedItems = removeItemsSync([`${filePath}/*.*`, `!${filePath}/*.xlsx`], { dryRun: false });
    if (isDebug && deletedItems.length) inspector('removeItemsSync.deletedItems:', deletedItems);
  }
  // Get sync result
  const syncResult = { statusCode, savedValuesCount, removedValuesCount };
  if (isDebug && dataItems) console.log(`syncHistoryAtStartup.syncResult: ${syncResult}`);
  return syncResult;
};

/**
 * @method syncReportAtStartup
 * @param {Object} app 
 * @param {Object[]} opcuaTags 
 * @param {String} methodName
 * e.g. -> 'methodAcmYearReportUpdate'
 * @returns {Object}
 * e.g. {"statusCode": "Good", "outputArguments": { "reportYear": 2022, ... }}
 */
const syncReportAtStartup = async function (app, opcuaTags, methodName) {
  let methodResult = null, dataItems = [], deletedReports;
  let inputArgument, inputArgument2, inputArguments;
  //-------------------------------------------------------------

  if (!opcuaMethods[methodName]) {
    throw new errors.GeneralError(`There is no opcua method for method name - '${methodName}'`);
  }

  // Remove report files for (pointID = -1)
  inputArgument = { pointID: -1 };
  inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };

  inputArgument2 = { dataType: DataType.String, value: JSON.stringify(dataItems) };
  inputArguments = [];
  inputArguments.push([inputArgument, inputArgument2]);

  methodResult = await opcuaMethods[methodName](inputArguments);
  deletedReports = methodResult.params.deletedItems;
  if (isDebug && deletedReports.length) inspector('syncReportAtStartup.Remove report files for (pointID = -1).deletedItems:', deletedReports);

  // Get opcua array valid group store tags for (pointID = 0)
  inputArgument = { pointID: 0 };
  inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };

  inputArgument2 = { dataType: DataType.String, value: JSON.stringify(dataItems) };
  inputArguments = [];
  inputArguments.push([inputArgument, inputArgument2]);

  methodResult = await opcuaMethods[methodName](inputArguments);
  const arrayOfValidTags = methodResult.params.arrayOfValidTags;
  if (isDebug && arrayOfValidTags.length) inspector('syncReportAtStartup.arrayOfValidTags:', arrayOfValidTags);

  // Get valid opcua group tags
  const opcuaGroupTags = opcuaTags.filter(t => t.group && t.store && arrayOfValidTags.includes(t.browseName));
  if (isDebug && opcuaGroupTags.length) inspector('syncReportAtStartup.opcuaGroupTags:', opcuaGroupTags);

  // Run method for opcuaGroupTags
  for (let index = 0; index < opcuaGroupTags.length; index++) {
    const opcuaGroupTag = opcuaGroupTags[index];
    const pointID = opcuaGroupTag.getterParams.pointID;
    const groupBrowseName = opcuaGroupTag.browseName;
    // Get store browse names 
    const storeBrowseNames = opcuaTags.filter(tag => tag.ownerGroup === groupBrowseName).map(tag => tag.browseName);
    // Get tag values from stores
    dataItems = await getOpcuaTagValuesFromStores(app, storeBrowseNames);
    if (isDebug && dataItems.length) inspector('syncReportAtStartup.dataItems:', dataItems);

    // Set inputArguments
    inputArgument = { pointID };
    inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };

    inputArgument2 = { dataType: DataType.String, value: JSON.stringify(dataItems) };
    inputArguments = [];
    inputArguments.push([inputArgument, inputArgument2]);

    // Run opcua method
    methodResult = await opcuaMethods[methodName](inputArguments);
  }
  if (isDebug && methodResult.length) inspector('syncReportAtStartup.methodResult:', methodResult);
  return methodResult;
};

/**
 * @method initRemoteDB
 * @async
 * 
 * @param {Object} app 
 * @param {String} dbUrl 
 * @param {Object[]} opcuaTags 
 * @param {Boolean} isClearHistoryAtStartup 
 */
const initRemoteDB = async function (app, dbUrl, opcuaTags, isClearHistoryAtStartup) {
  let removeResult;
  //--------------------------------------
  const appRestClient = await feathersClient({ transport: 'rest', serverUrl: dbUrl });
  if (appRestClient) {
    // Save opcua tags to remote DB
    const saveResult = await saveOpcuaTags(appRestClient, opcuaTags, true);
    logger.info('opcuaBootstrap.saveOpcuaTags.remoteDB: OK. %s', saveResult);
    // Integrity check opcua data
    const integrityResult = await integrityCheckOpcua(appRestClient, true);
    if (integrityResult) {
      logger.info('Result integrity check opcua.remoteDB: OK.');
    } else {
      logger.error('Result integrity check opcua.remoteDB: ERR.');
    }
    // Remove opcua group values
    if (isUpdateOpcuaToDB()) {
      removeResult = await removeOpcuaGroupValues(appRestClient);
      if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaGroupValues.remoteDB: OK. (${removeResult})`);
    }

    // Remove opcua remote store values
    if (isClearHistoryAtStartup) {
      removeResult = await removeOpcuaStoreValues(appRestClient);
      if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaStoreValues.remoteDB: OK. (${removeResult})`);
    }
    // Update remote store from local store
    const updateStores = await updateRemoteFromLocalStore(app, appRestClient, opcuaTags);
    logger.info(`opcuaBootstrap.updateRemoteFromLocalStore.remoteDB: OK. (${updateStores})`);

  }
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
 * @param {Object} query
 * e.g query -> { $select: ['userName', 'userType'] }
 * @return {Object}
 */
const getItem = async function (app, path = '', id = null, query = {}) {
  let getResult;
  //---------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      getResult = await service.get(id, query);
    } else {
      getResult = await service.get(id, { query });
    }
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
 * @param {Object} query
 * e.g query -> { $select: ['userName', 'userType'] }
 * @return {Object}
 */
const removeItem = async function (app, path = '', id = null, query = {}) {
  let removeResult;
  //------------------------
  const service = app.service(path);
  if (service) {
    if (query.query) {
      removeResult = await service.remove(id, query);
    } else {
      removeResult = await service.remove(id, { query });
    }
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
 * @param {Object} query
 * e.g query -> { $select: ['userName', 'userType'] }
 * @return {Object}
 */
const patchItem = async function (app, path = '', id = '', data = {}, query = {}) {
  let patchResults;
  //-------------------------------
  const _data = cloneObject(data);
  const service = app.service(path);
  if (service) {
    if (query.query) {
      patchResults = await service.patch(id, _data, query);
    } else {
      patchResults = await service.patch(id, _data, { query });
    }
    if (isDebug) inspector(`db-helper.patchItems(path='${path}', data=${JSON.stringify(_data)}, patchResults:`, patchResults);
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
  const _data = cloneObject(data);
  const service = app.service(path);
  if (service) {
    if (query.query) {
      patchResults = await service.patch(null, _data, query);
    } else {
      patchResults = await service.patch(null, _data, { query });
    }
    if (isDebug) inspector(`patchItems(path='${path}', data=${JSON.stringify(_data)}, query=${JSON.stringify(query)}).patchResults:`, patchResults);
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
  const _data = cloneObject(data);
  const service = app.service(path);
  if (service) {
    if (query.query) {
      createResult = await service.create(_data, query);
    } else {
      createResult = await service.create(_data, { query });
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
  const _data = cloneObject(data);
  const service = app.service(path);
  if (service) {
    for (let index = 0; index < _data.length; index++) {
      const item = _data[index];
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
  setInitRemoteDB,
  getInitRemoteDB,
  dbNullIdValue,
  getEnvTypeDB,
  getEnvAdapterDB,
  isSaveOpcuaToDB,
  isRemoteOpcuaToDB,
  isUpdateOpcuaToDB,
  getOpcuaSaveModeToDB,
  getOpcuaRemoteDbUrl,
  getIdField,
  getMaxValuesStorage,
  getStorePeriod,
  getStoreParams4Data,
  //------------------
  saveOpcuaGroupValue,
  saveOpcuaValues,
  saveStoreOpcuaGroupValues,
  saveStoreOpcuaValues4Hook,
  //-----------------------
  checkStoreParameterChanges,
  saveOpcuaTags,
  removeOpcuaGroupValues,
  removeOpcuaStoreValues,
  getOpcuaTagValuesFromStores,
  getStoresFromOpcuaTagValues,
  saveStoreParameterChanges,
  updateRemoteFromLocalStore,
  integrityCheckOpcua,
  syncHistoryAtStartup,
  syncReportAtStartup,
  initRemoteDB,
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
