/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../../lib');

const isDebug = false;

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
  const browseName = params.opcua.browseName;
  const inputArguments = params.opcua.inputArguments;
  // Run function 'sessionCallMethod'
  const callResults = await client.sessionCallMethod(browseName, inputArguments);
  return callResults; 
}

module.exports = sessionCallMethod;
