/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const debug = require('debug')('app:updateYearReportForASM');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function updateYearReportForASM(params, dataValue) {
  if (isLog && params) inspector('updateYearReportForASM.params:', params);
  if (isLog && dataValue) inspector('updateYearReportForASM.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog && dataValue) inspector('saveOpcuaGroupValueToDB.formatDataValue:', dataValue);
  let value = dataValue.value.value;
  value = JSON.parse(value);

  
}

module.exports = updateYearReportForASM;
