/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  assert,
  inspector,
  checkCorrectEnumType
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
 * @param {Object} value
 * e.g. value = { 
 * showCallMethod: true, 
 * methodIds: 'CH_M5::YearTemplateCreate',
 * inputArguments: [new Variant({...}),..., new Variant({...})]
 *  }
 * e.g. inputArguments: [new Variant({...}),..., new Variant({...})]|
 * [{dataType: DataType.String, value: 'qwerty'},..., {dataType: DataType.String, value: 'qwerty'}]
 * @returns {Object[]}
 */
async function sessionCallMethod(params, value) {
  let methodIds, inputArguments;
  //--------------------------------------------
  const _value = Object.assign({}, value);
  if (isDebug && params) inspector('sessionCallMethod.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && _value) inspector('sessionCallMethod.value:', _value);
  const showCallMethod = !!_value.showCallMethod;
  // Check methodIds
  assert(_value.methodIds, 'The object must have a "methodIds" field');
  if (!Array.isArray(_value.methodIds)) methodIds = [_value.methodIds];

  // Check inputArguments
  assert(Array.isArray(_value.inputArguments), 'The object must have a "inputArguments" field');
  inputArguments = _value.inputArguments;
  for (let index = 0; index < inputArguments.length; index++) {
    const inputArgument = inputArguments[index];
    assert(Array.isArray(inputArgument), 'The value is not an array');
    for (let index2 = 0; index2 < inputArgument.length; index2++) {
      const _inputArgument = inputArgument[index2];
      checkCorrectEnumType(DataType, _inputArgument.dataType);
      assert(_inputArgument.value !== undefined, 'The object must have a "value" field');
    }
  }

  // Get myOpcuaClient
  const client = params.myOpcuaClient;
  // Run function 'sessionCallMethod'
  const callResults = await client.sessionCallMethod(methodIds, inputArguments);
  if (isDebug && callResults) inspector('sessionCallMethod.callResults:', callResults);
  let statusCode = callResults.filter(callResult => callResult.statusCode.name === 'Good').length === callResults.length;
  statusCode = statusCode ? 'Good' : 'Bad';
  let inputArgsStatusCode = callResults.filter(callResult => {
    const inputArgsStatusCode = callResult.inputArgumentResults.filter(inputArg => inputArg.name === 'Good').length === callResult.inputArgumentResults.length;
    return inputArgsStatusCode;
  }).length === callResults.length;
  inputArgsStatusCode = inputArgsStatusCode ? 'Good' : 'Bad';
  const outputArguments = callResults.map(callResult => callResult.outputArguments);

  if (showCallMethod) {
    console.log('<-------------------------------------------------------------------------------------->');
    for (let index = 0; index < callResults.length; index++) {
      const callResult = callResults[index];
      const statusCode = callResult.statusCode.name;
      let inputArgsStatusCode = callResult.inputArgumentResults.filter(inputArg => inputArg.name === 'Good').length === callResult.inputArgumentResults.length;
      inputArgsStatusCode = inputArgsStatusCode ? 'Good' : 'Bad';
      const outputArgument = outputArguments[index];
      const methodId = methodIds[index];
      inspector(`sessionCallMethod.methodId(${methodId}): statusCode: "${statusCode}", inputArgsStatusCode: "${inputArgsStatusCode}"`, outputArgument);
    }
    console.log('<-------------------------------------------------------------------------------------->');
  }

  const result = { statusCode, inputArgsStatusCode, outputArguments };

  return result;
}

module.exports = sessionCallMethod;
