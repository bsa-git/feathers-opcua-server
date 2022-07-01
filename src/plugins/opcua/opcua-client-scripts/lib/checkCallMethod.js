/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const ch_m5CreateAcmYearTemplate = require('./methods/ch_m5CreateAcmYearTemplate');
const ch_m5GetAcmDayReportsData = require('./methods/ch_m5GetAcmDayReportsData');

const isDebug = false;

/**
 * @name checkCallMethod
 * @param {Object} options 
 * @param {Object} result
 * @returns {Object}
 */
function checkCallMethod(options, result) {
  let checkResult = null, points;
  //-------------------------------
  // Run script
  switch (options.method) {
  case 'ch_m5CreateAcmYearTemplate':
    if (options.opt && options.opt.point) {
      checkResult = ch_m5CreateAcmYearTemplate(options);
      if (result) {
        checkResult = ch_m5CreateAcmYearTemplate(checkResult, result);
      }
    }
    break;
  case 'ch_m5GetAcmDayReportsData':
    if (options.opt && options.opt.point) {
      checkResult = ch_m5GetAcmDayReportsData(options);
      if (result) {
        checkResult = ch_m5GetAcmDayReportsData(checkResult, result);
      }
    }
    break;
  default:
    break;
  }
  return checkResult;
}

module.exports = checkCallMethod;