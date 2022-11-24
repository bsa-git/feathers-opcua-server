/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const isDebug = false;

/**
 * @name checkRunCommand
 * @param {Object} options 
 * @returns {Object}
 */
function checkRunCommand(options) {
  let points;
  //----------------
  // Run script
  switch (options.command) {
  case 'ch_m5CreateAcmYearTemplate':
    points = options.opt.points;
    if (points && points.length) {
      options.sessWriteOpts.nodesToWrite.nodeId = 'ns=1;s=CH_M5::RunCommand';
    } else {
      return null;
    }
    break;
  case 'ch_m5SyncStoreAcmValues':
    points = options.opt.points;
    if (points && points.length) {
      options.sessWriteOpts.nodesToWrite.nodeId = 'ns=1;s=CH_M5::RunCommand';
    } else {
      return null;
    }
    break;
  case 'ch_m5SyncAcmYearReport':
    points = options.opt.points;
    if (points && points.length) {
      options.sessWriteOpts.nodesToWrite.nodeId = 'ns=1;s=CH_M5::RunCommand';
    } else {
      return null;
    }
    break;
  default:
    break;
  }
  return options;
}

module.exports = checkRunCommand;