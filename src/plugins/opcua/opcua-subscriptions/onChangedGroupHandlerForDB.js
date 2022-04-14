/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../lib');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
  updateYearReportForASM
} = require('./lib');

const {
  isSaveOpcuaToDB,
  saveOpcuaGroupValue
} = require('../../db-helpers');

const {
  getValueFromNodeId,
  formatDataValue
} = require('../opcua-helper');

const chalk = require('chalk');
const loRound = require('lodash/round');

const debug = require('debug')('app:opcua-subscriptions/onChangedGroupHandlerForDB');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedGroupHandlerForDB
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForDB(params, dataValue) {
  if (isLog && params) inspector('subscriptions.onChangedGroupHandlerForDB.params:', params);
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