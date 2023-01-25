const loMergeWith = require('lodash/mergeWith');
const CH_A5_XozUchet_Options = require('./CH-A5_XozUchet_Options.json');
const CH_A5_XozUchet_Daily_Options = require('./CH-A5_XozUchet_Daily_Options.json');
const CH_A5_Mnemo1_Options = require('./CH-A5_Mnemo1_Options.json');

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

let mergeResult = loMergeWith(CH_A5_XozUchet_Options, CH_A5_Mnemo1_Options, customizer);
mergeResult = loMergeWith(mergeResult, CH_A5_XozUchet_Daily_Options, customizer);
// mergeResult = loMergeWith(mergeResult, CH_A5_Mnemo1_Options, customizer);

module.exports = mergeResult;