/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const isDebug = false;

/**
 * @async
 * @name callbackSessionCallMethod
 * 
 * @example :
 *
 * ```javascript
 * const methodsToCall = [ {
 *     objectId: 'ns=2;i=12',
 *     methodId: 'ns=2;i=13',
 *     inputArguments: [
 *         new Variant({...}),
 *         new Variant({...}),
 *     ]
 * }];
 * session.call(methodsToCall,function(err,callResutls) {
 *    if (!err) {
 *         const callResult = callResutls[0];
 *         console.log(' statusCode = ',rep.statusCode);
 *         console.log(' inputArgumentResults[0] = ',callResult.inputArgumentResults[0].toString());
 *         console.log(' inputArgumentResults[1] = ',callResult.inputArgumentResults[1].toString());
 *         console.log(' outputArgument[0]       = ',callResult.outputArgument[0].toString()); // array of variant
 *    }
 * });
 * ```
 * 
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