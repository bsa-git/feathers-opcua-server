/* eslint-disable no-unused-vars */
const {
  logger,
  inspector,
  getInt,
  getGroupsFromArray
} = require('../../lib');

const chalk = require('chalk');

const debug = require('debug')('app:opcua-client-scripts');
const isDebug = false;

/**
 * @method startSubscriptionMonitor
 * @param {String} id 
 * @param {Object} service 
 * @returns {void}
 */
async function startSubscriptionMonitor(id, service) {
  let groups, browseNames, browseNames4Monitor = {};
  //----------------------------------------------
  // Set params
  const params = {
    // requestedPublishingInterval: 100,
    // requestedLifetimeCount: 60,
    // requestedMaxKeepAliveCount: 10,
    // maxNotificationsPerPublish: 1000,
    // publishingEnabled: true,
    // priority: 1
  };
  // Subscription create
  await service.subscriptionCreate(id, params);
  // Get server current state 
  const srvCurrentState = await service.getSrvCurrentState(id);
  if (isDebug && srvCurrentState) inspector('subscriptionMonitor.srvCurrentState:', srvCurrentState);
  // Start subscriptionMonitor
  const allVariables = srvCurrentState.paramsAddressSpace.variables;
  if (isDebug && allVariables.length) inspector('startSubscriptionMonitor.allVariables:', allVariables);
  //---- Group owners  ---//
  browseNames = allVariables.filter(v => v.hist && v.group && v.subscription).map(v => v.browseName);
  if (isDebug && browseNames.length) inspector('startSubscriptionMonitor.groupOwners.browseNames:', browseNames);
  if (browseNames.length) browseNames4Monitor.groupOwners = browseNames.length;
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
    if (isDebug && groupBrowseNames.length) inspector('startSubscriptionMonitor.groupMembers.browseNames:', groupBrowseNames);
    if (groupBrowseNames.length) browseNames4Monitor.groupMembers = groupBrowseNames.length;
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
  if (isDebug && browseNames.length) inspector('startSubscriptionMonitor.histValues.browseNames:', browseNames);
  if (browseNames.length) browseNames4Monitor.onlyHistValues = browseNames.length;
  for (let index = 0; index < browseNames.length; index++) {
    const browseName = browseNames[index];
    const nodeIds = await service.getNodeIds(id, browseName);
    // Subscription monitor for value
    for (let index2 = 0; index2 < nodeIds.length; index2++) {
      const nodeId = nodeIds[index2];
      if(isDebug && nodeId) console.log('startSubscriptionMonitor.histValues.nodeId:', nodeId);
      await service.subscriptionMonitor(id, '', { nodeId });
    }
  }

  const groupOwners = browseNames4Monitor.groupOwners;
  const groupMembers = browseNames4Monitor.groupMembers;
  const onlyHistValues = browseNames4Monitor.onlyHistValues;
  if (groupOwners || groupMembers || onlyHistValues) {
    // console.log(
    //   chalk.yellow('Client subscription monitor:'),
    //   `(groupOwners: ${getInt(groupOwners)}, groupMembers: ${getInt(groupMembers)}, onlyHistValues: ${getInt(onlyHistValues)})`
    // );
    logger.info('Client subscription monitor: (groupOwners: %d, groupMembers: %d, onlyHistValues: %d)', getInt(groupOwners), getInt(groupMembers), getInt(onlyHistValues));
  }
}

module.exports = startSubscriptionMonitor;
