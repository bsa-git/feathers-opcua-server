const loMerge = require('lodash/merge');
const CH_A3_Options = require('./CH-A3_Options.json');
const CH_M2_Options = require('./CH-M2_Options.json');
const CH_M7_Options = require('./CH-M7_Options.json');
const CH_M9_Options = require('./CH-M9_Options.json');
const CH_NG_UPG2_Options = require('./CH-NG-UPG2_Options.json');

module.exports = loMerge({}, CH_A3_Options, CH_M2_Options, CH_M7_Options, CH_M9_Options, CH_NG_UPG2_Options);