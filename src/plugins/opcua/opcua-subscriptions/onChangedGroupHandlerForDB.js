/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../lib');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
} = require('./lib');

const debug = require('debug')('app:onChangedGroupHandlerForDB');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedGroupHandlerForDB
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForDB(params, dataValue) {
  if (isLog && params) inspector('subscriptions.onChangedGroupHandlerForDB.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isLog && dataValue) inspector('subscriptions.onChangedGroupHandlerForDB.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  // Save data to DB
  const savedValue = await saveOpcuaGroupValueToDB(params, dataValue);
  if (isLog && savedValue) inspector('onChangedGroupHandlerForASM.savedValue:', savedValue);

  // Show info
  showInfoForGroupHandler(params, dataValue);
}

module.exports = onChangedGroupHandlerForDB;