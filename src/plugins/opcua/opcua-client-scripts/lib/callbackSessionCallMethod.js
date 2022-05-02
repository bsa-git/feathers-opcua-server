/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const isDebug = false;

/**
 * @async
 * @name callbackSessionCallMethod
 * @param {Object} session 
 * @param {Object} params 
 * @returns {String}
 */
const callbackSessionCallMethod = async (session, params) => {
  let itemNodeIds = [], result;
  //---------------------------------------------

  if (isDebug && params) inspector('callbackSessionCallMethod.params:', params);

  // Get method arguments
  const objectId = params.opcua.ownerNodeId;
  const methodId = params.opcua.nodeId;
  const inputArguments = params.opcua.inputArguments;

  itemNodeIds.push({ objectId, methodId, inputArguments });
  if (isDebug && itemNodeIds) inspector('callbackSessionCallMethod.itemNodeIds:', itemNodeIds);

  // Session call method
  result = await session.call(itemNodeIds);
  if (isDebug && result) inspector('callbackSessionCallMethod.result:', result);
  return result;
};

module.exports = callbackSessionCallMethod;