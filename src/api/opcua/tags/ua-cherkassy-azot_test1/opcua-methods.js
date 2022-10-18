/* eslint-disable no-unused-vars */
const os = require('os');
const {
  Variant,
  DataType,
  StatusCodes,
  VariantArrayType,
  standardUnits,
  makeAccessLevelFlag,
} = require('node-opcua');

const debug = require('debug')('app:opcua-addressspace-methods');
const isDebug = false;

/**
 * Simulate for value
 * @param {Object[]} inputArguments 
 * @param {Object} context
 * @param {Function} callback
 * @returns {Variant}
 */
function sumMethod(inputArguments, context, callback) {
  
  if(isDebug && inputArguments.length) console.log('sumMethod.inputArguments', inputArguments);

  const number1 = inputArguments[0].value;
  const number2 = inputArguments[1].value;
  let sum = number1 + number2;

  // console.log('Run metod Sum:', sum);

  const callMethodResult = {
    statusCode: StatusCodes.Good,
    outputArguments: [{
      dataType: DataType.UInt32,
      value: sum
    }]
  };
  callback(null, callMethodResult);
}

module.exports = {
  sumMethod,
};
