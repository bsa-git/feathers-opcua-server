/* eslint-disable no-unused-vars */
const {
  inspector,
  getGroupsFromArray
} = require('../../../plugins');


const debug = require('debug')('app:opcua-client-scripts');
const isDebug = false;
const isLog = false;


/**
 * @method subscriptionMonitor_CH_M5
 * @param {String} id 
 * @param {Object} service 
 * @returns {void}
 */
async function subscriptionMonitor_CH_M5(id, service) {
  
  await service.subscriptionCreate(id);

  const srvCurrentState = await service.getSrvCurrentState(id);
  // Start subscriptionMonitor
  let variables = srvCurrentState.paramsAddressSpace.variables;
  variables = variables.filter(v => v.ownerGroup === 'CH_M51::ValueFromFile').map(v => v.browseName);
  const groups = getGroupsFromArray(variables, 10);
  for (let index = 0; index < groups.length; index++) {
    const group = groups[index];
    const nodeIds = await service.getNodeIds(id, group);
    for (let index2 = 0; index2 < nodeIds.length; index2++) {
      const nodeId = nodeIds[index2];
      await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
    }
  }
}

module.exports = {
  subscriptionMonitor_CH_M5
};
