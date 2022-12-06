/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const loForEach = require('lodash/forEach');

const {
  inspector,
  getInt
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

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
  let savedValue = null, opcuaValueItem, opcuaValues = [];
  //--------------------------
  if (isDebug && params) inspector('saveOpcuaGroupValueToDB.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && dataValue) inspector('saveOpcuaGroupValueToDB.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;
  const app = params.myOpcuaClient.app;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('saveOpcuaGroupValueToDB.formatDataValue:', dataValue);
  let opcuaValue = dataValue.value.value;
  opcuaValue = JSON.parse(opcuaValue);

  // Get tag for browseName
  const groupTag = await findItem(app, 'opcua-tags', { browseName });
  if (opcuaValue && groupTag) {
    // Get group items
    const groupTagItems = await findItems(app, 'opcua-tags', { ownerGroup: browseName });
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
  }

  // Save data to DB
  // if (isSaveOpcuaToDB()) {
  //   savedValue = await saveOpcuaGroupValue(app, browseName, value);
  //   if (isDebug && savedValue) inspector('saveOpcuaGroupValueToDB.savedValue:', savedValue);
  // } 
  return savedValue;
}

module.exports = saveOpcuaGroupValueToMsSqlDB;
