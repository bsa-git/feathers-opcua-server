/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const chalk = require('chalk');

const {
  DataType,
} = require('node-opcua');

const {
  inspector,
  getPathBasename
} = require('../../../../lib');

const sessionCallMethod = require('../sessionCallMethod');

const debug = require('debug')('app:ch_m5CreateAcmYearTemplate');
const isDebug = false;

/**
 * @method ch_m5CreateAcmYearTemplate
 * 
 * @param {Object} params 
 * @param {Object} value
 * @returns {void}
 */
async function ch_m5CreateAcmYearTemplate(params, value) {
  let inputArgument = {}, inputArguments = [], outputArguments;
  let pointID = 0, statusCode, inputArgsStatusCode;
  //---------------------------------------------------

  if (isDebug && params) inspector('ch_m5CreateAcmYearTemplate.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && value) inspector('ch_m5CreateAcmYearTemplate.value:', value);

  const opt = value.opt;

  // Set input argument
  if (opt.test) inputArgument.isTest = opt.test;
  if (opt.point) {
    pointID = opt.point;
    inputArgument.pointID = opt.point;
  }
  if (opt.period) inputArgument.period = opt.period;
  if (opt.year) inputArgument.startYear = opt.year;

  inputArguments.push([
    {
      dataType: DataType.String,
      value: JSON.stringify(inputArgument),
    }
  ]);

  const callMethodResult = await sessionCallMethod(params, {
    showCallMethod: false,
    methodIds: 'CH_M5::YearTemplateCreate',
    inputArguments
  });
  if (isDebug && callMethodResult) inspector('ch_m5CreateAcmYearTemplate.callMethodResult:', callMethodResult);

  statusCode = callMethodResult.statusCode;
  inputArgsStatusCode = callMethodResult.inputArgsStatusCode;
  if (statusCode === 'Good' && inputArgsStatusCode === 'Good') {
    outputArguments = JSON.parse(callMethodResult.outputArguments[0][0].value);// { resultPath, params, hours, days }
    const resultFile = getPathBasename(outputArguments.resultPath);
    if (true && callMethodResult) console.log(
      chalk.greenBright('sessionCallMethod(methodAcmYearTemplateCreate) - OK!'),
      `For pointID=${pointID};`,
      `hours: ${outputArguments.hours};`,
      `days: ${outputArguments.days};`,
      `resultFile: '${resultFile}';`
    );
  } else {
    console.log(
      chalk.redBright('runCommand(ch_m5CreateAcmYearTemplate): ERROR!'),
      `statusCode: '${statusCode}';`,
      `inputArgsStatusCode: '${inputArgsStatusCode}';`
    );
  }
  return callMethodResult;
}

module.exports = ch_m5CreateAcmYearTemplate;
