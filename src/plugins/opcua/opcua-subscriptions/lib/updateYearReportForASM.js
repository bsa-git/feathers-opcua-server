/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const {
  ExceljsHelperClass,
} = require('../../../excel-helpers');

const moment = require('moment');

const loForEach = require('lodash/forEach');
const loTemplate = require('lodash/template');

const dataTestPath = '/test/data/tmp/excel-helper';
let dataPath = '/src/api/app/opcua-methods/asm-reports/data';
let paramsPath = '/src/api/app/opcua-methods/asm-reports/params';

const isLog = false;

/**
 * @method updateYearReportForASM
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
  if (isLog && addressSpaceOption) inspector('updateYearReportForASM.addressSpaceOption:', addressSpaceOption);

  // Get group value
  const browseName = addressSpaceOption.browseName;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  if (isLog && dataValue) inspector('saveOpcuaGroupValueToDB.formatDataValue:', dataValue);
  let value = dataValue.value.value;
  value = JSON.parse(value);
  if (true && value) inspector('saveOpcuaGroupValueToDB.value:', value);

  // Get file name
  let toFile = addressSpaceOption.getterParams.toFile;
  toFile = loTemplate(toFile)({ year: value['!value'].date });
  console.log('toFile:', toFile);
}

module.exports = updateYearReportForASM;
