/* eslint-disable no-unused-vars */
const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  inspector,
} = require('../../../lib');


const isDebug = false;

/**
 * @name checkCallMethod
 * @param {Object} options 
 * @param {Object} result
 * @returns {Object}
 */
function checkCallMethod(options, result) {
  let inputArgument = {}, inputArguments = [];
  //-------------------------------
  
  // Run script
  switch (options.method) {
  case 'ch_m5CreateAcmYearTemplate':
    if (options.opt && options.opt.point) {
        
      options.sessCallMethodOpts.nodesToCallMethod.objectId = 'ns=1;i=1663';
      options.sessCallMethodOpts.nodesToCallMethod.methodId = 'ns=1;s=CH_M5::YearTemplateCreate';

      const opt = options.opt;

      // Set input argument
      if (opt.test) inputArgument.isTest = opt.test;
      if (opt.point) inputArgument.pointID = opt.point;
      if (opt.period) inputArgument.period = opt.period;
      if (opt.year) inputArgument.startYear = opt.year;

      inputArguments.push({
        dataType: DataType.String,
        value: JSON.stringify(inputArgument),
      });

    } else {
      return null;
    }
    break;
  case 'ch_m5GetAcmDayReportsData':
    if (options.opt && options.opt.point) {
        
      options.sessCallMethodOpts.nodesToCallMethod.objectId = 'ns=1;i=1663';
      options.sessCallMethodOpts.nodesToCallMethod.methodId = 'ns=1;s=CH_M5::AcmDayReportsDataGet';

      const opt = options.opt;

      // Set input argument
      if (opt.point) inputArgument.pointID = opt.point;
      if (opt.pattern) inputArgument.pattern = opt.pattern;

      inputArguments.push({
        dataType: DataType.String,
        value: JSON.stringify(inputArgument),
      });

    } else {
      return null;
    }
    break;
  default:
    break;
  }

  options.sessCallMethodOpts.nodesToCallMethod.inputArguments = inputArguments;

  return options;
}

module.exports = checkCallMethod;