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
  let result = '';
  //----------------
  // Run script
  switch (options.command) {
  case 'ch-m5CreateAcmYearTemplate':
    if(options.point) result = 'ns=1;s=CH_M5::RunCommand';
    break;
  default:
    break;
  }
  return result;
}

module.exports = checkRunCommand;