/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const { OPCUAClient } = require('node-opcua');

const isDebug = false;

/**
 * @name checkRunCommand
 * @param {Object} options 
 * @returns {String}
 */
function checkRunCommand(options) {
  let result = null;
  //----------------
  // Run script
  switch (options.command) {
  case 'ch-m5CreateAcmYearTemplate':
    if(options.opt.point) {
      result = {};
      result.nodeId = 'ns=1;s=CH_M5::RunCommand';
      result.browseName = 'CH_M5::YearTemplateCreate';
    } 
    break;
  default:
    break;
  }
  return result;
}

module.exports = checkRunCommand;