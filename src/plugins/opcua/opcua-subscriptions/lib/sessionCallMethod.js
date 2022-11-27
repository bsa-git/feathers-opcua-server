/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../../lib');

const isDebug = false;

/**
 * @method sessionCallMethod
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
