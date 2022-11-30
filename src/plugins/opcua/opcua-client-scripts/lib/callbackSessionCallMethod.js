/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  assert,
  inspector,
  checkCorrectEnumType
} = require('../../../lib');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  showInfoForHandler2,
} = require('../../../opcua/opcua-subscriptions/lib');

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
  let callResults;
  //---------------------------------------------

  if (isDebug && params) inspector('callbackSessionCallMethod.params:', loOmit(params, ['app']));
  assert(params.sessCallMethodOpts.nodesToCallMethod, 'The object "(params.sessCallMethodOpts" must have a "nodesToCallMethod" field');
  let nodesToCallMethod =
    Array.isArray(params.sessCallMethodOpts.nodesToCallMethod) ?
      params.sessCallMethodOpts.nodesToCallMethod :
      Object.assign({}, params.sessCallMethodOpts.nodesToCallMethod);
  const showCallMethod = params.sessCallMethodOpts.showCallMethod;
  if (!Array.isArray(nodesToCallMethod)) nodesToCallMethod = [nodesToCallMethod];

  // Check nodesToCallMethod
  for (let index = 0; index < nodesToCallMethod.length; index++) {
    const nodeToCallMethod = nodesToCallMethod[index];
    assert(nodeToCallMethod.objectId, 'The object "nodeToCallMethod" must have a "objectId" field');
    assert(nodeToCallMethod.methodId, 'The object "nodeToCallMethod" must have a "methodId" field');
    assert(Array.isArray(nodeToCallMethod.inputArguments), 'The object "nodeToCallMethod" must have a "inputArguments" field');
    for (let index2 = 0; index2 < nodeToCallMethod.inputArguments.length; index2++) {
      const inputArgument = nodeToCallMethod.inputArguments[index2];
      checkCorrectEnumType(DataType, inputArgument.dataType);
      assert(inputArgument.value !== undefined, 'The object "inputArgument" must have a "value" field');
    }
  }

  if (isDebug && nodesToCallMethod) inspector('callbackSessionCallMethod.nodesToCallMethod:', nodesToCallMethod);

  // Session call method
  callResults = await session.call(nodesToCallMethod);
  if (isDebug && callResults) inspector('callbackSessionCallMethod.callResults:', callResults);
  let statusCode = callResults.filter(callResult => callResult.statusCode.name === 'Good').length === callResults.length;
  statusCode = statusCode ? 'Good' : 'Bad';
  let inputArgsStatusCode = callResults.filter(callResult => {
    const inputArgsStatusCode = callResult.inputArgumentResults.filter(inputArg => inputArg.name === 'Good').length === callResult.inputArgumentResults.length;
    return inputArgsStatusCode;
  }).length === callResults.length;
  inputArgsStatusCode = inputArgsStatusCode ? 'Good' : 'Bad';
  const outputArguments = callResults.map(callResult => callResult.outputArguments);
  if (isDebug && outputArguments) inspector('callbackSessionCallMethod.outputArguments:', outputArguments);
  
  if (showCallMethod) {
    console.log('<-------------------------------------------------------------------------------------->');
    for (let index = 0; index < callResults.length; index++) {
      const callResult = callResults[index];
      const statusCode = callResult.statusCode.name;
      let inputArgsStatusCode = callResult.inputArgumentResults.filter(inputArg => inputArg.name === 'Good').length === callResult.inputArgumentResults.length;
      inputArgsStatusCode = inputArgsStatusCode ? 'Good' : 'Bad';
      const outputArgument = outputArguments[index];
      const nodeToCallMethod = nodesToCallMethod[index];
      const methodId = nodeToCallMethod.methodId;
      inspector(`callMethod.methodId(${methodId}): statusCode: "${statusCode}", inputArgsStatusCode: "${inputArgsStatusCode}"`, outputArgument);
    }
    console.log('<-------------------------------------------------------------------------------------->');
  }
  
  const result = { statusCode, inputArgsStatusCode, outputArguments };
  
  return result;
};

module.exports = callbackSessionCallMethod;