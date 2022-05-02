/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const ch_m5CreateAcmYearTemplate = require('./methods/ch_m5CreateAcmYearTemplate');

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
      if (result) {
        ch_m5CreateAcmYearTemplate(null, result);
      } else {
        checkResult = ch_m5CreateAcmYearTemplate(options);
      }
    }
    break;
  default:
    break;
  }
  return checkResult;
}

module.exports = checkCallMethod;