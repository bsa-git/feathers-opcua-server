/* eslint-disable no-unused-vars */
const {
  inspector,
  getGroupsFromArray
} = require('../../lib');


const debug = require('debug')('app:opcua-client-scripts');
const isDebug = false;

/**
 * @method startSubscriptionMonitor
 * @param {String} id 
 * @param {Object} service 
 * @returns {void}
 */
async function startSubscriptionMonitor(id, service) {
  let groups, browseNames;
  //----------------------------------------------
  // Set params
  // const params = { 
  //   requestedPublishingInterval: 1000,
  //   requestedLifetimeCount: 60,
  //   maxNotificationsPerPublish: 1000,
  //   priority: 10 
  // };
  // Subscription create
  await service.subscriptionCreate(id);
  // Get server current state 
  const srvCurrentState = await service.getSrvCurrentState(id);
  if (isDebug && srvCurrentState) inspector('subscriptionMonitor.srvCurrentState:', srvCurrentState);
  // Start subscriptionMonitor
  const allVariables = srvCurrentState.paramsAddressSpace.variables;
  //---- Group owners  ---//
  browseNames = allVariables.filter(v => v.hist && v.group && v.subscription).map(v => v.browseName);
  if (true && browseNames.length) inspector('startSubscriptionMonitor.groupOwners.browseNames:', browseNames);
  for (let index = 0; index < browseNames.length; index++) {
    const browseName = browseNames[index];
    const nodeIds = await service.getNodeIds(id, browseName);
    // Subscription monitor for group
    for (let index2 = 0; index2 < nodeIds.length; index2++) {
      const nodeId = nodeIds[index2];
      await service.subscriptionMonitor(id, '', { nodeId });
    }
    // Subscription monitor for group members
    const groupBrowseNames = allVariables.filter(v => v.hist && (v.ownerGroup === browseName) && v.subscription).map(v => v.browseName);
    if (true && groupBrowseNames.length) inspector('startSubscriptionMonitor.groupBrowseNames:', groupBrowseNames);
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
  browseNames = allVariables.filter(v => v.hist && !v.group && !v.ownerGroup && v.subscription).map(v => v.browseName);
  if (true && browseNames.length) inspector('startSubscriptionMonitor.histValues.browseNames:', browseNames);
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
