/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const debug = require('debug')('app:OPCUAGetters');
const isDebug = false;


/**
 * @method histPlugForGroupVariables
 * 
 * @param {Object} params
 * @param {Object} addedValue 
 */
function histPlugForGroupVariables(params = {}) {
  params = loOmit(params, ['myOpcuaServer']);
  if (isDebug) debug('histPlugForGroupVariables.params:', params);
  return params.value ? params.value : null;
}

module.exports = {
  histPlugForGroupVariables,
};
