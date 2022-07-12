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
  let result, inputArgument = {}, inputArguments = [];
  let pointID = 0, statusCode, outputArguments;
  //---------------------------------------------------

  if (isDebug && params) inspector('ch_m5CreateAcmYearTemplate.params:', loOmit(params, ['myOpcuaClient', 'app']));
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
  // Run server method
  const client = params.myOpcuaClient;
  const browseName = 'CH_M5::YearTemplateCreate';
  result = await client.sessionCallMethod(browseName, inputArguments);
  if (isDebug && result) inspector('ch_m5CreateAcmYearTemplate.result:', result);

  statusCode = result[0].statusCode.name;
  if (statusCode === 'Good') {
    outputArguments = JSON.parse(result[0].outputArguments[0].value);// { resultPath, params, hours, days }
    const resultFile = getPathBasename(outputArguments.resultPath);
    if (isDebug && result) console.log(
      chalk.green('sessionCallMethod(methodAcmYearTemplateCreate) - OK!'),
      `For pointID=${chalk.cyan(pointID)};`,
      `hours: ${chalk.cyan(outputArguments.hours)};`,
      `days: ${chalk.cyan(outputArguments.days)};`,
      `resultFile: '${chalk.cyan(resultFile)}';`
    );
  } else {
    console.log(
      chalk.green('runCommand(ch_m5CreateAcmYearTemplate): ERROR!'),
      `statusCode: '${chalk.cyan(statusCode)}';`
    );
  }
  return result;
}

module.exports = ch_m5CreateAcmYearTemplate;
