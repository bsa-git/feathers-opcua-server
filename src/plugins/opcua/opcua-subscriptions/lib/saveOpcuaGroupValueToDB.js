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
const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function saveOpcuaGroupValueToDB(params, dataValue) {
  if (isLog && params) inspector('saveOpcuaGroupValueToDB.params:', loOmit(params, ['myOpcuaClient']));
  if (isLog && dataValue) inspector('saveOpcuaGroupValueToDB.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog && dataValue) inspector('saveOpcuaGroupValueToDB.formatDataValue:', dataValue);
  let value = dataValue.value.value;
  const timestamp = dataValue.serverTimestamp;

  // Save data to DB
  if (isSaveOpcuaToDB()) {
    const savedValue = await saveOpcuaGroupValue(params.app, browseName, value);
    if (isLog && savedValue) inspector('saveOpcuaGroupValueToDB.savedValue:', savedValue);
    return savedValue;
  }
}

module.exports = saveOpcuaGroupValueToDB;
