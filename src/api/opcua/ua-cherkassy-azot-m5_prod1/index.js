const loMergeWith = require('lodash/mergeWith');
const CH_M51_Options = require('./CH-M51_Options.json');
const CH_M52_Options = require('./CH-M52_Options.json');
const CH_M51_ACM_Options = require('./CH-M51_ACM_Options.json');
const CH_M52_ACM_Options = require('./CH-M52_ACM_Options.json');
const CH_M52_ACM2_Options = require('./CH-M52_ACM2_Options.json');
const CH_M5_Options = require('./CH-M5_Options.json');

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

let mergeResult = loMergeWith(CH_M51_Options, CH_M52_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_M51_ACM_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_M52_ACM_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_M52_ACM2_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_M5_Options, customizer);

module.exports = mergeResult;