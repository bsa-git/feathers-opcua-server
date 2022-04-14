/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../lib');

const {
  showInfoForGroupHandler,
  saveOpcuaGroupValueToDB,
  updateYearReportForASM
} = require('./lib');

const isLog = false;

/**
 * @method onChangedCommonHandle
 * 
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForASM(params, dataValue) {
  if (isLog && params) inspector('onChangedGroupHandlerForASM.params:', params);
  if (isLog && dataValue) inspector('onChangedGroupHandlerForASM.dataValue:', dataValue);
  const addressSpaceOption = params.addressSpaceOption;

  // Only for group values
  if (addressSpaceOption && !addressSpaceOption.group) return;

  // Save data to DB
  const savedValue = await saveOpcuaGroupValueToDB(params, dataValue);
  if (isLog && savedValue) inspector('onChangedGroupHandlerForASM.savedValue:', savedValue);

  // Update year report
  await updateYearReportForASM(params, dataValue);

  // Show info
  showInfoForGroupHandler(params, dataValue);
}

module.exports = onChangedGroupHandlerForASM;
