/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

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
  let callResults;
  //----------------------------------

  if (isLog && params) inspector('sessionCallMethod.params:', loOmit(params, ['myOpcuaClient', 'app']));
  // Get arguments for function
  const client = params.myOpcuaClient;
  const id = params.id;
  const nodeId = params.nodeId;
  const inputArguments = params.inputArguments;
  // Run function 'sessionCallMethod'
  callResults = await client.sessionCallMethod(id, nodeId, inputArguments);

}

module.exports = sessionCallMethod;
