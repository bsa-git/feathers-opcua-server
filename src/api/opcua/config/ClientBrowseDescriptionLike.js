/* eslint-disable no-unused-vars */
const {
  BrowseDirection
} = require('node-opcua');

module.exports = {
  nodeId: 'ObjectsFolder',
  referenceTypeId: 'Organizes',
  browseDirection: BrowseDirection.Forward,
  includeSubtypes: true,
  nodeClassMask: 0,
  resultMask: 63
};
