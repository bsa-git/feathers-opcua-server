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
  let groups, browseNames;
  // Subscription create
  await service.subscriptionCreate(id);

  const srvCurrentState = await service.getSrvCurrentState(id);
  // Start subscriptionMonitor
  const allVariables = srvCurrentState.paramsAddressSpace.variables;
  //---- Group owners  ---//
  browseNames = allVariables.filter(v => v.group).map(v => v.browseName);
  if (browseNames.length) {
    for (let index = 0; index < browseNames.length; index++) {
      const browseName = browseNames[index];
      const nodeIds = await service.getNodeIds(id, browseName);
      for (let index2 = 0; index2 < nodeIds.length; index2++) {
        const nodeId = nodeIds[index2];
        await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
      }
    }
  }

  //---- Group members for CH_M51 ---//
  browseNames = allVariables.filter(v => v.ownerGroup === 'CH_M51::ValueFromFile').map(v => v.browseName);
  if (browseNames.length) {
    groups = getGroupsFromArray(browseNames, 10);
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const nodeIds = await service.getNodeIds(id, group);
      for (let index2 = 0; index2 < nodeIds.length; index2++) {
        const nodeId = nodeIds[index2];
        await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
      }
    }
  }

  //---- Group members for CH_M52 ---//
  browseNames = allVariables.filter(v => v.ownerGroup === 'CH_M52::ValueFromFile').map(v => v.browseName);
  if (browseNames.length) {
    groups = getGroupsFromArray(browseNames, 10);
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const nodeIds = await service.getNodeIds(id, group);
      for (let index2 = 0; index2 < nodeIds.length; index2++) {
        const nodeId = nodeIds[index2];
        await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
      }
    }
  }
}

module.exports = {
  subscriptionMonitor_CH_M5
};
