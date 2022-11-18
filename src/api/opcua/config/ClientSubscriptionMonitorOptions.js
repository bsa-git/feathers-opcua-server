/* eslint-disable no-unused-vars */
const {
  AttributeIds,
  // TimestampsToReturn
} = require('node-opcua');

/** 
TimestampsToReturn {
  Source = 0,
  Server = 1,
  Both = 2,
  Neither = 3,
  Invalid = 4
}
*/

const defaultItemToMonitor = {
  nodeId: '',
  attributeId: AttributeIds.Value,
  indexRange: null,
  dataEncoding: { namespaceIndex: 0, name: null }
};

const defaultRequestedParameters = {
  samplingInterval: 100, // depends
  filter: null,
  queueSize: 10, // depends
  discardOldest: true
};

// const defaultTimestampsToReturn = TimestampsToReturn.Neither;

module.exports = {
  defaultItemToMonitor,
  defaultRequestedParameters,
  // defaultTimestampsToReturn
};
