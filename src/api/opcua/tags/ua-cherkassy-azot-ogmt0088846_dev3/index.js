const loMergeWith = require('lodash/mergeWith');
const CH_A5_Device1_Options = require('./CH_A5.Device1_Options.json');
const CH_A5_Device2_Options = require('./CH_A5.Device2_Options.json');

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

let mergeResult = loMergeWith(CH_A5_Device1_Options, CH_A5_Device2_Options, customizer);

module.exports = mergeResult;