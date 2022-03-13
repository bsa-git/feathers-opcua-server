/* eslint-disable no-unused-vars */
const {
  inspector,
  getGroupsFromArray
} = require('../../lib');


const debug = require('debug')('app:opcua-client-scripts');
const isDebug = false;
const isLog = false;


/**
 * @method startSubscriptionMonitor
 * @param {String} id 
 * @param {Object} service 
 * @returns {void}
 */
async function startSubscriptionMonitor(id, service) {
  let groups, browseNames;
  //----------------------------------------------
  // Subscription create
  await service.subscriptionCreate(id);
  // Get server current state 
  const srvCurrentState = await service.getSrvCurrentState(id);
  if(isLog && srvCurrentState) inspector('subscriptionMonitor.srvCurrentState:', srvCurrentState);
  // Start subscriptionMonitor
  const allVariables = srvCurrentState.paramsAddressSpace.variables;
  //---- Group owners  ---//
  browseNames = allVariables.filter(v => v.hist && v.group).map(v => v.browseName);
  if(isLog && browseNames) inspector('startSubscriptionMonitor.groupOwners.browseNames:', browseNames);
  for (let index = 0; index < browseNames.length; index++) {
    const browseName = browseNames[index];
    const nodeIds = await service.getNodeIds(id, browseName);
    // Subscription monitor for group
    for (let index2 = 0; index2 < nodeIds.length; index2++) {
      const nodeId = nodeIds[index2];
      await service.subscriptionMonitor(id, '', { nodeId });
    }
    // Subscription monitor for group members
    const groupBrowseNames = allVariables.filter(v => v.ownerGroup === browseName).map(v => v.browseName);
    groups = getGroupsFromArray(groupBrowseNames, 10);
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const nodeIds = await service.getNodeIds(id, group);
      for (let index2 = 0; index2 < nodeIds.length; index2++) {
        const nodeId = nodeIds[index2];
        await service.subscriptionMonitor(id, '', { nodeId });
      }
    }
  }

  //---- Only hist values  ---//
  browseNames = allVariables.filter(v => v.hist && !v.group && !v.ownerGroup).map(v => v.browseName);
  if(isLog && browseNames) inspector('startSubscriptionMonitor.histValues.browseNames:', browseNames);
  for (let index = 0; index < browseNames.length; index++) {
    const browseName = browseNames[index];
    const nodeIds = await service.getNodeIds(id, browseName);
    // Subscription monitor for value
    for (let index2 = 0; index2 < nodeIds.length; index2++) {
      const nodeId = nodeIds[index2];
      await service.subscriptionMonitor(id, '', { nodeId });
    }
  }
}

module.exports = startSubscriptionMonitor;
