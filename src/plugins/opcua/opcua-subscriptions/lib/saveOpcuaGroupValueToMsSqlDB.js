/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loForEach = require('lodash/forEach');

const {
  inspector,
  logger,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const { MssqlTedious } = require('../../../db-helpers');
const queryFuncs = require('../../../db-helpers/lib');

const {
  findItem,
  findItems,
  isSaveOpcuaToDB,
  saveOpcuaGroupValue,
} = require('../../../db-helpers');

const debug = require('debug')('app:saveOpcuaGroupValueToMsSqlDB');
const isDebug = false;

/**
 * @method saveOpcuaGroupValueToMsSqlDB
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * e.g.  {
 * '!value': { dateTime: '2022-01-01' },
 * 'CH_M51_ACM::23N2O:23QN2O': [232,..., 567],
 * ...
 * 'CH_M51_ACM::23VSG:23FVSG': [12345,..., 6789]
 * }
 * @returns {Object[]}
 */
async function saveOpcuaGroupValueToMsSqlDB(params, dataValue) {
  let savedValue = null, opcuaValueItem = {}, opcuaValues = [];
  //----------------------------------------------------------
  if (isDebug && params) inspector('saveOpcuaGroupValueToMsSqlDB.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && dataValue) inspector('saveOpcuaGroupValueToMsSqlDB.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const subscribeParams = addressSpaceOption.subscribeParams;
  const browseName = addressSpaceOption.browseName;
  const app = params.myOpcuaClient.app;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('saveOpcuaGroupValueToMsSqlDB.formatDataValue:', dataValue);
  let opcuaValue = dataValue.value.value;
  opcuaValue = JSON.parse(opcuaValue);

  // Get tag for browseName
  const groupTag = await findItem(app, 'opcua-tags', { browseName });
  if (opcuaValue && groupTag) {
    // Get group items
    const groupTagItems = await findItems(app, 'opcua-tags', { ownerGroup: browseName });
    // Normalize opcuaValue
    loForEach(opcuaValue, (value, key) => {
      const findedGroupTag = groupTagItems.find(item => (item.browseName === key) || (item.aliasName === key));
      if (findedGroupTag) {
        opcuaValueItem = {};
        const aliasName = findedGroupTag.aliasName;
        opcuaValueItem[aliasName] = value;
        opcuaValues.push(opcuaValueItem);
      }
    });
  }

  // Execute query MsSql DB
  try {
    // Get subscribe params
    const queryFunc = subscribeParams.queryFunc;
    const queryParams = Object.assign({}, subscribeParams.queryParams, opcuaValue['!value'], { opcuaValues });
    if (isDebug && queryParams) inspector('saveOpcuaGroupValueToMsSqlDB.queryParams:', queryParams);
    
    // Create an instance of a class
    const mssqlDB = new MssqlTedious(subscribeParams.dbEnv);
    // mssqlDB connect
    await mssqlDB.connect();
    
    // Execute query
    savedValue = await mssqlDB.executeQuery(queryFunc, queryParams);
    if (isDebug && savedValue) inspector('saveOpcuaGroupValueToMsSqlDB.savedValue:', savedValue);

    // mssqlDB disconnect
    if (mssqlDB.connection) await mssqlDB.disconnect();
  } catch (error) {
    const errorMessage = error.message? error.message : error;
    logger.error(`saveOpcuaGroupValueToMsSqlDB.Error: "${errorMessage}"`);
  }
  return savedValue;
}

module.exports = saveOpcuaGroupValueToMsSqlDB;
