/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const {
  isSaveOpcuaToDB,
  saveStoreOpcuaGroupValues
} = require('../../../db-helpers');

const debug = require('debug')('app:saveOpcuaGroupValueToDB');
const isDebug = false;

/**
 * @method saveStoreOpcuaGroupValueToDB
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function saveStoreOpcuaGroupValueToDB(params, dataValue) {
  let savedValue = null;
  //--------------------------
  if (isDebug && params) inspector('saveStoreOpcuaGroupValueToDB.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && dataValue) inspector('saveStoreOpcuaGroupValueToDB.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isDebug && dataValue) inspector('saveStoreOpcuaGroupValueToDB.formatDataValue:', dataValue);
  let value = dataValue.value.value;

  // Save data to DB
  if (isSaveOpcuaToDB()) {
    savedValue = await saveStoreOpcuaGroupValues(params.app, browseName, value, true);
    if (isDebug && savedValue) inspector('saveStoreOpcuaGroupValueToDB.savedValue:', savedValue);
  } 
  return savedValue;
}

module.exports = saveStoreOpcuaGroupValueToDB;
