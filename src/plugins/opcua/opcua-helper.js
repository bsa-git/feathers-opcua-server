/* eslint-disable no-unused-vars */
const { join } = require('path');
const appRoot = join(__dirname, '../../../');
const moment = require('moment');
const loToInteger = require('lodash/toInteger');
const loIsObject = require('lodash/isObject');

const debug = require('debug')('app:opcua-helper');

/**
 * @method nodeIdToString
 * 
 * @param {String|Object} nodeId 
 * @returns {String}
 */
const nodeIdToString = function (nodeId = '') {
  return loIsObject(nodeId)? nodeId.toString() : nodeId;
};

/**
 * @method getNodeIdType
 * 
 * @param {String} nodeId
 * e.g. nodeId='ns=1;s=Temperature' => 's' (NodeIdType.STRING)
 * e.g. nodeId='ns=0;i=12345' => 'i' (NodeIdType.NUMERIC)
 * e.g. nodeId='ns=1;g=gsaskwqoieu323242442' => 'g' (NodeIdType.GUID)
 * e.g. nodeId='ns=0;b=adf3456...df456' => 'b' (NodeIdType.BYTESTRING)
 * @return {String}
 */
const getNodeIdType = function (nodeId = '') {
  nodeId = nodeIdToString(nodeId);
  const nodeIdType = nodeId.split(';')[1].split('=')[0];
  return nodeIdType;
};

/**
 * @method getValueFromNodeId
 * 
 * @param {String|Object} nodeId
 * e.g. nodeId='ns=1;s=Device1.Temperature' => 'Device1.Temperature'
 * @return {String}
 */
const getValueFromNodeId = function (nodeId) {
  let value = null;
  nodeId = nodeIdToString(nodeId);
  if(nodeId){
    value = nodeId.split(';')[1].split('=')[1];
  }
  return value;
};

/**
 * @method getNameSpaceFromNodeId
 * 
 * @param {String|Object} nodeId
 * e.g. nodeId='ns=1;s=Device1.Temperature' => 1
 * @return {Int|void}
 */
const getNameSpaceFromNodeId = function (nodeId = '') {
  let ns = undefined;
  nodeId = nodeIdToString(nodeId);
  if(nodeId){
    ns = nodeId.split(';')[0].split('=')[1];
    ns = loToInteger(ns);
  }
  return ns;
};


module.exports = {
  nodeIdToString,
  getNodeIdType,
  getValueFromNodeId,
  getNameSpaceFromNodeId
};
