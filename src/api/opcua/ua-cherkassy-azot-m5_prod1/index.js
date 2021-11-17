const loMergeWith = require('lodash/mergeWith');
const CH_M51_Options = require('./CH-M51_Options.json');
const CH_M52_Options = require('./CH-M52_Options.json');

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

const mergeResult = loMergeWith(CH_M51_Options, CH_M52_Options, customizer);

module.exports = mergeResult;