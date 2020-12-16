/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, appRoot, doesFileExist } = require('../lib');
const {
  extractFullyQualifiedDomainName
} = require('node-opcua');
const moment = require('moment');

const loToInteger = require('lodash/toInteger');
const loIsObject = require('lodash/isObject');

const debug = require('debug')('app:opcua-helper');
const isLog = true;
const isDebug = false;

/**
 * @method nodeIdToString
 * 
 * @param {String|Object} nodeId 
 * @returns {String}
 */
const nodeIdToString = function (nodeId = '') {
  return loIsObject(nodeId) ? nodeId.toString() : nodeId;
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
  if (nodeId) {
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
  if (nodeId) {
    ns = nodeId.split(';')[0].split('=')[1];
    ns = loToInteger(ns);
  }
  return ns;
};

/**
 * @method getOpcuaConfig
 * @param {String} id 
 * @returns {Object}
 */
const getOpcuaConfig = function (id) {
  const opcuaOptions = require(`${appRoot}/src/api/opcua/OPCUA_Config.json`);
  const opcuaOption = opcuaOptions.find(opt => opt.id === id);
  return opcuaOption;
};

/**
 * @method getSubscriptionHandler
 * @param {String} id 
 * @param {String} nameFile 
 * @returns {Function}
 */
const getSubscriptionHandler = function (id, nameFile) {
  // Get opcuaOption 
  const opcuaOptions = require(`${appRoot}/src/api/opcua/OPCUA_Config.json`);
  const opcuaOption = opcuaOptions.find(opt => opt.id === id);

  // Get subscriptionHandler
  const subscriptionHandlers = require(`${appRoot}${opcuaOption.paths.subscriptions}`);
  return subscriptionHandlers[nameFile];
};

/**
 * @method getServerService
 * @param {Object} app
 * @param {String} id 
 * @returns {Object}
 */
const getServerService = function (app = null, id) {
  let srvService = null;
  const opcuaConfig = getOpcuaConfig(id);
  if(! opcuaConfig){
    throw new errors.BadRequest(`The opcua server already exists for this id = '${id}' in the server list`);
  }
  return srvService;
};

/**
 * @method getClientService
 * @param {Object} app
 * @param {String} id 
 * @returns {Object}
 */
const getClientService = function (app = null, id) {
  let clientService = null;
  return clientService;
};


module.exports = {
  nodeIdToString,
  getNodeIdType,
  getValueFromNodeId,
  getNameSpaceFromNodeId,
  getOpcuaConfig,
  getSubscriptionHandler,
  getServerService,
  getClientService
};
