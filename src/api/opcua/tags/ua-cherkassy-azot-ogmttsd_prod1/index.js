const loMergeWith = require('lodash/mergeWith');
const CH_A3_Options = require('./CH-A3_Options.json');
const CH_M2_Options = require('./CH-M2_Options.json');
const CH_M7_Options = require('./CH-M7_Options.json');
const CH_M9_Options = require('./CH-M9_Options.json');
const CH_NG_UPG2_Options = require('./CH-NG_UPG2_Options.json');

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

let mergeResult = loMergeWith(CH_A3_Options, CH_M2_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_M7_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_M9_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_NG_UPG2_Options, customizer);

module.exports = mergeResult;