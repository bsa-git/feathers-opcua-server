/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const moment = require('moment');

const {
  inspector,
} = require('../../../lib');

const isDebug = false;

/**
 * @method sessionReadHistoryValues
 * 
 * @param {Object} params 
 * @returns {Object[]}
 */
async function sessionReadHistoryValues(params) {

  if (isDebug && params) inspector('sessionReadHistoryValues.params:', loOmit(params, ['myOpcuaClient']));
  // Get client
  const client = params.myOpcuaClient;
  // Get browseName
  const addressSpaceOption = params.addressSpaceOption;
  const browseName = addressSpaceOption.browseName;
  // Set startTime and endTime for history
  const start = moment(0);
  const end = moment();

  // Run function 'sessionReadHistoryValues'
  const readResult = await client.sessionReadHistoryValues(browseName, start, end);
  if (readResult.length && readResult[0].statusCode.name === 'Good') {
    if (readResult[0].historyData.dataValues.length) {
      const dataValues = readResult[0].historyData.dataValues;
      if (isDebug && dataValues.length) inspector('sessionReadHistoryValues.dataValues.length:', dataValues.length);
    }
  }
  return readResult; 
}

module.exports = sessionReadHistoryValues;
