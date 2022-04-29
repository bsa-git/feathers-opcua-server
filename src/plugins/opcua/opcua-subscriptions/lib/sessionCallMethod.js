/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');
const chalk = require('chalk');

const {
  inspector,
} = require('../../../lib');

const {
  formatDataValue
} = require('../../opcua-helper');

const {
  checkRunCommand
} = require('../../opcua-client-scripts/lib');

const debug = require('debug')('app:runCommand');
const isDebug = false;
const isLog = false;

/**
 * @method sessionCallMethod
 * 
 * @param {Object} params 
 * @returns {Object[]}
 */
async function sessionCallMethod(params) {

  if (isDebug && params) inspector('sessionCallMethod.params:', loOmit(params, ['myOpcuaClient', 'app']));
  // Get arguments for function
  const client = params.myOpcuaClient;
  const browseName = params.browseName;
  const inputArguments = params.inputArguments;
  // Run function 'sessionCallMethod'
  const callResults = await client.sessionCallMethod(browseName, inputArguments);
  return callResults; 
}

module.exports = sessionCallMethod;
