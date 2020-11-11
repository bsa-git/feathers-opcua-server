/* eslint-disable no-unused-vars */
const {
  AttributeIds,
  TimestampsToReturn
} = require('node-opcua');

const defaultItemToMonitor = {
  nodeId: '',
  attributeId: AttributeIds.Value,
  indexRange: null,
  dataEncoding: { namespaceIndex: 0, name: null }
};

const defaultRequestedParameters = {
  samplingInterval: 3000,
  filter: null,
  queueSize: 1,
  discardOldest: true
};

const defaultTimestampsToReturn = TimestampsToReturn.Neither;

module.exports = {
  defaultItemToMonitor,
  defaultRequestedParameters,
  defaultTimestampsToReturn
};
