/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const { OPCUAClient } = require('node-opcua');

const isDebug = false;

/**
 * @name checkRunCommand
 * @param {Object} options 
 * @returns {Object}
 */
function checkRunCommand(options) {
  let resultOptions = null, points;
  //----------------
  // Run script
  switch (options.command) {
  case 'ch_m5CreateAcmYearTemplate':
    points = options.opt.points;
    if (points && points.length) {
      resultOptions = Object.assign({}, options, { opcua: {} });
      resultOptions.opcua.nodeId = 'ns=1;s=CH_M5::RunCommand';
    }
    break;
  default:
    break;
  }
  return resultOptions;
}

module.exports = checkRunCommand;