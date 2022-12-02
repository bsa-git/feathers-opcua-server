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
  saveOpcuaGroupValue
} = require('../../../db-helpers');

const debug = require('debug')('app:saveOpcuaGroupValueToDB');
const isDebug = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function saveOpcuaGroupValueToDB(params, dataValue) {
  let savedValue = null;
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
  let value = dataValue.value.value;

  // Save data to DB
  if (isSaveOpcuaToDB()) {
    savedValue = await saveOpcuaGroupValue(app, browseName, value);
    if (isDebug && savedValue) inspector('saveOpcuaGroupValueToDB.savedValue:', savedValue);
  } 
  return savedValue;
}

module.exports = saveOpcuaGroupValueToDB;
