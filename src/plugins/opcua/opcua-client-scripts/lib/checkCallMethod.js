/* eslint-disable no-unused-vars */
const chalk = require('chalk');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  inspector,
  getPathBasename
} = require('../../../lib');


const isDebug = false;

/**
 * @name checkCallMethod
 * @param {Object} options 
 * @param {Object} result
 * @returns {Object}
 */
function checkCallMethod(options, result) {
  let _result, inputArgument = {}, inputArguments = [];
  let statusCode, inputArgsStatusCode, outputArguments;
  let resultFile;
  //--------------------------------------------------

  if (isDebug && options) inspector('checkCallMethod.options:', options);
  if (isDebug && result) inspector('checkCallMethod.result:', result);

  // Run script
  switch (options.method) {
  case 'ch_m5CreateAcmYearTemplate':
    if (result) {
      statusCode = result.statusCode;
      inputArgsStatusCode = result.inputArgsStatusCode;
      if (statusCode === 'Good' && inputArgsStatusCode === 'Good') {
        outputArguments = JSON.parse(result.outputArguments[0][0].value);// { resultPath, params, hours, days }
        resultFile = getPathBasename(outputArguments.resultPath);
        if (true && result) console.log(
          chalk.greenBright('runMethod(methodAcmYearTemplateCreate) - OK!'),
          `For pointID=${options.opt.point};`,
          `hours: ${outputArguments.hours};`,
          `days: ${outputArguments.days};`,
          `resultFile: "${chalk.cyan(resultFile)}";`
        );
      } else {
        console.log(
          chalk.redBright('runMethod(methodAcmYearTemplateCreate): ERROR!'),
          `statusCode: '${statusCode}';`,
          `inputArgsStatusCode: '${inputArgsStatusCode}';`
        );
      }
      _result = result;
    } else {
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

        options.sessCallMethodOpts.nodesToCallMethod.inputArguments = inputArguments;
        _result = options;

      } else {
        _result = null;
      }
    }
    break;
  case 'ch_m5GetAcmDayReportsData':
    if (result) {
      statusCode = result.statusCode;
      inputArgsStatusCode = result.inputArgsStatusCode;
      if (statusCode === 'Good' && inputArgsStatusCode === 'Good') {
        outputArguments = JSON.parse(result.outputArguments[0][0].value);// { resultPath, params, hours, days }
        resultFile = getPathBasename(outputArguments.resultPath);
        if (true && result) console.log(
          chalk.greenBright('runMethod(methodAcmDayReportsDataGet) - OK!'),
          `For pointID=${options.opt.point};`,
          `resultFile: "${chalk.cyan(resultFile)}";`
        );
      } else {
        console.log(
          chalk.redBright('runMethod(methodAcmDayReportsDataGet): ERROR!'),
          `statusCode: '${statusCode}';`,
          `inputArgsStatusCode: '${inputArgsStatusCode}';`
        );
      }
      _result = result;
    } else {
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

        options.sessCallMethodOpts.nodesToCallMethod.inputArguments = inputArguments;
        _result = options;

      } else {
        _result = null;
      }
    }
    break;
  default:
    break;
  }

  return _result;
}

module.exports = checkCallMethod;