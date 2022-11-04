/* eslint-disable no-unused-vars */
const {
  appRoot,
  inspector,
  assert
} = require('../../../lib');

const moment = require('moment'); 
const chalk = require('chalk');
const loMerge = require('lodash/merge');

const {
  ClientSubscription
} = require('node-opcua');

const {
  isNodeId
} = require('../../../opcua/opcua-helper');

const { defaultItemToMonitor, defaultRequestedParameters } = require(`${appRoot}/src/api/opcua/config/ClientSubscriptionMonitorOptions`);

const debug = require('debug')('app:callbackSubscriptionMonitor');
const isDebug = false;

/**
 * @name callbackSubscriptionMonitor
 * @param {Object} session 
 * @param {Object} params 
 * @returns {Object}
 */
const callbackSubscriptionMonitor = async (subscription, params) => {
  let _itemToMonitor;
  //--------------------------------------------------------------
  assert(subscription, 'Subscription must be created');

  // Get subscription monitor options
  const itemToMonitor = params.subscrMonOpts.itemToMonitor;
  const requestedParameters = params.subscrMonOpts.requestedParameters;
  const timestampsToReturn = params.subscrMonOpts.timestampsToReturn;
  const callBack = params.subscrMonOpts.callBack;

  // Get itemNodeId
  if (callBack && isNodeId(itemToMonitor.nodeId)) {
    const itemNodeId = itemToMonitor.nodeId;

    // subscription.monitor
    const mergeItemToMonitor = loMerge({}, defaultItemToMonitor, itemToMonitor);
    const mergeRequestedParameters = loMerge({}, defaultRequestedParameters, requestedParameters);

    if (isDebug && mergeItemToMonitor) inspector('callbackSubscriptionMonitor.mergeItemToMonitor:', mergeItemToMonitor);
    if (isDebug && mergeRequestedParameters) inspector('callbackSubscriptionMonitor.mergeRequestedParameters:', mergeRequestedParameters);

    const monitoredItem = await subscription.monitor(
      mergeItemToMonitor,
      mergeRequestedParameters,
      timestampsToReturn
    );
    if (isDebug && monitoredItem) inspector('callbackSubscriptionMonitor.monitoredItem:', `nodeId="${monitoredItem.itemToMonitor.nodeId.value}" statusCode="${monitoredItem.statusCode.name}"`);

    _itemToMonitor = Object.assign({}, itemToMonitor);
    // Run subscriptionHandler
    monitoredItem.on('changed', (dataValue) => {
      if (isDebug && dataValue) inspector(`subscriptionMonitor.${itemNodeId}:`, dataValue);
      const value = dataValue.value.value;
      if (value === null) return;
      _itemToMonitor.locale = 'en';
      _itemToMonitor.addressSpaceOption = itemNodeId;
      _itemToMonitor.app = params.app;
      dataValue.serverTimestamp = moment().format();
      callBack(_itemToMonitor, dataValue);
    });

    return { statusCode: monitoredItem.statusCode.name, monitoredItem };
  }
  return { statusCode: 'NoSubscriptionMonitor'};
};

module.exports = callbackSubscriptionMonitor;