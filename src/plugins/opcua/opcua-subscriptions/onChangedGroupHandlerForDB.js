/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const logger = require('../../../logger');

const {
  inspector,
} = require('../../lib'); 

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
  sessionReadHistoryValues
} = require('./lib');

const debug = require('debug')('app:onChangedGroupHandlerForDB');
const isDebug = false;

/**
 * @method onChangedGroupHandlerForDB
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForDB(params, dataValue) {
  
  try {
    if (isDebug && params) inspector('subscriptions.onChangedGroupHandlerForDB.params:', loOmit(params, ['myOpcuaClient', 'app']));
    if (isDebug && dataValue) inspector('subscriptions.onChangedGroupHandlerForDB.dataValue:', dataValue);
    const addressSpaceOption = params.addressSpaceOption;

    // Only for group values
    if (addressSpaceOption && !addressSpaceOption.group) return;

    // Save data to DB
    const p1 = saveOpcuaGroupValueToDB(params, dataValue);
    // Read history values
    // const p2 = sessionReadHistoryValues(params);


    // Show info
    Promise.all([p1, 'p2']).then(results => {
      if (isDebug && results.length) inspector('saveOpcuaGroupValueToDB.savedValue:', results[0]);
      if (isDebug && results.length) inspector('sessionReadHistoryValues.readResult:', results[1]);
      showInfoForGroupHandler(params, dataValue);
    });     

  } catch (error) {
    logger.error(`onChangedGroupHandlerForDB.Error: ${error.message}`);
  }
  
  
}

module.exports = onChangedGroupHandlerForDB;